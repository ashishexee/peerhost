import 'dart:async';
import 'dart:convert';
import 'dart:typed_data';
import 'package:web3dart/web3dart.dart';
import 'package:web3dart/crypto.dart';
import 'package:web_socket_channel/io.dart';
import 'package:http/http.dart';
import 'package:logger/logger.dart';
import '../utils/constants.dart';
import 'wallet_service.dart';

class BlockchainService {
  late Web3Client _client;
  late String _rpcUrl;
  late String _wsUrl;
  final Logger _logger = Logger();
  final WalletService _walletService = WalletService();

  DeployedContract? _executionContract;

  BlockchainService() {
    _rpcUrl = RPC_URL;
    _wsUrl = RPC_URL.replaceFirst('http', 'ws');

    _client = Web3Client(
      _rpcUrl,
      Client(),
      socketConnector: () {
        return IOWebSocketChannel.connect(_wsUrl).cast<String>();
      },
    );
  }

  Future<void> initialize() async {
    _logger.i("Connecting to Blockchain at $_rpcUrl");

    final contractAbi = ContractAbi.fromJson(
      EXECUTION_COORDINATOR_ABI,
      "ExecutionCoordinator",
    );
    final contractAddress = EthereumAddress.fromHex(EXECUTION_CONTRACT_ADDRESS);

    _executionContract = DeployedContract(contractAbi, contractAddress);
  }

  Stream<FilterEvent> listenForRequests() {
    if (_executionContract == null) throw Exception("Contract not initialized");

    final event = _executionContract!.event('ExecutionRequested');
    final filter = FilterOptions.events(
      contract: _executionContract!,
      event: event,
    );

    _logger.i("Listening for ExecutionRequested events...");
    return _client.events(filter);
  }

  Stream<Map<String, dynamic>> listenForDecodedRequests() {
    return listenForRequests().asyncMap((event) async {
      final decoded = _executionContract!
          .event('ExecutionRequested')
          .decodeResults(event.topics ?? [], event.data ?? '');

      final requestIdBytes = decoded[4] as List<int>;
      final requestIdBigInt = bytesToInt(requestIdBytes);
      return {
        'wallet': decoded[0].toString(),
        'project': decoded[1],
        'fn': decoded[2],
        'cid': decoded[3],
        'requestId': requestIdBigInt.toString(),
      };
    });
  }

  BigInt bytesToInt(List<int> bytes) {
    BigInt result = BigInt.from(0);
    for (int i = 0; i < bytes.length; i++) {
      result = (result << 8) + BigInt.from(bytes[i]);
    }
    return result;
  }

  /// Fetch code from IPFS (via Gateway or direct)
  Future<String> fetchCode(String cid) async {
    final List<String> gateways = [
      "https://gateway.pinata.cloud/ipfs/",
      "https://ipfs.io/ipfs/",
      "https://dweb.link/ipfs/",
    ];

    for (var gateway in gateways) {
      try {
        _logger.d("Fetching code from $gateway$cid");
        final response = await get(
          Uri.parse("$gateway$cid"),
        ).timeout(const Duration(seconds: 10));

        if (response.statusCode == 200) {
          return response.body;
        }
      } catch (e) {
        _logger.w("Failed to fetch from $gateway: $e");
      }
    }
    throw Exception("Failed to fetch code from any IPFS gateway");
  }

  Future<Map<String, dynamic>> fetchInputs(String requestId) async {
    BigInt id = BigInt.parse(requestId);
    String requestUrl = "$GATEWAY_URL/_internal/requests/$id";

    _logger.d("Fetching inputs from $requestUrl");

    for (int i = 0; i < 5; i++) {
      try {
        final response = await get(
          Uri.parse(requestUrl),
        ).timeout(const Duration(seconds: 5));
        if (response.statusCode == 200) {
          return jsonDecode(response.body) as Map<String, dynamic>;
        }
      } catch (e) {
        _logger.e("Failed to fetch inputs from $requestUrl: $e");
        await Future.delayed(const Duration(seconds: 1));
      }
    }
    throw Exception("Failed to fetch inputs");
  }

  Future<void> submitResultOffChain(
    String requestIdString,
    String resultString,
  ) async {
    _logger.i("Signing result off-chain for $requestIdString");

    final credentials = await _walletService.getOrGenerateWorkerKey();
    final workerAddress = (await credentials.extractAddress()).hex;
    BigInt rid = BigInt.parse(requestIdString);
    final requestIdBytes = bigIntToBytes(rid);
    final resultBytes = utf8.encode(resultString);
    final resultHashBytes = keccak256(Uint8List.fromList(resultBytes));
    final resultHashHex = bytesToHex(resultHashBytes, include0x: true);
    final payloadToHash = Uint8List.fromList([
      ...requestIdBytes,
      ...resultHashBytes,
    ]);
    final messageHash = keccak256(payloadToHash);

    final signature = await credentials.signPersonalMessage(messageHash);
    final signatureHex = bytesToHex(signature, include0x: true);

    _logger.i("Signature generated: $signatureHex");
    String submissionUrl = "$GATEWAY_URL/_internal/submit-signature";

    try {
      final response = await post(
        Uri.parse(submissionUrl),
        headers: {'Content-Type': 'application/json'},
        body: jsonEncode({
          "requestId": requestIdString,
          "workerAddress": workerAddress,
          "signature": signatureHex,
          "resultHash": resultHashHex,
          "result": jsonDecode(
            resultString,
          ), // Send actual JSON object if possible
        }),
      );

      if (response.statusCode == 200) {
        _logger.i("Signature submitted successfully to Gateway");
      } else {
        _logger.e(
          "Gateway rejected submission: ${response.statusCode} - ${response.body}",
        );
        throw Exception("Gateway rejected submission");
      }
    } catch (e) {
      _logger.e("Failed to submit signature: $e");
      rethrow;
    }
  }

  Uint8List bigIntToBytes(BigInt number) {
    var bytes = Uint8List(32);
    for (var i = 31; i >= 0; i--) {
      bytes[i] = (number & BigInt.from(0xFF)).toInt();
      number = number >> 8;
    }
    return bytes;
  }

  List<int> hexToBytes(String hex) {
    if (hex.startsWith("0x")) {
      hex = hex.substring(2);
    }
    List<int> bytes = [];
    for (int i = 0; i < hex.length; i += 2) {
      var byte = hex.substring(i, i + 2);
      bytes.add(int.parse(byte, radix: 16));
    }
    return bytes;
  }

  Future<EtherAmount> getWorkerBalance(String address) async {
    return await _client.getBalance(EthereumAddress.fromHex(address));
  }

  Future<List<String>> getWorkersForUser(String userAddress) async {
    if (_executionContract == null) await initialize();

    final function = _executionContract!.function('getUserWorkers');
    final result = await _client.call(
      contract: _executionContract!,
      function: function,
      params: [EthereumAddress.fromHex(userAddress)],
    );

    final List<dynamic> workers = result[0];
    return workers.map((e) => (e as EthereumAddress).hex).toList();
  }

  Future<String> getUserForWorker(String workerAddress) async {
    if (_executionContract == null) await initialize();

    final function = _executionContract!.function('workerToUser');
    final result = await _client.call(
      contract: _executionContract!,
      function: function,
      params: [EthereumAddress.fromHex(workerAddress)],
    );

    return (result[0] as EthereumAddress).hex;
  }

  Future<Map<String, dynamic>> getWorkerStakeInfo(String workerAddress) async {
    if (_executionContract == null) await initialize();

    final function = _executionContract!.function('workerStakes');
    final result = await _client.call(
      contract: _executionContract!,
      function: function,
      params: [EthereumAddress.fromHex(workerAddress)],
    );
    return {
      'stakedAmount':
          (result[0] as BigInt).toDouble() /
          1e18, // Convert Wei to Eth (float for UI)
      'isBlacklisted': result[1] as bool,
      'probationCount': (result[2] as BigInt).toInt(),
      'penaltyDeposited': (result[3] as BigInt).toDouble() / 1e18,
    };
  }
}

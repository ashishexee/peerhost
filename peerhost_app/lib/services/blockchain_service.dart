import 'dart:async';
import 'dart:convert';
import 'package:web3dart/web3dart.dart';
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

  // Contract
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
    final contractAddress = EthereumAddress.fromHex(
      EXECUTION_COORDINATOR_ADDRESS,
    );

    _executionContract = DeployedContract(contractAbi, contractAddress);
  }

  /// Listen for ExecutionRequested events
  Stream<FilterEvent> listenForRequests() {
    if (_executionContract == null) throw Exception("Contract not initialized");

    final event = _executionContract!.event('ExecutionRequested');

    // Create filter params
    final filter = FilterOptions.events(
      contract: _executionContract!,
      event: event,
    );

    _logger.i("Listening for ExecutionRequested events...");
    return _client.events(filter);
  }

  /// Listen for decoded requests (User Friendly stream)
  Stream<Map<String, dynamic>> listenForDecodedRequests() {
    return listenForRequests().asyncMap((event) async {
      final decoded = _executionContract!
          .event('ExecutionRequested')
          .decodeResults(event.topics ?? [], event.data ?? '');

      // ABI: event ExecutionRequested(address indexed wallet, string project, string fn, string cid, uint256 requestId)
      return {
        'wallet': decoded[0].toString(),
        'project': decoded[1],
        'fn': decoded[2],
        'cid': decoded[3],
        'requestId': decoded[4].toString(),
      };
    });
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

  /// Fetch inputs from the PeerHost Gateway
  Future<Map<String, dynamic>> fetchInputs(String requestId) async {
    // Convert BigInt requestId to string if needed, but usually it's passed as is
    // The contract emits bytes32, but gateway usually expects decimal string or hex.
    // Let's assume the Gateway expects the Decimal representation of the ID.

    // We need to convert bytes32 hex to BigInt then toString()
    BigInt id = BigInt.parse(requestId);
    String url = "$GATEWAY_URL/_internal/requests/$id";

    _logger.d("Fetching inputs from $url");

    // Retry logic
    for (int i = 0; i < 5; i++) {
      try {
        final response = await get(
          Uri.parse(url),
        ).timeout(const Duration(seconds: 5));
        if (response.statusCode == 200) {
          return jsonDecode(response.body) as Map<String, dynamic>;
        }
      } catch (e) {
        await Future.delayed(const Duration(seconds: 1));
      }
    }
    throw Exception("Failed to fetch inputs");
  }

  /// Submit result on-chain using the Session Key
  Future<String> submitResult(String requestIdHex, String resultHash) async {
    _logger.i("Submitting result on-chain for $requestIdHex");

    final credentials = await _walletService.getOrGenerateWorkerKey();

    final function = _executionContract!.function('submitResult');

    // Convert hex strings to bytes
    final requestIdBytes = hexToBytes(requestIdHex);
    final resultHashBytes = hexToBytes(resultHash);

    try {
      final txHash = await _client.sendTransaction(
        credentials,
        Transaction.callContract(
          contract: _executionContract!,
          function: function,
          parameters: [requestIdBytes, resultHashBytes],
          maxGas: 500000,
        ),
        chainId: 31337, // Localhost / Hardhat Chain ID
      );

      _logger.e("Transaction submitted: $txHash");
      return txHash;
    } catch (e) {
      _logger.e("Failed to submit result: $e");
      rethrow;
    }
  }

  // Helper utils
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

  /// Get Native Balance (Amoy)
  Future<EtherAmount> getWorkerBalance(String address) async {
    return await _client.getBalance(EthereumAddress.fromHex(address));
  }

  /// Get Workers for a User Request
  Future<List<String>> getWorkersForUser(String userAddress) async {
    if (_executionContract == null) await initialize();

    final function = _executionContract!.function('getUserWorkers');
    final result = await _client.call(
      contract: _executionContract!,
      function: function,
      params: [EthereumAddress.fromHex(userAddress)],
    );

    // result[0] is List<EthereumAddress>
    final List<dynamic> workers = result[0];
    return workers.map((e) => (e as EthereumAddress).hex).toList();
  }
}

import 'dart:async';
import 'package:flutter/material.dart';
import 'package:peerhost_app/utils/constants.dart';
import 'package:url_launcher/url_launcher.dart';
import 'package:walletconnect_flutter_v2/walletconnect_flutter_v2.dart';
import 'package:app_links/app_links.dart';

class WalletConnectService with WidgetsBindingObserver {
  static final WalletConnectService _instance =
      WalletConnectService._internal();

  factory WalletConnectService() => _instance;

  WalletConnectService._internal() {
    WidgetsBinding.instance.addObserver(this);
  }

  final _logger = Logger();
  late Web3App _web3App;
  late AppLinks _appLinks;
  StreamSubscription? _linkSubscription;
  SessionData? _sessionData;

  static const projectId = '3ebcf34d26430268a7e89bcc0916d840';

  bool _isInitialized = false;

  bool get isInitialized => _isInitialized;

  bool get isConnected => _sessionData != null;

  String? get connectedAddress {
    if (_sessionData == null) return null;
    final namespace = _sessionData!.namespaces['eip155'];
    if (namespace == null || namespace.accounts.isEmpty) return null;
    final account = namespace.accounts.first;
    return account.split(':').last;
  }

  final ValueNotifier<bool> connectionNotifier = ValueNotifier(false);
  ValueNotifier<bool> get modal => connectionNotifier;

  @override
  void didChangeAppLifecycleState(AppLifecycleState state) {
    if (state == AppLifecycleState.resumed) {
      _logger.i("App resumed, starting session check polling...");
      _checkForSession();
    }
  }

  Future<void> _checkForSession() async {
    if (!_isInitialized) return;

    // Force reconnection to relay if needed
    try {
      _logger.i("Forcing relay connection...");
      await _web3App.core.relayClient.connect();
      _logger.i(
        "Relay connected status: ${_web3App.core.relayClient.isConnected}",
      );
    } catch (e) {
      _logger.w("Failed to force relay connect: $e");
    }

    // Poll for 10 seconds after resume to catch the session arriving via socket
    int retries = 0;
    while (retries < 20) {
      try {
        final sessions = _web3App.sessions.getAll();
        if (sessions.isNotEmpty) {
          _sessionData = sessions.first;
          connectionNotifier.value = true;
          _logger.i(
            "Session found on resume (attempt ${retries + 1}): $connectedAddress",
          );
          return;
        }
      } catch (e) {
        _logger.e("Error checking sessions on resume: $e");
      }
      await Future.delayed(const Duration(milliseconds: 500));
      retries++;
    }

    _logger.w(
      "No session found after 10s polling. "
      "RelayConnected: ${_web3App.core.relayClient.isConnected}, "
      "Pairings: ${_web3App.pairings.getAll().length}",
    );
  }

  Future<bool> initialize(BuildContext context) async {
    if (_isInitialized) return true;

    try {
      _appLinks = AppLinks();
      _linkSubscription = _appLinks.uriLinkStream.listen((uri) {
        _logger.i("Received deep link: $uri");
        _checkForSession();
      });

      // ignore: deprecated_member_use
      _web3App = await Web3App.createInstance(
        projectId: projectId,
        metadata: const PairingMetadata(
          name: 'PeerHost Worker',
          description: 'PeerHost Worker Node',
          url: 'https://peerhost.com',
          icons: ['https://peerhost.com/icon.png'],
          redirect: Redirect(
            native: 'peerhost://',
            universal: 'https://peerhost.com',
            linkMode: false,
          ),
        ),
      );

      _web3App.onSessionDelete.subscribe(_onSessionDelete);
      _web3App.onSessionExpire.subscribe(_onSessionExpire);
      _web3App.onSessionUpdate.subscribe(_onSessionUpdate);
      _web3App.onSessionConnect.subscribe(_onSessionConnect);

      _checkForSession();

      _isInitialized = true;
      return true;
    } catch (e) {
      _logger.e("Error initializing WalletConnect: $e");
      return false;
    }
  }

  // ... _onSessionDelete, _onSessionExpire, etc stay same ...

  void _onSessionDelete(SessionDelete? args) {
    _logger.i("Session deleted");
    _sessionData = null;
    connectionNotifier.value = false;
  }

  void _onSessionExpire(SessionExpire? args) {
    _logger.i("Session expired");
    _sessionData = null;
    connectionNotifier.value = false;
  }

  void _onSessionUpdate(SessionUpdate? args) {
    _logger.i("Session updated");
  }

  void _onSessionConnect(SessionConnect? args) {
    if (args != null) {
      _sessionData = args.session;
      connectionNotifier.value = true;
      _logger.i("Session Connected from Event: $connectedAddress");
    }
  }

  Future<void> openModal(BuildContext context) async {
    if (!_isInitialized) {
      await initialize(context);
    }

    if (isConnected) {
      _logger.w("Already connected");
      return;
    }

    ConnectResponse resp = await _web3App.connect(
      requiredNamespaces: {},
      optionalNamespaces: {
        'eip155': const RequiredNamespace(
          chains: ['eip155:1', 'eip155:137', 'eip155:80001', 'eip155:80002'],
          methods: [
            'eth_sendTransaction',
            'eth_signTransaction',
            'personal_sign',
            'eth_signTypedData',
          ],
          events: ['chainChanged', 'accountsChanged'],
        ),
      },
    );

    final Uri? uri = resp.uri;
    if (uri != null) {
      _launchWallet(uri);
    }

    try {
      // We await the session future, but we also rely on _onSessionConnect event.
      // If this throws/times out due to app backgrounding, the event listener should still catch it
      // when the socket reconnects.
      final SessionData session = await resp.session.future;
      _sessionData = session;
      connectionNotifier.value = true;
      _logger.i("Connected to $connectedAddress");
    } catch (e) {
      _logger.w(
        "Session future timed out or failed (likely due to backgrounding), waiting for event: $e",
      );
      // Wait for up to 120 seconds for the event listener to pick it up,
      // AND explicitly check sessions list in case event was missed.
      int retries = 0;
      while (retries < 240) {
        // 240 * 500ms = 120 seconds
        _checkForSession(); // Force check on every loop as well
        if (isConnected) return; // Success!

        await Future.delayed(const Duration(milliseconds: 500));
        retries++;
      }

      if (!isConnected) {
        _logger.e("Connection timed out completely.");
      }
    }
  }

  Future<void> _launchWallet(Uri uri) async {
    _logger.i("Original Wallet URI: $uri");

    // 1. Attempt to construct a deep link with explicit redirect for standard Wallets
    // Many wallets (like MetaMask) look for 'redirectUrl' or 'redirect' param
    String uriString = uri.toString();
    if (!uriString.contains('redirectUrl=')) {
      uriString =
          '$uriString&redirectUrl=${Uri.encodeComponent("peerhost://")}';
    }

    final expandedUri = Uri.parse(uriString);
    _logger.i("Launching Enhanced URI: $expandedUri");

    try {
      if (await canLaunchUrl(expandedUri)) {
        await launchUrl(expandedUri, mode: LaunchMode.externalApplication);
        return;
      }
    } catch (e) {
      _logger.w("Failed to launch enhanced URI: $e");
    }

    // 2. Fallback/Alternative for MetaMask specifically if generic fails or just to be safe
    // This format is often more reliable for MetaMask on Android
    final wcEncoded = Uri.encodeComponent(uri.toString());
    final metaMaskUrl = Uri.parse(
      'https://metamask.app.link/wc?uri=$wcEncoded&redirect=peerhost://',
    );

    try {
      if (await canLaunchUrl(metaMaskUrl)) {
        _logger.i("Launching MetaMask specific Universal Link: $metaMaskUrl");
        await launchUrl(metaMaskUrl, mode: LaunchMode.externalApplication);
        return;
      }
    } catch (e) {
      _logger.w("Failed to launch MetaMask link: $e");
    }

    // 3. Final Fallback to original
    if (await canLaunchUrl(uri)) {
      await launchUrl(uri, mode: LaunchMode.externalApplication);
    } else {
      _logger.e('Could not launch wallet url: $uri');
    }
  }

  Future<void> disconnect() async {
    if (_sessionData != null) {
      await _web3App.disconnectSession(
        topic: _sessionData!.topic,
        reason: const WalletConnectError(code: 0, message: 'User disconnected'),
      );
      _sessionData = null;
      connectionNotifier.value = false;
    }
  }

  Future<String> authorizeWorker(String workerAddress) async {
    if (!isConnected) throw Exception("Not connected");

    final chainIdString = 'eip155:80002'; // Amoy
    final sender = connectedAddress!;

    final tx = EthereumTransaction(
      from: sender,
      to: EXECUTION_COORDINATOR_ADDRESS,
      data: _encodeRegisterWorker(workerAddress),
    );

    _launchWalletApp();

    final result = await _web3App.request(
      topic: _sessionData!.topic,
      chainId: chainIdString,
      request: SessionRequestParams(
        method: 'eth_sendTransaction',
        params: [tx.toJson()],
      ),
    );

    return result.toString();
  }

  Future<String> registerWorker(String workerAddress) async {
    if (!isConnected) throw Exception("Not connected");
    final chainIdString = 'eip155:80002';
    final sender = connectedAddress!;

    final tx = EthereumTransaction(
      from: sender,
      to: EXECUTION_COORDINATOR_ADDRESS,
      data: _encodeRegisterWorker(workerAddress),
    );

    _launchWalletApp();

    final result = await _web3App.request(
      topic: _sessionData!.topic,
      chainId: chainIdString,
      request: SessionRequestParams(
        method: 'eth_sendTransaction',
        params: [tx.toJson()],
      ),
    );
    return result.toString();
  }

  void _launchWalletApp() {
    if (_sessionData?.peer.metadata.redirect != null) {
      final native = _sessionData!.peer.metadata.redirect?.native;
      final universal = _sessionData!.peer.metadata.redirect?.universal;

      String? target;
      if (native != null && native.isNotEmpty) {
        target = native;
      } else if (universal != null && universal.isNotEmpty) {
        target = universal;
      }

      if (target != null) {
        try {
          final uri = Uri.parse(target);
          _launchWallet(uri);
        } catch (e) {
          _logger.e("Failed to launch wallet app for signing: $e");
        }
      }
    }
  }

  String _encodeRegisterWorker(String address) {
    final contract = DeployedContract(
      ContractAbi.fromJson(EXECUTION_COORDINATOR_ABI, "Coordinator"),
      EthereumAddress.fromHex(EXECUTION_COORDINATOR_ADDRESS),
    );
    final function = contract.function("registerWorker");
    final data = function.encodeCall([EthereumAddress.fromHex(address)]);
    return bytesToHex(data, include0x: true);
  }
}

class EthereumTransaction {
  final String from;
  final String to;
  final String data;
  final String? value;

  EthereumTransaction({
    required this.from,
    required this.to,
    required this.data,
    this.value,
  });

  Map<String, dynamic> toJson() {
    return {
      'from': from,
      'to': to,
      'data': data,
      if (value != null) 'value': value,
    };
  }
}

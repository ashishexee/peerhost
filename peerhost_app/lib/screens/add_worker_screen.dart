import 'package:flutter/material.dart';
import 'dart:async';
import 'package:peerhost_app/services/blockchain_service.dart';
import 'package:peerhost_app/services/wallet_service.dart';
import 'package:peerhost_app/services/wallet_connect_service.dart';
import 'package:peerhost_app/widgets/modern_button.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:web3dart/web3dart.dart';

class AddWorkerScreen extends StatefulWidget {
  const AddWorkerScreen({super.key});

  @override
  State<AddWorkerScreen> createState() => _AddWorkerScreenState();
}

class _AddWorkerScreenState extends State<AddWorkerScreen>
    with WidgetsBindingObserver {
  final WalletService _walletService = WalletService();
  final WalletConnectService _wcService = WalletConnectService();
  final BlockchainService _blockchainService = BlockchainService();

  String? _workerAddress;
  bool _isLoading = false;
  String? _error;
  Timer? _pollTimer;
  bool _isPolling = false;

  String? _privateKey;
  bool _showKey = false;

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addObserver(this);
    _initWorker();
  }

  @override
  void dispose() {
    WidgetsBinding.instance.removeObserver(this);
    _pollTimer?.cancel();
    super.dispose();
  }

  @override
  void didChangeAppLifecycleState(AppLifecycleState state) {
    if (state == AppLifecycleState.resumed &&
        _isLoading &&
        _workerAddress != null) {
      debugPrint("App resumed while loading. Starting registration poll...");
      _startPolling();
    }
  }

  void _startPolling() {
    if (_isPolling) return;
    _isPolling = true;
    _pollRegistrationLoop();
  }

  Future<void> _pollRegistrationLoop() async {
    if (!mounted || !_isPolling) return;

    await _checkRegistration();

    // Wait 3 seconds before next poll, but check mounted again
    if (mounted && _isPolling) {
      Future.delayed(const Duration(seconds: 3), _pollRegistrationLoop);
    }
  }

  Future<void> _checkRegistration() async {
    try {
      final userAddress = _wcService.connectedAddress;
      if (userAddress == null) return;

      debugPrint("Polling: Fetching workers for $userAddress...");

      // Add timeout to prevent hanging forever
      final workers = await _blockchainService
          .getWorkersForUser(userAddress)
          .timeout(const Duration(seconds: 5));

      debugPrint("Polling: Found ${workers.length} workers on chain.");

      if (workers.any(
        (w) => w.toLowerCase() == _workerAddress?.toLowerCase(),
      )) {
        _isPolling = false; // Stop polling
        debugPrint("Worker found on chain! Navigating...");
        await _onRegistrationSuccess();
      }
    } catch (e) {
      debugPrint("Polling error (ignoring and retrying): $e");
    }
  }

  Future<void> _onRegistrationSuccess() async {
    await _walletService.setAuthorized(true);
    if (mounted) {
      setState(() => _isLoading = false);
      Navigator.of(context).pushReplacementNamed('/funding');
    }
  }

  Future<void> _initWorker() async {
    // Generate (or fetch existing) key for this device
    final key = await _walletService.getOrGenerateWorkerKey();
    _updateKeyDisplay(key);
  }

  Future<void> _regenerateKey() async {
    setState(() => _workerAddress = null);
    final key = await _walletService.regenerateWorkerKey();
    _updateKeyDisplay(key);
  }

  void _updateKeyDisplay(EthPrivateKey key) {
    final keyBytes = key.privateKey;
    String hex = "0x";
    for (var byte in keyBytes) {
      hex += byte.toRadixString(16).padLeft(2, '0');
    }
    setState(() {
      _workerAddress = key.address.hex;
      _privateKey = hex;
    });
  }

  Future<void> _registerWorker() async {
    if (_workerAddress == null) return;
    setState(() {
      _isLoading = true;
      _error = null;
    });

    try {
      // 1. Check connection (should pass if flow is correct)
      if (!_wcService.isConnected) {
        throw Exception("Wallet disconnected. Please login again.");
      }

      // 2. Register Worker (Send Transaction)
      // This will launch wallet for signing.
      final txHash = await _wcService.registerWorker(_workerAddress!);
      debugPrint("Registration TX: $txHash");

      // 3. Update State & Navigate
      await _walletService.setAuthorized(true);

      if (mounted) {
        Navigator.of(context).pushReplacementNamed('/funding');
      }
    } catch (e) {
      debugPrint("Linking failed: $e");
      setState(() {
        _isLoading = false;
        _error = e.toString().replaceAll("Exception:", "");
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.black,
      appBar: AppBar(
        title: Text(
          "Add New Worker",
          style: GoogleFonts.spaceGrotesk(color: Colors.white),
        ),
        backgroundColor: Colors.black,
        iconTheme: const IconThemeData(color: Colors.white),
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(24.0),
        child: Column(
          children: [
            const Icon(Icons.memory, size: 60, color: Color(0xFF00FF94)),
            const SizedBox(height: 20),
            Text(
              "Register This Device",
              style: GoogleFonts.spaceGrotesk(
                fontSize: 24,
                color: Colors.white,
              ),
            ),
            const SizedBox(height: 10),

            // WARNING CARD
            Container(
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: Colors.amber.withOpacity(0.1),
                border: Border.all(color: Colors.amber),
                borderRadius: BorderRadius.circular(12),
              ),
              child: Column(
                children: [
                  Row(
                    children: [
                      const Icon(
                        Icons.warning_amber_rounded,
                        color: Colors.amber,
                      ),
                      const SizedBox(width: 10),
                      Text(
                        "IMPORTANT",
                        style: GoogleFonts.spaceGrotesk(
                          fontWeight: FontWeight.bold,
                          color: Colors.amber,
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 8),
                  Text(
                    "Copy this Private Key somewhere safe! If this app data is cleared, you will lose access to this worker and its gas funds.",
                    style: GoogleFonts.inter(
                      color: Colors.grey[300],
                      fontSize: 13,
                    ),
                  ),
                  const SizedBox(height: 6),
                  Text(
                    "Note: Compromise of this key ONLY affects this worker's gas, not your main wallet.",
                    style: GoogleFonts.inter(
                      color: Colors.grey[500],
                      fontSize: 12,
                      fontStyle: FontStyle.italic,
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 20),

            // KEY DISPLAY
            Container(
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: Colors.grey[900],
                borderRadius: BorderRadius.circular(12),
                border: Border.all(color: Colors.grey[800]!),
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    "Worker Address (Public)",
                    style: GoogleFonts.inter(fontSize: 12, color: Colors.grey),
                  ),
                  const SizedBox(height: 4),
                  SelectableText(
                    _workerAddress ?? "Generating...",
                    style: GoogleFonts.jetBrainsMono(
                      color: Colors.white,
                      fontSize: 14,
                    ),
                    textAlign: TextAlign.center,
                  ),
                  const Divider(color: Colors.grey),
                  Text(
                    "Worker Private Key (SECRET)",
                    style: GoogleFonts.inter(
                      fontSize: 12,
                      color: Colors.redAccent,
                    ),
                  ),
                  const SizedBox(height: 4),
                  Row(
                    children: [
                      Expanded(
                        child: SelectableText(
                          _showKey
                              ? (_privateKey ?? "...")
                              : "••••••••••••••••••••••••••••••",
                          style: GoogleFonts.jetBrainsMono(
                            color: Colors.white,
                            fontSize: 14,
                          ),
                        ),
                      ),
                      IconButton(
                        icon: Icon(
                          _showKey ? Icons.visibility_off : Icons.visibility,
                          color: Colors.grey,
                        ),
                        onPressed: () => setState(() => _showKey = !_showKey),
                      ),
                    ],
                  ),
                ],
              ),
            ),

            const SizedBox(height: 30),

            if (_error != null)
              Padding(
                padding: const EdgeInsets.only(bottom: 20),
                child: Text(_error!, style: const TextStyle(color: Colors.red)),
              ),

            TextButton(
              onPressed: _isLoading ? null : _regenerateKey,
              child: Text(
                "Generate New Key",
                style: GoogleFonts.inter(color: Colors.grey),
              ),
            ),
            const SizedBox(height: 10),

            ModernButton(
              text: _isLoading ? "Waiting for Approval..." : "Register Worker",
              onPressed: _isLoading ? () {} : _registerWorker,
              icon: _isLoading ? Icons.hourglass_empty : Icons.fingerprint,
              color: const Color(0xFF00FF94),
              textColor: Colors.black,
            ),
            const SizedBox(height: 30),
          ],
        ),
      ),
    );
  }
}

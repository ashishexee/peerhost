import 'package:flutter/material.dart';
import 'package:peerhost_app/services/wallet_service.dart';
import 'package:peerhost_app/services/wallet_connect_service.dart';
import 'package:peerhost_app/main.dart'; //
import 'package:logger/logger.dart';

class WorkerOnboardingScreen extends StatefulWidget {
  const WorkerOnboardingScreen({super.key});

  @override
  State<WorkerOnboardingScreen> createState() => _WorkerOnboardingScreenState();
}

class _WorkerOnboardingScreenState extends State<WorkerOnboardingScreen> {
  final WalletService _walletService = WalletService();
  final WalletConnectService _wcService = WalletConnectService();

  String? _workerAddress;
  bool _isGenerating = false;
  bool _isLinking = false;
  bool _isLinked = false;
  String? _error;

  @override
  void initState() {
    super.initState();
    _checkExistingWorker();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      _wcService.initialize(context);
      _wcService.connectionNotifier.addListener(_onConnectionChange);
    });
  }

  @override
  void dispose() {
    _wcService.connectionNotifier.removeListener(_onConnectionChange);
    super.dispose();
  }

  void _onConnectionChange() {
    // If we are unexpectedly disconnected or connected, refresh state
    setState(() {});
  }

  Future<void> _checkExistingWorker() async {
    try {
      final key = await _walletService.getOrGenerateWorkerKey();
      setState(() {
        _workerAddress = key.address.hex;
      });

      final authorized = await _walletService.isAuthorized();
      if (authorized) {
        _navigateToMain();
      }
    } catch (e) {
      Logger().e("Error checking worker: $e");
    }
  }

  Future<void> _generateAccount() async {
    setState(() => _isGenerating = true);
    await _checkExistingWorker();
    setState(() => _isGenerating = false);
  }

  Future<void> _linkAccount() async {
    if (_workerAddress == null) return;
    setState(() {
      _isLinking = true;
      _error = null;
    });

    try {
      // 1. Ensure Connected
      if (!_wcService.isConnected) {
        // This will launch wallet.
        // We expect the user to approve and COME BACK.
        await _wcService.openModal(context);

        // After openModal returns (either success, timeout, or user switch back)
        if (!_wcService.isConnected) {
          // We don't throw immediately if timeout occurred but we are still waiting?
          // But openModal now waits 120s. If it returns and still not connected, it failed.
          throw Exception(
            "Wallet not connected. Please try again and switch back to this app manually.",
          );
        }
      }

      // 2. Register Worker (Send Transaction)
      // This will launch wallet AGAIN for signing.
      final txHash = await _wcService.registerWorker(_workerAddress!);
      Logger().i("Registration TX: $txHash");

      // 3. Update State
      await _walletService.setAuthorized(true);
      setState(() {
        _isLinked = true;
        _isLinking = false;
      });

      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text(
            "Worker Linked Successfully! Chain confirmation pending.",
          ),
        ),
      );

      await Future.delayed(const Duration(seconds: 2));
      _navigateToMain();
    } catch (e) {
      Logger().e("Linking failed: $e");
      setState(() {
        _isLinking = false;
        _error = e.toString().replaceAll("Exception:", "");
      });
    }
  }

  void _navigateToMain() {
    Navigator.of(context).pushReplacement(
      MaterialPageRoute(builder: (_) => const ServiceControlScreen()),
    );
  }

  @override
  Widget build(BuildContext context) {
    final bool isConnected = _wcService.isConnected;

    return Scaffold(
      appBar: AppBar(title: const Text("Worker Setup")),
      body: Padding(
        padding: const EdgeInsets.all(24.0),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            const Icon(Icons.security, size: 80, color: Colors.deepPurple),
            const SizedBox(height: 24),
            Text(
              "Setup Your Worker Node",
              style: Theme.of(context).textTheme.headlineMedium,
              textAlign: TextAlign.center,
            ),
            const SizedBox(height: 16),
            const Text(
              "To earn rewards, you need a dedicated Worker Account. This account runs securely on your device.",
              textAlign: TextAlign.center,
              style: TextStyle(fontSize: 16, color: Colors.grey),
            ),
            const SizedBox(height: 40),

            if (_workerAddress == null) ...[
              ElevatedButton(
                onPressed: _isGenerating ? null : _generateAccount,
                style: ElevatedButton.styleFrom(
                  padding: const EdgeInsets.all(16),
                ),
                child: _isGenerating
                    ? const CircularProgressIndicator()
                    : const Text("Generate Worker Account"),
              ),
            ] else ...[
              Container(
                padding: const EdgeInsets.all(16),
                decoration: BoxDecoration(
                  color: Colors.grey[100],
                  borderRadius: BorderRadius.circular(12),
                  border: Border.all(color: Colors.grey[300]!),
                ),
                child: Column(
                  children: [
                    const Text(
                      "Your Worker Address",
                      style: TextStyle(fontWeight: FontWeight.bold),
                    ),
                    const SizedBox(height: 8),
                    SelectableText(
                      _workerAddress!,
                      style: const TextStyle(
                        fontFamily: 'Courier',
                        fontSize: 13,
                      ),
                      textAlign: TextAlign.center,
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 24),

              if (isConnected)
                Container(
                  padding: const EdgeInsets.all(12),
                  color: Colors.green[50],
                  child: Row(
                    children: [
                      const Icon(Icons.check_circle, color: Colors.green),
                      const SizedBox(width: 8),
                      Expanded(
                        child: Text(
                          "Connected: ${_wcService.connectedAddress}",
                          overflow: TextOverflow.ellipsis,
                        ),
                      ),
                    ],
                  ),
                ),
              const SizedBox(height: 16),

              ElevatedButton.icon(
                onPressed: _isLinking ? null : _linkAccount,
                icon: _isLinking
                    ? const SizedBox(
                        width: 20,
                        height: 20,
                        child: CircularProgressIndicator(strokeWidth: 2),
                      )
                    : Icon(isConnected ? Icons.cloud_upload : Icons.link),
                label: Text(
                  _isLinking
                      ? "Waiting for Wallet..."
                      : isConnected
                      ? "Sign Registration"
                      : "Connect & Link Wallet",
                ),
                style: ElevatedButton.styleFrom(
                  padding: const EdgeInsets.all(16),
                  backgroundColor: isConnected
                      ? Colors.green[700]
                      : Colors.deepPurple,
                  foregroundColor: Colors.white,
                ),
              ),

              if (_isLinking && !isConnected)
                const Padding(
                  padding: EdgeInsets.only(top: 10),
                  child: Text(
                    "Tap 'Connect' in your wallet.\nIf not redirected, switch back to this app manually.",
                    textAlign: TextAlign.center,
                    style: TextStyle(fontSize: 12, color: Colors.grey),
                  ),
                ),

              if (_error != null)
                Padding(
                  padding: const EdgeInsets.only(top: 16),
                  child: Text(
                    "Error: $_error",
                    style: const TextStyle(color: Colors.red),
                    textAlign: TextAlign.center,
                  ),
                ),
            ],
          ],
        ),
      ),
    );
  }
}

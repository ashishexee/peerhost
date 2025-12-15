import 'package:flutter/material.dart';
import 'package:peerhost_app/services/wallet_service.dart';
import 'package:peerhost_app/services/wallet_connect_service.dart';
import 'package:peerhost_app/widgets/modern_button.dart';
import 'package:google_fonts/google_fonts.dart';

class AddWorkerScreen extends StatefulWidget {
  const AddWorkerScreen({super.key});

  @override
  State<AddWorkerScreen> createState() => _AddWorkerScreenState();
}

class _AddWorkerScreenState extends State<AddWorkerScreen> {
  final WalletService _walletService = WalletService();
  final WalletConnectService _wcService = WalletConnectService();

  String? _workerAddress;
  bool _isLoading = false;
  String? _error;

  @override
  void initState() {
    super.initState();
    _initWorker();
  }

  Future<void> _initWorker() async {
    // Generate (or fetch existing) key for this device
    final key = await _walletService.getOrGenerateWorkerKey();
    setState(() {
      _workerAddress = key.address.hex;
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
      body: Padding(
        padding: const EdgeInsets.all(24.0),
        child: Column(
          children: [
            const Icon(Icons.memory, size: 80, color: Color(0xFF00FF94)),
            const SizedBox(height: 24),
            Text(
              "Register This Device",
              style: GoogleFonts.spaceGrotesk(
                fontSize: 24,
                color: Colors.white,
              ),
            ),
            const SizedBox(height: 12),
            Text(
              "We've generated a unique worker key for this device. Register it to your account to start earning.",
              textAlign: TextAlign.center,
              style: GoogleFonts.inter(color: Colors.grey[400]),
            ),
            const SizedBox(height: 40),

            Container(
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: Colors.grey[900],
                borderRadius: BorderRadius.circular(12),
                border: Border.all(color: Colors.grey[800]!),
              ),
              child: Column(
                children: [
                  Text(
                    "Worker Address",
                    style: GoogleFonts.inter(fontSize: 12, color: Colors.grey),
                  ),
                  const SizedBox(height: 8),
                  SelectableText(
                    _workerAddress ?? "Generating...",
                    style: GoogleFonts.jetBrainsMono(
                      color: Colors.white,
                      fontSize: 13,
                    ),
                    textAlign: TextAlign.center,
                  ),
                ],
              ),
            ),

            const Spacer(),

            if (_error != null)
              Padding(
                padding: const EdgeInsets.only(bottom: 20),
                child: Text(_error!, style: const TextStyle(color: Colors.red)),
              ),

            ModernButton(
              text: _isLoading ? "Waiting for Approval..." : "Register Worker",
              onPressed: _isLoading ? () {} : _registerWorker,
              icon: _isLoading ? Icons.hourglass_empty : Icons.fingerprint,
              color: const Color(0xFF00FF94),
              textColor: Colors.black,
            ),
            const SizedBox(height: 20),
          ],
        ),
      ),
    );
  }
}

import 'package:flutter/material.dart';
import 'package:peerhost_app/services/wallet_connect_service.dart';
import 'package:peerhost_app/widgets/modern_button.dart';
import 'package:google_fonts/google_fonts.dart';

class LoginScreen extends StatefulWidget {
  const LoginScreen({super.key});

  @override
  State<LoginScreen> createState() => _LoginScreenState();
}

class _LoginScreenState extends State<LoginScreen> {
  final _walletService = WalletConnectService();
  bool _isLoading = false;

  @override
  void initState() {
    super.initState();
    _walletService.modal.addListener(_onConnectionChange);
  }

  @override
  void dispose() {
    _walletService.modal.removeListener(_onConnectionChange);
    super.dispose();
  }

  void _onConnectionChange() {
    if (_walletService.isConnected) {
      _navigateToWorkerList();
    }
  }

  void _navigateToWorkerList() {
    if (mounted) {
      Navigator.of(context).pushReplacementNamed('/worker-list');
    }
  }

  void _connectWallet() async {
    setState(() => _isLoading = true);
    await _walletService.openModal(context);
    setState(() => _isLoading = false);
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.black,
      body: Center(
        child: Padding(
          padding: const EdgeInsets.all(24.0),
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Text(
                "PeerHost",
                style: GoogleFonts.spaceGrotesk(
                  fontSize: 40,
                  fontWeight: FontWeight.bold,
                  color: Colors.white,
                ),
              ),
              const SizedBox(height: 12),
              Text(
                "Decentralized Worker Node",
                style: GoogleFonts.inter(fontSize: 16, color: Colors.grey[400]),
              ),
              const SizedBox(height: 60),
              if (_isLoading)
                const CircularProgressIndicator(color: Color(0xFF00FF94))
              else
                ModernButton(
                  text: "Connect Wallet",
                  onPressed: _connectWallet,
                  icon: Icons.account_balance_wallet,
                  color: const Color(0xFF00FF94),
                  textColor: Colors.black,
                ),
            ],
          ),
        ),
      ),
    );
  }
}

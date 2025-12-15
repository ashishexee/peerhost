import 'package:flutter/material.dart';
import 'package:peerhost_app/services/blockchain_service.dart';
import 'package:peerhost_app/services/wallet_connect_service.dart';
import 'package:peerhost_app/services/wallet_service.dart';
import 'package:peerhost_app/widgets/modern_button.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:web3dart/web3dart.dart';

class FundingScreen extends StatefulWidget {
  const FundingScreen({super.key});

  @override
  State<FundingScreen> createState() => _FundingScreenState();
}

class _FundingScreenState extends State<FundingScreen> {
  final _blockchainService = BlockchainService();
  final _wcService = WalletConnectService();
  final _walletService = WalletService();

  bool _isLoading = true;
  String? _workerAddress;
  double _balance = 0.0;
  final TextEditingController _amountController = TextEditingController(
    text: "0.01",
  );

  @override
  void initState() {
    super.initState();
    _checkBalance();
  }

  Future<void> _checkBalance() async {
    setState(() => _isLoading = true);
    try {
      final creds = await _walletService.getOrGenerateWorkerKey();
      _workerAddress = creds.address.hex;

      final balanceWei = await _blockchainService.getWorkerBalance(
        _workerAddress!,
      );
      final balanceEth = balanceWei.getValueInUnit(EtherUnit.ether);

      setState(() {
        _balance = balanceEth;
        _isLoading = false;
      });

      if (_balance > 0.0001) {
        // Threshold
        _navigateToHome();
      }
    } catch (e) {
      debugPrint("Error checking balance: $e");
      setState(() => _isLoading = false);
    }
  }

  void _navigateToHome() {
    Navigator.of(context).pushReplacementNamed('/home');
  }

  Future<void> _fundWorker() async {
    final amount = double.tryParse(_amountController.text);
    if (amount == null || amount <= 0) return;

    setState(() => _isLoading = true);
    try {
      await _wcService.fundWorker(_workerAddress!, amount);
      // Wait for tx to settle slightly? Or just poll balance?
      // For UX speed, we'll poll balance
      await Future.delayed(const Duration(seconds: 5));
      await _checkBalance();
    } catch (e) {
      debugPrint("Funding failed: $e");
      setState(() => _isLoading = false);
      ScaffoldMessenger.of(
        context,
      ).showSnackBar(SnackBar(content: Text("Funding failed: $e")));
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.black,
      appBar: AppBar(
        title: Text(
          "Fund Worker",
          style: GoogleFonts.spaceGrotesk(color: Colors.white),
        ),
        backgroundColor: Colors.black,
      ),
      body: Padding(
        padding: const EdgeInsets.all(24.0),
        child: Column(
          children: [
            const Icon(Icons.local_gas_station, size: 60, color: Colors.orange),
            const SizedBox(height: 20),
            Text(
              "Gas Funds Required",
              style: GoogleFonts.spaceGrotesk(
                fontSize: 24,
                color: Colors.white,
              ),
            ),
            const SizedBox(height: 10),
            Text(
              "Your worker needs a small amount of MATIC/POL to pay for transaction fees (gas) when submitting work.",
              textAlign: TextAlign.center,
              style: GoogleFonts.inter(color: Colors.grey),
            ),

            const SizedBox(height: 30),
            Container(
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: Colors.grey[900],
                borderRadius: BorderRadius.circular(12),
              ),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Text(
                    "Current Balance",
                    style: GoogleFonts.inter(color: Colors.grey),
                  ),
                  Text(
                    "$_balance POL",
                    style: GoogleFonts.jetBrainsMono(
                      color: _balance == 0 ? Colors.red : Colors.green,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                ],
              ),
            ),

            const SizedBox(height: 30),
            if (_balance < 0.0001) ...[
              TextField(
                controller: _amountController,
                style: const TextStyle(color: Colors.white),
                decoration: InputDecoration(
                  labelText: "Amount to Transfer (POL)",
                  labelStyle: const TextStyle(color: Colors.grey),
                  suffixText: "POL",
                  enabledBorder: OutlineInputBorder(
                    borderSide: BorderSide(color: Colors.grey[800]!),
                  ),
                  focusedBorder: const OutlineInputBorder(
                    borderSide: BorderSide(color: Color(0xFF00FF94)),
                  ),
                ),
                keyboardType: const TextInputType.numberWithOptions(
                  decimal: true,
                ),
              ),
              const SizedBox(height: 20),
              ModernButton(
                text: _isLoading ? "Processing..." : "Fund Worker",
                onPressed: _isLoading ? () {} : _fundWorker,
                icon: Icons.send,
                color: Colors.white,
                textColor: Colors.black,
              ),
            ] else ...[
              const SizedBox(height: 20),
              ModernButton(
                text: "Continue to Home",
                onPressed: _navigateToHome,
                icon: Icons.arrow_forward,
                color: const Color(0xFF00FF94),
                textColor: Colors.black,
              ),
            ],
          ],
        ),
      ),
    );
  }
}

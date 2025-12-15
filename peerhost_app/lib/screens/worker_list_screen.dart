import 'package:flutter/material.dart';
import 'package:peerhost_app/services/blockchain_service.dart';
import 'package:peerhost_app/services/wallet_connect_service.dart';
import 'package:peerhost_app/services/wallet_service.dart';
import 'package:peerhost_app/widgets/modern_button.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:web3dart/web3dart.dart';

class WorkerListScreen extends StatefulWidget {
  const WorkerListScreen({super.key});

  @override
  State<WorkerListScreen> createState() => _WorkerListScreenState();
}

class _WorkerListScreenState extends State<WorkerListScreen> {
  final _blockchainService = BlockchainService();
  final _walletConnectService = WalletConnectService();
  final _walletService = WalletService();

  List<String> _workers = [];
  Map<String, String> _balances = {};
  bool _isLoading = true;
  String? _lastUsedWorker;

  @override
  void initState() {
    super.initState();
    _loadData();
  }

  Future<void> _loadData() async {
    setState(() => _isLoading = true);
    try {
      final userAddress = _walletConnectService.connectedAddress;
      if (userAddress == null) {
        // Should back to login ideally
        Navigator.of(context).pushReplacementNamed('/');
        return;
      }

      final prefs = await SharedPreferences.getInstance();
      _lastUsedWorker = prefs.getString('last_used_worker');

      // 1. Fetch registered workers from chain
      final workers = await _blockchainService.getWorkersForUser(userAddress);

      // Fetch balances
      final Map<String, String> balances = {};
      for (final worker in workers) {
        try {
          final balance = await _blockchainService.getWorkerBalance(worker);
          balances[worker] =
              "${balance.getValueInUnit(EtherUnit.ether).toStringAsFixed(4)} ETH";
        } catch (e) {
          balances[worker] = "Error";
        }
      }

      setState(() {
        _workers = workers.map((e) => e.toLowerCase()).toList();
        _balances = balances.map((k, v) => MapEntry(k.toLowerCase(), v));
        _isLoading = false;
      });
    } catch (e) {
      debugPrint("Error loading workers: $e");
      setState(() => _isLoading = false);
    }
  }

  Future<void> _useWorker(String workerAddress) async {
    final hasKey = await _walletService.hasKey(workerAddress);

    if (hasKey) {
      final prefs = await SharedPreferences.getInstance();
      await prefs.setString('last_used_worker', workerAddress);
      if (mounted) {
        Navigator.of(context).pushReplacementNamed('/funding');
      }
    } else {
      // Need to import key
      if (mounted) {
        _showImportDialog(workerAddress);
      }
    }
  }

  void _showImportDialog(String workerAddress) {
    final keyController = TextEditingController();
    String? error;

    showDialog(
      context: context,
      builder: (context) => StatefulBuilder(
        builder: (context, setState) => AlertDialog(
          backgroundColor: Colors.grey[900],
          title: Text(
            "Verify Worker",
            style: GoogleFonts.spaceGrotesk(color: Colors.white),
          ),
          content: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Text(
                "To use this worker, you must import its Private Key to verify ownership.",
                style: GoogleFonts.inter(color: Colors.grey[400], fontSize: 13),
              ),
              const SizedBox(height: 15),
              TextField(
                controller: keyController,
                style: const TextStyle(color: Colors.white),
                decoration: InputDecoration(
                  hintText: "Enter Private Key (0x...)",
                  hintStyle: TextStyle(color: Colors.grey[600]),
                  errorText: error,
                  filled: true,
                  fillColor: Colors.black,
                  border: OutlineInputBorder(
                    borderRadius: BorderRadius.circular(12),
                  ),
                ),
              ),
            ],
          ),
          actions: [
            TextButton(
              onPressed: () => Navigator.pop(context),
              child: const Text("Cancel"),
            ),
            ModernButton(
              text: "Import & Verify",
              onPressed: () async {
                final inputKey = keyController.text.trim();
                if (inputKey.isEmpty) {
                  setState(() => error = "Please enter a key");
                  return;
                }

                try {
                  // 1. Check format
                  final key = EthPrivateKey.fromHex(inputKey);

                  // 2. Check address match
                  if (key.address.hex.toLowerCase() !=
                      workerAddress.toLowerCase()) {
                    setState(
                      () => error =
                          "Key does not match the selected worker address!",
                    );
                    return;
                  }

                  // 3. Save
                  await _walletService.saveWorkerKey(workerAddress, inputKey);

                  // 4. Proceed
                  final prefs = await SharedPreferences.getInstance();
                  await prefs.setString('last_used_worker', workerAddress);

                  if (mounted) {
                    Navigator.pop(context); // Close dialog
                    Navigator.of(context).pushReplacementNamed('/funding');
                  }
                } catch (e) {
                  debugPrint("Import Error: $e");
                  setState(() => error = "Invalid Private Key");
                }
              },
              icon: Icons.check,
              color: const Color(0xFF00FF94),
              textColor: Colors.black,
            ),
          ],
        ),
      ),
    );
  }

  void _addNewWorker() {
    Navigator.of(context).pushNamed('/add-worker');
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.black,
      appBar: AppBar(
        title: Text(
          "Your Workers",
          style: GoogleFonts.spaceGrotesk(color: Colors.white),
        ),
        backgroundColor: Colors.black,
        iconTheme: const IconThemeData(color: Colors.white),
      ),
      body: _isLoading
          ? const Center(
              child: CircularProgressIndicator(color: Color(0xFF00FF94)),
            )
          : Padding(
              padding: const EdgeInsets.all(20.0),
              child: Column(
                children: [
                  if (_workers.isEmpty)
                    Expanded(
                      child: Center(
                        child: Text(
                          "No workers found linked to this account.",
                          style: GoogleFonts.inter(color: Colors.grey),
                        ),
                      ),
                    )
                  else
                    Expanded(
                      child: ListView.builder(
                        itemCount: _workers.length,
                        itemBuilder: (context, index) {
                          final worker = _workers[index];
                          final isLastUsed =
                              worker == _lastUsedWorker?.toLowerCase();
                          final balance = _balances[worker] ?? "Loading...";

                          return Card(
                            color: Colors.grey[900],
                            margin: const EdgeInsets.only(bottom: 12),
                            child: ListTile(
                              title: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Text(
                                    worker,
                                    style: const TextStyle(
                                      color: Colors.white,
                                      fontSize: 13,
                                    ),
                                  ),
                                  const SizedBox(height: 4),
                                  Row(
                                    children: [
                                      Text(
                                        "Balance: ",
                                        style: TextStyle(
                                          color: Colors.grey[400],
                                          fontSize: 12,
                                        ),
                                      ),
                                      Text(
                                        balance,
                                        style: const TextStyle(
                                          color: Color(0xFF00FF94),
                                          fontSize: 12,
                                          fontWeight: FontWeight.bold,
                                        ),
                                      ),
                                    ],
                                  ),
                                ],
                              ),
                              subtitle: isLastUsed
                                  ? Padding(
                                      padding: const EdgeInsets.only(top: 4.0),
                                      child: Text(
                                        "Last Used",
                                        style: GoogleFonts.inter(
                                          color: Colors
                                              .amber, // Highlight last used
                                          fontSize: 10,
                                          fontWeight: FontWeight.w600,
                                        ),
                                      ),
                                    )
                                  : null,
                              trailing: IconButton(
                                icon: const Icon(
                                  Icons.arrow_forward,
                                  color: Colors.white,
                                ),
                                onPressed: () => _useWorker(worker),
                              ),
                            ),
                          );
                        },
                      ),
                    ),

                  const SizedBox(height: 20),
                  ModernButton(
                    text: "Add New Worker",
                    onPressed: _addNewWorker,
                    icon: Icons.add,
                    color: Colors.white,
                    textColor: Colors.black,
                  ),
                ],
              ),
            ),
    );
  }
}

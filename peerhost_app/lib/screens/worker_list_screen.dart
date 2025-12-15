import 'package:flutter/material.dart';
import 'package:peerhost_app/services/blockchain_service.dart';
import 'package:peerhost_app/services/wallet_connect_service.dart';
import 'package:peerhost_app/services/wallet_service.dart';
import 'package:peerhost_app/widgets/modern_button.dart';
import 'package:google_fonts/google_fonts.dart';

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
  bool _isLoading = true;
  String? _localWorkerAddress;

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

      // 1. Fetch registered workers from chain
      final workers = await _blockchainService.getWorkersForUser(userAddress);

      // 2. Get local worker key if exists
      // We don't generate if not exists here, just check if we have one
      // But getOrGenerateWorkerKey actually generates if session doesn't exist?
      // Let's check if there's a stored key first?
      // The WalletService API generates on demand. That's fine.
      final creds = await _walletService.getOrGenerateWorkerKey();
      final localAddress = creds.address.hex.toLowerCase();

      setState(() {
        _workers = workers.map((e) => e.toLowerCase()).toList();
        _localWorkerAddress = localAddress;
        _isLoading = false;
      });
    } catch (e) {
      debugPrint("Error loading workers: $e");
      setState(() => _isLoading = false);
    }
  }

  void _useWorker(String workerAddress) {
    if (workerAddress.toLowerCase() == _localWorkerAddress) {
      Navigator.of(context).pushReplacementNamed('/funding');
    } else {
      // Trying to use a worker that is NOT on this device
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text(
            "This worker is not on this device. Please add a new worker for this device.",
          ),
        ),
      );
    }
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
                          final isLocal = worker == _localWorkerAddress;
                          return Card(
                            color: Colors.grey[900],
                            margin: const EdgeInsets.only(bottom: 12),
                            child: ListTile(
                              title: Text(
                                worker,
                                style: const TextStyle(
                                  color: Colors.white,
                                  fontSize: 13,
                                ),
                              ),
                              subtitle: isLocal
                                  ? const Text(
                                      "Current Device",
                                      style: TextStyle(
                                        color: Color(0xFF00FF94),
                                      ),
                                    )
                                  : const Text(
                                      "Other Device",
                                      style: TextStyle(color: Colors.grey),
                                    ),
                              trailing: isLocal
                                  ? IconButton(
                                      icon: const Icon(
                                        Icons.arrow_forward,
                                        color: Color(0xFF00FF94),
                                      ),
                                      onPressed: () => _useWorker(worker),
                                    )
                                  : null,
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

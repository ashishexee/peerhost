import 'package:flutter/material.dart';
import 'package:peerhost_app/services/blockchain_service.dart';
import 'package:peerhost_app/services/wallet_connect_service.dart';
import 'package:peerhost_app/services/wallet_service.dart';
import 'package:peerhost_app/widgets/modern_button.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:web3dart/web3dart.dart';

class WorkerData {
  final String address;
  final String balance;
  final double stakedAmount;
  final bool isBlacklisted;
  final int probationCount;
  final double penaltyDeposited;

  WorkerData({
    required this.address,
    required this.balance,
    required this.stakedAmount,
    required this.isBlacklisted,
    required this.probationCount,
    required this.penaltyDeposited,
  });
}

class WorkerListScreen extends StatefulWidget {
  const WorkerListScreen({super.key});

  @override
  State<WorkerListScreen> createState() => _WorkerListScreenState();
}

class _WorkerListScreenState extends State<WorkerListScreen> {
  final _blockchainService = BlockchainService();
  final _walletConnectService = WalletConnectService();
  final _walletService = WalletService();

  List<WorkerData> _workers = [];
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
        Navigator.of(context).pushReplacementNamed('/');
        return;
      }

      final prefs = await SharedPreferences.getInstance();
      _lastUsedWorker = prefs.getString('last_used_worker');

      final workerAddresses = await _blockchainService.getWorkersForUser(
        userAddress,
      );

      final List<WorkerData> loadedWorkers = [];

      for (final addr in workerAddresses) {
        String balanceStr = "0.0000";
        Map<String, dynamic> stakeInfo = {
          'stakedAmount': 0.0,
          'isBlacklisted': false,
          'probationCount': 0,
          'penaltyDeposited': 0.0,
        };

        try {
          final balance = await _blockchainService.getWorkerBalance(addr);
          balanceStr = balance
              .getValueInUnit(EtherUnit.ether)
              .toStringAsFixed(4);
        } catch (_) {}

        try {
          stakeInfo = await _blockchainService.getWorkerStakeInfo(addr);
        } catch (e) {
          debugPrint("Failed to load stake info for $addr: $e");
        }

        loadedWorkers.add(
          WorkerData(
            address: addr.toLowerCase(),
            balance: balanceStr,
            stakedAmount: stakeInfo['stakedAmount'],
            isBlacklisted: stakeInfo['isBlacklisted'],
            probationCount: stakeInfo['probationCount'],
            penaltyDeposited: stakeInfo['penaltyDeposited'],
          ),
        );
      }

      setState(() {
        _workers = loadedWorkers;
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
      if (mounted) {
        _showImportDialog(workerAddress);
      }
    }
  }

  Future<void> _handleStake(String workerAddress) async {
    final controller = TextEditingController(text: "2.0");
    await showDialog(
      context: context,
      builder: (context) => AlertDialog(
        backgroundColor: Colors.grey[900],
        title: Text(
          "Stake POL",
          style: GoogleFonts.spaceGrotesk(color: Colors.white),
        ),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Text(
              "Minimum stake is 2.0 POL. Staking enables this worker to process jobs.",
              style: GoogleFonts.inter(color: Colors.grey[400], fontSize: 12),
            ),
            const SizedBox(height: 10),
            TextField(
              controller: controller,
              style: const TextStyle(color: Colors.white),
              keyboardType: TextInputType.number,
              decoration: const InputDecoration(
                suffixText: "POL",
                labelStyle: TextStyle(color: Colors.grey),
                labelText: "Amount",
                enabledBorder: UnderlineInputBorder(
                  borderSide: BorderSide(color: Colors.grey),
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
          TextButton(
            onPressed: () async {
              Navigator.pop(context);
              _performAction(() async {
                final amount = double.tryParse(controller.text) ?? 0.0;
                await _walletConnectService.stakeForWorker(
                  workerAddress,
                  amount,
                );
              }, "Stake Submitted!");
            },
            child: const Text(
              "Stake",
              style: TextStyle(color: Color(0xFF00FF94)),
            ),
          ),
        ],
      ),
    );
  }

  Future<void> _handleWithdraw(String workerAddress, double maxAmount) async {
    final controller = TextEditingController(text: maxAmount.toString());
    await showDialog(
      context: context,
      builder: (context) => AlertDialog(
        backgroundColor: Colors.grey[900],
        title: Text(
          "Withdraw Stake",
          style: GoogleFonts.spaceGrotesk(color: Colors.white),
        ),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Text(
              "Warning: Withdrawing below 2.0 POL will deactivate this worker.",
              style: GoogleFonts.inter(color: Colors.amber, fontSize: 12),
            ),
            const SizedBox(height: 10),
            TextField(
              controller: controller,
              style: const TextStyle(color: Colors.white),
              keyboardType: TextInputType.number,
              decoration: const InputDecoration(
                suffixText: "POL",
                labelStyle: TextStyle(color: Colors.grey),
                labelText: "Amount",
                enabledBorder: UnderlineInputBorder(
                  borderSide: BorderSide(color: Colors.grey),
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
          TextButton(
            onPressed: () async {
              Navigator.pop(context);
              _performAction(() async {
                final amount = double.tryParse(controller.text) ?? 0.0;
                await _walletConnectService.withdrawStake(
                  workerAddress,
                  amount,
                );
              }, "Withdrawal Submitted!");
            },
            child: const Text(
              "Withdraw",
              style: TextStyle(color: Colors.redAccent),
            ),
          ),
        ],
      ),
    );
  }

  Future<void> _handleUnban(String workerAddress) async {
    // Confirm dialog
    await showDialog(
      context: context,
      builder: (context) => AlertDialog(
        backgroundColor: Colors.grey[900],
        title: Text(
          "Request Unban",
          style: GoogleFonts.spaceGrotesk(color: Colors.white),
        ),
        content: Text(
          "You must pay a penalty of 1.0 POL to request unbanning. This will start a probation period.",
          style: GoogleFonts.inter(color: Colors.grey[300]),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text("Cancel"),
          ),
          TextButton(
            onPressed: () async {
              Navigator.pop(context);
              _performAction(() async {
                await _walletConnectService.requestUnban(workerAddress);
              }, "Unban Request Submitted!");
            },
            child: const Text(
              "Pay 1.0 POL",
              style: TextStyle(color: Colors.amber),
            ),
          ),
        ],
      ),
    );
  }

  Future<void> _performAction(Function action, String successMsg) async {
    setState(() => _isLoading = true);
    try {
      await action();
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text(successMsg), backgroundColor: Colors.green),
      );
      // Wait a bit then reload
      await Future.delayed(const Duration(seconds: 3));
      await _loadData();
    } catch (e) {
      debugPrint("Action failed: $e");
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text("Failed: $e"), backgroundColor: Colors.red),
      );
      setState(() => _isLoading = false);
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
                  final key = EthPrivateKey.fromHex(inputKey);
                  if (key.address.hex.toLowerCase() !=
                      workerAddress.toLowerCase()) {
                    setState(
                      () => error =
                          "Key does not match the selected worker address!",
                    );
                    return;
                  }
                  await _walletService.saveWorkerKey(workerAddress, inputKey);
                  final prefs = await SharedPreferences.getInstance();
                  await prefs.setString('last_used_worker', workerAddress);

                  if (mounted) {
                    Navigator.pop(context);
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
                              worker.address == _lastUsedWorker?.toLowerCase();

                          return Card(
                            color: Colors.grey[900],
                            margin: const EdgeInsets.only(bottom: 12),
                            child: Padding(
                              padding: const EdgeInsets.all(12.0),
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Row(
                                    mainAxisAlignment:
                                        MainAxisAlignment.spaceBetween,
                                    children: [
                                      Text(
                                        "${worker.address.substring(0, 8)}...${worker.address.substring(worker.address.length - 6)}",
                                        style: const TextStyle(
                                          color: Colors.white,
                                          fontSize: 14,
                                          fontWeight: FontWeight.bold,
                                        ),
                                      ),
                                      if (worker.isBlacklisted)
                                        Container(
                                          padding: const EdgeInsets.symmetric(
                                            horizontal: 8,
                                            vertical: 2,
                                          ),
                                          decoration: BoxDecoration(
                                            color: Colors.red.withOpacity(0.2),
                                            borderRadius: BorderRadius.circular(
                                              4,
                                            ),
                                          ),
                                          child: const Text(
                                            "BANNED",
                                            style: TextStyle(
                                              color: Colors.red,
                                              fontSize: 10,
                                              fontWeight: FontWeight.bold,
                                            ),
                                          ),
                                        )
                                      else if (worker.stakedAmount >= 2.0)
                                        Container(
                                          padding: const EdgeInsets.symmetric(
                                            horizontal: 8,
                                            vertical: 2,
                                          ),
                                          decoration: BoxDecoration(
                                            color: Colors.green.withOpacity(
                                              0.2,
                                            ),
                                            borderRadius: BorderRadius.circular(
                                              4,
                                            ),
                                          ),
                                          child: const Text(
                                            "ACTIVE",
                                            style: TextStyle(
                                              color: Colors.green,
                                              fontSize: 10,
                                              fontWeight: FontWeight.bold,
                                            ),
                                          ),
                                        )
                                      else
                                        Container(
                                          padding: const EdgeInsets.symmetric(
                                            horizontal: 8,
                                            vertical: 2,
                                          ),
                                          decoration: BoxDecoration(
                                            color: Colors.amber.withOpacity(
                                              0.2,
                                            ),
                                            borderRadius: BorderRadius.circular(
                                              4,
                                            ),
                                          ),
                                          child: const Text(
                                            "INACTIVE",
                                            style: TextStyle(
                                              color: Colors.amber,
                                              fontSize: 10,
                                              fontWeight: FontWeight.bold,
                                            ),
                                          ),
                                        ),
                                    ],
                                  ),
                                  const SizedBox(height: 8),
                                  Row(
                                    mainAxisAlignment:
                                        MainAxisAlignment.spaceBetween,
                                    children: [
                                      Column(
                                        crossAxisAlignment:
                                            CrossAxisAlignment.start,
                                        children: [
                                          Text(
                                            "Gas Balance",
                                            style: TextStyle(
                                              color: Colors.grey[500],
                                              fontSize: 10,
                                            ),
                                          ),
                                          Text(
                                            "${worker.balance} POL",
                                            style: const TextStyle(
                                              color: Colors.white,
                                              fontSize: 12,
                                            ),
                                          ),
                                        ],
                                      ),
                                      Column(
                                        crossAxisAlignment:
                                            CrossAxisAlignment.end,
                                        children: [
                                          Text(
                                            "Staked Amount",
                                            style: TextStyle(
                                              color: Colors.grey[500],
                                              fontSize: 10,
                                            ),
                                          ),
                                          Text(
                                            "${worker.stakedAmount.toStringAsFixed(2)} POL",
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
                                  const Divider(
                                    color: Colors.white10,
                                    height: 20,
                                  ),
                                  if (isLastUsed)
                                    Padding(
                                      padding: const EdgeInsets.only(
                                        bottom: 8.0,
                                      ),
                                      child: Text(
                                        "Currently Selected for Local Service",
                                        style: GoogleFonts.inter(
                                          color: Colors.amber,
                                          fontSize: 10,
                                          fontWeight: FontWeight.w600,
                                        ),
                                      ),
                                    ),
                                  Row(
                                    mainAxisAlignment: MainAxisAlignment.end,
                                    children: [
                                      if (!worker.isBlacklisted) ...[
                                        TextButton(
                                          onPressed: () =>
                                              _handleStake(worker.address),
                                          child: const Text(
                                            "Stake",
                                            style: TextStyle(
                                              color: Color(0xFF00FF94),
                                              fontSize: 12,
                                            ),
                                          ),
                                        ),
                                        if (worker.stakedAmount > 0)
                                          TextButton(
                                            onPressed: () => _handleWithdraw(
                                              worker.address,
                                              worker.stakedAmount,
                                            ),
                                            child: const Text(
                                              "Withdraw",
                                              style: TextStyle(
                                                color: Colors.grey,
                                                fontSize: 12,
                                              ),
                                            ),
                                          ),
                                        const SizedBox(width: 8),
                                        ElevatedButton(
                                          onPressed: () =>
                                              _useWorker(worker.address),
                                          style: ElevatedButton.styleFrom(
                                            backgroundColor: Colors.white,
                                            foregroundColor: Colors.black,
                                            padding: const EdgeInsets.symmetric(
                                              horizontal: 12,
                                              vertical: 8,
                                            ),
                                            textStyle: const TextStyle(
                                              fontSize: 12,
                                            ),
                                          ),
                                          child: const Text("Use Worker"),
                                        ),
                                      ] else ...[
                                        TextButton(
                                          onPressed: () =>
                                              _handleUnban(worker.address),
                                          child: const Text(
                                            "Request Unban",
                                            style: TextStyle(
                                              color: Colors.amber,
                                              fontSize: 12,
                                            ),
                                          ),
                                        ),
                                      ],
                                    ],
                                  ),
                                ],
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

import 'package:flutter/material.dart';
import 'package:flutter_background_service/flutter_background_service.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:peerhost_app/services/wallet_connect_service.dart';
import 'package:peerhost_app/services/wallet_service.dart';
import 'package:peerhost_app/services/blockchain_service.dart';

class ServiceControlScreen extends StatefulWidget {
  const ServiceControlScreen({super.key});

  @override
  State<ServiceControlScreen> createState() => _ServiceControlScreenState();
}

class _ServiceControlScreenState extends State<ServiceControlScreen> {
  String text = "Start Service";
  bool isRunning = false;
  List<String> _logs = [];
  final ScrollController _scrollController = ScrollController();

  final WalletConnectService _wcService = WalletConnectService();
  final WalletService _walletService = WalletService();
  final BlockchainService _blockchainService = BlockchainService();
  String? _workerAddress;
  bool _isRegistered = false;
  bool _checkingRegistration = true;
  bool _isLoadingRegistration = false;
  double _stakedAmount = 0.0;

  @override
  void initState() {
    super.initState();
    _setupLogListener();
    _checkServiceStatus();
    _loadWorker();
  }

  void _setupLogListener() {
    FlutterBackgroundService().on('log').listen((event) {
      if (event != null && event['message'] != null) {
        _addLog(event['message']);
      }
    });
  }

  Future<void> _loadWorker() async {
    final key = await _walletService.getOrGenerateWorkerKey();
    setState(() {
      _workerAddress = key.address.hex;
    });
    // _addLog("Worker loaded: ${_workerAddress?.substring(0, 10)}...");
    _checkRegistrationStatus();
  }

  Future<void> _checkRegistrationStatus() async {
    if (_workerAddress == null) return;
    setState(() => _checkingRegistration = true);

    try {
      final userAddress = _wcService.connectedAddress;
      if (userAddress == null) {
        setState(() => _checkingRegistration = false);
        return;
      }

      final workers = await _blockchainService.getWorkersForUser(userAddress);
      final isReg = workers.any(
        (w) => w.toLowerCase() == _workerAddress!.toLowerCase(),
      );

      double staked = 0.0;
      if (isReg) {
        try {
          final info = await _blockchainService.getWorkerStakeInfo(
            _workerAddress!,
          );
          staked = info['stakedAmount'];
        } catch (e) {
          debugPrint("Failed to load stake: $e");
        }
      }

      if (mounted) {
        setState(() {
          _isRegistered = isReg;
          _stakedAmount = staked;
          _checkingRegistration = false;
        });
      }
    } catch (e) {
      debugPrint("Error checking registration: $e");
      if (mounted) setState(() => _checkingRegistration = false);
    }
  }

  Future<void> _registerWorker() async {
    if (_workerAddress == null) return;
    setState(() => _isLoadingRegistration = true);

    try {
      final txHash = await _wcService.registerWorker(_workerAddress!);
      _addLog("Registration TX Sent: $txHash");

      // Optimistically update
      setState(() {
        _isRegistered = true;
        _isLoadingRegistration = false;
      });

      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text(
            "Registration submitted! Please wait for confirmation.",
          ),
        ),
      );
    } catch (e) {
      _addLog("Registration Failed: $e");
      setState(() => _isLoadingRegistration = false);
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text("Failed: $e"), backgroundColor: Colors.red),
      );
    }
  }

  void _addLog(String message) {
    if (!mounted) return;
    setState(() {
      _logs.add(
        "[${DateTime.now().toIso8601String().split('T').last.substring(0, 8)}] $message",
      );
    });
    // Auto-scroll to bottom
    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (_scrollController.hasClients) {
        _scrollController.animateTo(
          _scrollController.position.maxScrollExtent,
          duration: const Duration(milliseconds: 300),
          curve: Curves.easeOut,
        );
      }
    });
  }

  Future<void> _checkServiceStatus() async {
    final service = FlutterBackgroundService();
    var hasRun = await service.isRunning();
    if (mounted) {
      setState(() {
        isRunning = hasRun;
        text = isRunning ? 'Stop Service' : 'Start Service';
      });
    }
  }

  void _toggleService() async {
    final service = FlutterBackgroundService();
    var isRunningNow = await service.isRunning();

    if (isRunningNow) {
      service.invoke("stopService");
      // Let background report "Stopping..."
    } else {
      service.startService();
      // Let background report "Starting..."
    }

    if (mounted) {
      setState(() {
        isRunning = !isRunningNow;
        text = isRunning ? 'Stop Service' : 'Start Service';
      });
    }
  }

  void _disconnect() async {
    await _wcService.disconnect();
    if (mounted) {
      Navigator.of(context).pushReplacementNamed('/');
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.black, // Dark Mode Background
      appBar: AppBar(
        title: Text(
          'Worker Node',
          style: GoogleFonts.spaceGrotesk(
            color: Colors.white,
            fontWeight: FontWeight.bold,
          ),
        ),
        backgroundColor: Colors.black,
        iconTheme: const IconThemeData(color: Colors.white),
        elevation: 0,
        actions: [
          IconButton(
            icon: const Icon(Icons.logout),
            onPressed: _disconnect,
            tooltip: "Logout",
          ),
        ],
      ),
      body: Column(
        children: [
          // --- TOP STATUS SECTION ---
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 16),
            decoration: BoxDecoration(
              color: Colors.white.withOpacity(0.02), // Subtle glass/transparent
              border: Border(
                bottom: BorderSide(color: Colors.white.withOpacity(0.1)),
              ),
            ),
            child: Row(
              children: [
                // Status Indicator
                Container(
                  width: 50,
                  height: 50,
                  decoration: BoxDecoration(
                    shape: BoxShape.circle,
                    color: isRunning
                        ? const Color(0xFF8247E5).withOpacity(
                            0.2,
                          ) // Purple tint
                        : Colors.white.withOpacity(0.05),
                    border: Border.all(
                      color: isRunning
                          ? const Color(0xFF8247E5)
                          : Colors.white.withOpacity(0.1),
                      width: 2,
                    ),
                    boxShadow: isRunning
                        ? [
                            BoxShadow(
                              color: const Color(0xFF8247E5).withOpacity(0.4),
                              blurRadius: 15,
                              spreadRadius: 1,
                            ),
                          ]
                        : [],
                  ),
                  child: Icon(
                    isRunning ? Icons.bolt : Icons.power_settings_new,
                    size: 30,
                    color: isRunning ? const Color(0xFF8247E5) : Colors.grey,
                  ),
                ),
                const SizedBox(width: 15),

                // Text Info
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        isRunning ? "ONLINE" : "OFFLINE",
                        style: GoogleFonts.spaceGrotesk(
                          fontSize: 18,
                          fontWeight: FontWeight.bold,
                          color: isRunning
                              ? const Color(0xFF8247E5)
                              : Colors.grey,
                          letterSpacing: 1.2,
                        ),
                      ),
                      const SizedBox(height: 4),
                      Text(
                        _workerAddress != null
                            ? '${_workerAddress!.substring(0, 6)}...${_workerAddress!.substring(_workerAddress!.length - 4)}'
                            : 'Loading...',
                        style: GoogleFonts.jetBrainsMono(
                          color: Colors.grey[500],
                          fontSize: 12,
                        ),
                      ),
                    ],
                  ),
                ),

                // Toggle Button
                ElevatedButton(
                  onPressed: _toggleService,
                  style: ElevatedButton.styleFrom(
                    backgroundColor: isRunning
                        ? Colors.red.withOpacity(0.2)
                        : Colors.white,
                    foregroundColor: isRunning
                        ? Colors.redAccent
                        : Colors.black,
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(100),
                      side: isRunning
                          ? const BorderSide(color: Colors.redAccent)
                          : BorderSide.none,
                    ),
                    padding: const EdgeInsets.symmetric(
                      horizontal: 16,
                      vertical: 12,
                    ),
                    elevation: isRunning ? 0 : 2,
                  ),
                  child: Text(
                    text,
                    style: GoogleFonts.inter(fontWeight: FontWeight.bold),
                  ),
                ),
              ],
            ),
          ),

          // --- REGISTRATION / STAKE WARNING ---
          if (!_checkingRegistration &&
              _workerAddress != null &&
              (!_isRegistered || (_isRegistered && _stakedAmount < 2.0)))
            Container(
              margin: const EdgeInsets.symmetric(horizontal: 20, vertical: 10),
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(
                color: Colors.amber.withOpacity(0.1),
                border: Border.all(color: Colors.amber.withOpacity(0.5)),
                borderRadius: BorderRadius.circular(12),
              ),
              child: Row(
                children: [
                  const Icon(Icons.warning_amber_rounded, color: Colors.amber),
                  const SizedBox(width: 12),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          !_isRegistered
                              ? "Worker Not Registered"
                              : "Insufficient Stake",
                          style: GoogleFonts.inter(
                            color: Colors.amber,
                            fontWeight: FontWeight.bold,
                            fontSize: 14,
                          ),
                        ),
                        Text(
                          !_isRegistered
                              ? "This device is lost unlink to your account."
                              : "Worker needs 2.0 POL stake to operate.",
                          style: GoogleFonts.inter(
                            color: Colors.amber.withOpacity(0.8),
                            fontSize: 12,
                          ),
                        ),
                      ],
                    ),
                  ),
                  const SizedBox(width: 8),
                  if (!_isRegistered)
                    ElevatedButton(
                      onPressed: _isLoadingRegistration
                          ? null
                          : _registerWorker,
                      style: ElevatedButton.styleFrom(
                        backgroundColor: Colors.amber,
                        foregroundColor: Colors.black,
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(8),
                        ),
                        padding: const EdgeInsets.symmetric(horizontal: 12),
                      ),
                      child: _isLoadingRegistration
                          ? const SizedBox(
                              width: 16,
                              height: 16,
                              child: CircularProgressIndicator(
                                strokeWidth: 2,
                                color: Colors.black,
                              ),
                            )
                          : const Text("Register"),
                    )
                  else
                    ElevatedButton(
                      onPressed: () {
                        // Go to worker list to stake
                        Navigator.of(context).pushNamed('/workers');
                      },
                      style: ElevatedButton.styleFrom(
                        backgroundColor: Colors.amber,
                        foregroundColor: Colors.black,
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(8),
                        ),
                        padding: const EdgeInsets.symmetric(horizontal: 12),
                      ),
                      child: const Text("Stake"),
                    ),
                ],
              ),
            ),

          // --- LOGS HEADER ---
          Container(
            width: double.infinity,
            padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 10),
            color: Colors.black,
            child: Row(
              children: [
                const Icon(Icons.terminal, size: 16, color: Colors.grey),
                const SizedBox(width: 8),
                Text(
                  "LIVE LOGS",
                  style: GoogleFonts.inter(
                    color: Colors.grey[600],
                    fontSize: 12,
                    fontWeight: FontWeight.bold,
                    letterSpacing: 1.0,
                  ),
                ),
              ],
            ),
          ),

          // --- LOGS CONSOLE ---
          Expanded(
            child: Container(
              width: double.infinity,
              margin: const EdgeInsets.fromLTRB(16, 0, 16, 16),
              decoration: BoxDecoration(
                color: Colors.white.withOpacity(0.05), // Glass effect
                borderRadius: BorderRadius.circular(16),
                border: Border.all(color: Colors.white.withOpacity(0.1)),
              ),
              child: ClipRRect(
                borderRadius: BorderRadius.circular(12),
                child: Scrollbar(
                  controller: _scrollController,
                  thumbVisibility: true,
                  child: ListView.builder(
                    controller: _scrollController,
                    padding: const EdgeInsets.all(16),
                    itemCount: _logs.length,
                    itemBuilder: (context, index) {
                      return Padding(
                        padding: const EdgeInsets.only(bottom: 4),
                        child: Text(
                          _logs[index],
                          style: GoogleFonts.jetBrainsMono(
                            color: Colors.grey[300], // White/Grey text
                            fontSize: 12,
                            height: 1.4,
                          ),
                        ),
                      );
                    },
                  ),
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }
}

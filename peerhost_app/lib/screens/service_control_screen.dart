import 'package:flutter/material.dart';
import 'package:flutter_background_service/flutter_background_service.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:peerhost_app/services/wallet_connect_service.dart';
import 'package:peerhost_app/services/wallet_service.dart';

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
  String? _workerAddress;

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
              color: Colors.grey[900], // Dark Card
              border: Border(bottom: BorderSide(color: Colors.grey[800]!)),
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
                        ? const Color(0xFF00FF94).withOpacity(0.2)
                        : Colors.grey[800],
                    border: Border.all(
                      color: isRunning ? const Color(0xFF00FF94) : Colors.grey,
                      width: 2,
                    ),
                    boxShadow: isRunning
                        ? [
                            BoxShadow(
                              color: const Color(0xFF00FF94).withOpacity(0.4),
                              blurRadius: 10,
                              spreadRadius: 1,
                            ),
                          ]
                        : [],
                  ),
                  child: Icon(
                    isRunning ? Icons.bolt : Icons.power_settings_new,
                    size: 30,
                    color: isRunning ? const Color(0xFF00FF94) : Colors.grey,
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
                              ? const Color(0xFF00FF94)
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
                      borderRadius: BorderRadius.circular(30),
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
                color: const Color(0xFF111111), // Very dark grey, almost black
                borderRadius: BorderRadius.circular(12),
                border: Border.all(color: Colors.grey[800]!),
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
                            color: const Color(0xFF00FF94), // Matrix green text
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

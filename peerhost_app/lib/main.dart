import 'dart:async';
import 'package:peerhost_app/screens/worker_onboarding_screen.dart';
import 'package:flutter/material.dart';
import 'package:logger/logger.dart';
import 'package:flutter_background_service/flutter_background_service.dart';
import 'package:peerhost_app/background_services.dart';
import 'services/wallet_service.dart';
import 'services/wallet_connect_service.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();
  await initializeService();
  runApp(const MyApp());
}

class MyApp extends StatelessWidget {
  const MyApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'PeerHost Worker',
      theme: ThemeData(primarySwatch: Colors.deepPurple, useMaterial3: true),
      home: const WorkerOnboardingScreen(),
      debugShowCheckedModeBanner: false,
    );
  }
}

class ServiceControlScreen extends StatefulWidget {
  const ServiceControlScreen({super.key});

  @override
  State<ServiceControlScreen> createState() => _ServiceControlScreenState();
}

class _ServiceControlScreenState extends State<ServiceControlScreen>
    with WidgetsBindingObserver {
  String text = "Start Service";
  bool isRunning = false;
  String? workerAddress = "Loading...";

  final WalletService _walletService = WalletService();
  final WalletConnectService _wcService = WalletConnectService();

  bool _isAuthorizedByOwner = false;
  bool _initFailed = false; // New state to track initialization failure

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addObserver(this);

    // Init async tasks
    _initWalletConnect();
    _loadWallet();
    _checkServiceStatus();
  }

  @override
  void dispose() {
    WidgetsBinding.instance.removeObserver(this);
    super.dispose();
  }

  // Initialize Reown AppKit via Service
  Future<void> _initWalletConnect() async {
    if (mounted) setState(() => _initFailed = false);

    // Wait for frame to ensure context is safe
    WidgetsBinding.instance.addPostFrameCallback((_) async {
      final success = await _wcService.initialize(context);

      if (mounted) {
        if (!success) {
          setState(() => _initFailed = true);
        } else {
          // Add listener to rebuild UI on state changes
          // Add listener to rebuild UI on state changes
          _wcService.modal.addListener(() {
            if (mounted) setState(() {});
          });
          setState(() {}); // Initial update
        }
      }
    });
  }

  Future<void> _loadWallet() async {
    final key = await _walletService.getOrGenerateWorkerKey();
    final auth = await _walletService.isAuthorized();
    if (mounted) {
      setState(() {
        workerAddress = key.address.hex;
        _isAuthorizedByOwner = auth;
      });
    }
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
    } else {
      service.startService();
    }

    if (mounted) {
      setState(() {
        isRunning = !isRunningNow;
        text = isRunning ? 'Stop Service' : 'Start Service';
      });
    }
  }

  void _openConnectModal() async {
    await _wcService.openModal(context);
  }

  void _disconnectWallet() async {
    await _wcService.disconnect();
    setState(() {
      _isAuthorizedByOwner = false;
    });
  }

  void _authorizeWorker() async {
    if (workerAddress == null) return;

    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(content: Text("Requesting Authorization in Wallet...")),
    );

    try {
      final txHash = await _wcService.authorizeWorker(workerAddress!);
      Logger().i("Authorized! TX: $txHash");

      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text(
            "Authorization Successful! Pending Chain Confirmation.",
          ),
        ),
      );

      await _walletService.setAuthorized(true);
      if (mounted) {
        setState(() {
          _isAuthorizedByOwner = true;
        });
      }
    } catch (e) {
      ScaffoldMessenger.of(
        context,
      ).showSnackBar(SnackBar(content: Text("Authorization Failed: $e")));
    }
  }

  @override
  Widget build(BuildContext context) {
    bool isConnected = _wcService.isConnected;

    return Scaffold(
      appBar: AppBar(title: const Text('PeerHost Worker Node')),
      body: Center(
        child: SingleChildScrollView(
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Icon(
                isRunning ? Icons.check_circle : Icons.power_settings_new,
                color: isRunning ? Colors.green : Colors.grey,
                size: 100,
              ),
              const SizedBox(height: 20),
              Text(
                isRunning ? "Node is Active" : "Node is Stopped",
                style: Theme.of(context).textTheme.headlineMedium,
              ),
              const SizedBox(height: 10),
              Container(
                padding: const EdgeInsets.all(16),
                margin: const EdgeInsets.symmetric(horizontal: 20),
                decoration: BoxDecoration(
                  color: Colors.grey[200],
                  borderRadius: BorderRadius.circular(10),
                ),
                child: Column(
                  children: [
                    const Text(
                      "Worker Address (Session Key)",
                      style: TextStyle(fontWeight: FontWeight.bold),
                    ),
                    const SizedBox(height: 5),
                    SelectableText(
                      workerAddress ?? "Generating...",
                      style: const TextStyle(
                        fontFamily: 'Courier',
                        fontSize: 12,
                      ),
                      textAlign: TextAlign.center,
                    ),
                    const SizedBox(height: 5),
                    const Text(
                      "(This key must be authorized by your main wallet)",
                      style: TextStyle(fontSize: 10, color: Colors.grey),
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 20),

              // Wallet Connect Section
              if (_initFailed)
                Column(
                  children: [
                    const Text(
                      "WalletConnect Init Failed",
                      style: TextStyle(color: Colors.red),
                    ),
                    ElevatedButton(
                      onPressed: _initWalletConnect,
                      child: const Text("Retry"),
                    ),
                  ],
                )
              else if (!_wcService.isInitialized)
                const Column(
                  children: [
                    CircularProgressIndicator(),
                    SizedBox(height: 8),
                    Text("Initializing Wallet..."),
                  ],
                )
              else if (!isConnected)
                ElevatedButton.icon(
                  onPressed: _openConnectModal,
                  icon: const Icon(Icons.link),
                  label: const Text("Connect MetaMask (Owner)"),
                )
              else
                Column(
                  children: [
                    Chip(
                      label: Text(
                        "Connected: ${_wcService.connectedAddress != null ? '${_wcService.connectedAddress!.substring(0, 6)}...${_wcService.connectedAddress!.substring(_wcService.connectedAddress!.length - 4)}' : 'Unknown'}",
                      ),
                      avatar: const Icon(Icons.check, color: Colors.white),
                      backgroundColor: Colors.green,
                    ),
                    const SizedBox(height: 10),
                    ElevatedButton.icon(
                      onPressed: _authorizeWorker,
                      icon: const Icon(Icons.verified_user),
                      label: const Text("Authorize Worker Key"),
                      style: ElevatedButton.styleFrom(
                        backgroundColor: Colors.blueAccent,
                        foregroundColor: Colors.white,
                      ),
                    ),
                    const SizedBox(height: 10),
                    TextButton(
                      onPressed: _disconnectWallet,
                      child: const Text(
                        "Disconnect Wallet",
                        style: TextStyle(color: Colors.red),
                      ),
                    ),
                  ],
                ),

              const SizedBox(height: 40),
              ElevatedButton(
                onPressed: _isAuthorizedByOwner ? _toggleService : null,
                style: ElevatedButton.styleFrom(
                  padding: const EdgeInsets.symmetric(
                    horizontal: 40,
                    vertical: 15,
                  ),
                  backgroundColor: isRunning ? Colors.redAccent : null,
                  foregroundColor: isRunning ? Colors.white : null,
                ),
                child: Text(text),
              ),
              if (!_isAuthorizedByOwner)
                const Padding(
                  padding: EdgeInsets.only(top: 8.0),
                  child: Text(
                    "Authorize wallet to start node",
                    style: TextStyle(color: Colors.red, fontSize: 12),
                  ),
                ),
            ],
          ),
        ),
      ),
    );
  }
}

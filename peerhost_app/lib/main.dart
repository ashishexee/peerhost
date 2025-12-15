import 'package:flutter/material.dart';
import 'package:flutter_background_service/flutter_background_service.dart';
import 'package:peerhost_app/background_services.dart';
import 'package:peerhost_app/screens/funding_screen.dart';
import 'package:peerhost_app/screens/login_screen.dart';
import 'package:peerhost_app/screens/worker_list_screen.dart';
import 'package:peerhost_app/screens/add_worker_screen.dart';
import 'package:peerhost_app/services/wallet_connect_service.dart';
import 'package:peerhost_app/services/wallet_service.dart';
import 'package:logger/logger.dart';

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
      theme: ThemeData(
        brightness: Brightness.dark,
        primarySwatch: Colors.deepPurple,
        useMaterial3: true,
        scaffoldBackgroundColor: Colors.black,
      ),
      initialRoute: '/',
      routes: {
        '/': (context) => const LoginScreen(),
        '/worker-list': (context) => const WorkerListScreen(),
        '/add-worker': (context) => const AddWorkerScreen(),
        '/funding': (context) => const FundingScreen(),
        '/home': (context) => const ServiceControlScreen(),
      },
      debugShowCheckedModeBanner: false,
    );
  }
}

class ServiceControlScreen extends StatefulWidget {
  const ServiceControlScreen({super.key});

  @override
  State<ServiceControlScreen> createState() => _ServiceControlScreenState();
}

class _ServiceControlScreenState extends State<ServiceControlScreen> {
  String text = "Start Service";
  bool isRunning = false;

  final WalletConnectService _wcService = WalletConnectService();
  final WalletService _walletService = WalletService();
  String? _workerAddress;

  @override
  void initState() {
    super.initState();
    _checkServiceStatus();
    _loadWorker();
  }

  Future<void> _loadWorker() async {
    final key = await _walletService.getOrGenerateWorkerKey();
    setState(() {
      _workerAddress = key.address.hex;
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

  void _disconnect() async {
    await _wcService.disconnect();
    if (mounted) {
      Navigator.of(context).pushReplacementNamed('/');
    }
  }

  @override
  Widget build(BuildContext context) {
    // This is the "White Scaffold" requested by user,
    // but sticking to dark theme for consistency unless forced.
    // User said "make the main screen or the home screen a white scaffold for now we will come to it later"
    // Okay, I will make it white.

    return Scaffold(
      backgroundColor: Colors.white,
      appBar: AppBar(
        title: const Text(
          'PeerHost Worker Node',
          style: TextStyle(color: Colors.black),
        ),
        backgroundColor: Colors.white,
        elevation: 0,
        actions: [
          IconButton(
            icon: const Icon(Icons.logout, color: Colors.black),
            onPressed: _disconnect,
          ),
        ],
      ),
      body: Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            // Status Circle
            Container(
              width: 150,
              height: 150,
              decoration: BoxDecoration(
                shape: BoxShape.circle,
                color: isRunning ? Colors.green[100] : Colors.grey[100],
                border: Border.all(
                  color: isRunning ? Colors.green : Colors.grey,
                  width: 3,
                ),
              ),
              child: Icon(
                isRunning ? Icons.check_rounded : Icons.power_settings_new,
                size: 60,
                color: isRunning ? Colors.green : Colors.grey,
              ),
            ),
            const SizedBox(height: 30),

            Text(
              isRunning ? "Node is Active" : "Node is Stopped",
              style: const TextStyle(
                fontSize: 24,
                fontWeight: FontWeight.bold,
                color: Colors.black,
              ),
            ),
            const SizedBox(height: 10),
            Text(
              "Worker: ${_workerAddress != null ? '${_workerAddress!.substring(0, 6)}...${_workerAddress!.substring(_workerAddress!.length - 4)}' : 'Loading...'}",
              style: TextStyle(color: Colors.grey[600]),
            ),

            const SizedBox(height: 50),

            ElevatedButton(
              onPressed: _toggleService,
              style: ElevatedButton.styleFrom(
                backgroundColor: isRunning ? Colors.red : Colors.black,
                foregroundColor: Colors.white,
                padding: const EdgeInsets.symmetric(
                  horizontal: 40,
                  vertical: 16,
                ),
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(30),
                ),
              ),
              child: Text(text),
            ),
          ],
        ),
      ),
    );
  }
}

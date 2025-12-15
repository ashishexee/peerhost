import 'package:flutter/material.dart';
import 'package:peerhost_app/background_services.dart';
import 'package:peerhost_app/screens/funding_screen.dart';
import 'package:peerhost_app/screens/login_screen.dart';
import 'package:peerhost_app/screens/service_control_screen.dart';
import 'package:peerhost_app/screens/worker_list_screen.dart';
import 'package:peerhost_app/screens/add_worker_screen.dart';

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

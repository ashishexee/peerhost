import 'dart:async';
import 'dart:ui';
import 'package:flutter_background_service/flutter_background_service.dart';
import 'package:flutter_local_notifications/flutter_local_notifications.dart';
import 'package:logger/logger.dart';
import 'services/blockchain_service.dart';
import 'services/execution_engine.dart';

final Logger logger = Logger();

// Entry point for the UI to call
Future<void> initializeService() async {
  final service = FlutterBackgroundService();

  // Android Notification Setup
  const AndroidNotificationChannel channel = AndroidNotificationChannel(
    'peerhost_worker_channel', // id
    'PeerHost Worker Service', // title
    description: 'This channel is used for the PeerHost Worker notification.',
    importance: Importance.low,
  );

  final FlutterLocalNotificationsPlugin flutterLocalNotificationsPlugin =
      FlutterLocalNotificationsPlugin();

  await flutterLocalNotificationsPlugin
      .resolvePlatformSpecificImplementation<
        AndroidFlutterLocalNotificationsPlugin
      >()
      ?.createNotificationChannel(channel);

  await service.configure(
    androidConfiguration: AndroidConfiguration(
      onStart: onStart, // The function to run in background
      autoStart: false, // We want the user to click "Start"
      isForegroundMode: true,
      notificationChannelId: 'peerhost_worker_channel',
      initialNotificationTitle: 'PeerHost Worker',
      initialNotificationContent: 'Initializing...',
      foregroundServiceNotificationId: 888,
    ),
    iosConfiguration: IosConfiguration(autoStart: false, onForeground: onStart),
  );
}

// THE BACKGROUND ISOLATE //
@pragma('vm:entry-point')
void onStart(ServiceInstance service) async {
  DartPluginRegistrant.ensureInitialized();

  // Initialize Services
  final blockchainService = BlockchainService();
  final executionEngine = ExecutionEngine();
  // walletService is used internally by blockchainService

  await blockchainService.initialize();
  executionEngine.initialize();

  if (service is AndroidServiceInstance) {
    service.on('setAsForeground').listen((event) {
      service.setAsForegroundService();
    });

    service.on('setAsBackground').listen((event) {
      service.setAsBackgroundService();
    });
  }

  service.on('stopService').listen((event) {
    service.stopSelf();
  });

  // Start Listening to Blockchain Events
  logger.i("Starting Blockchain Listener...");
  blockchainService.listenForRequests().listen((event) async {
    try {
      logger.i("Event Received. Starting Execution Flow...");

      // Note: Parsing raw events requires ABI decoding.
      // For this MVP, we assume the pipeline is triggered.
      // To make this fully functional, you would extract 'cid' and 'requestId' from 'event'.

      /* 
      // UNCOMMENT THIS TO ENABLE FULL PIPELINE (Requires valid Event Parsing)
      
      final cid = "Qm..."; // extracted from event
      final requestId = "123"; // extracted from event

      logger.i("Fetching Code for CID: $cid");
      final code = await blockchainService.fetchCode(cid);
      
      logger.i("Fetching Inputs for ReqID: $requestId");
      final inputs = await blockchainService.fetchInputs(requestId);
      
      logger.i("Executing...");
      final result = await executionEngine.execute(code, inputs);
      
      logger.i("Submitting Result: $result");
      await blockchainService.submitResult(requestId, result);
      
      */

      logger.i(
        "Processing complete (Pipeline is mocked pending Event Decoding).",
      );
    } catch (e) {
      logger.e("Error processing event: $e");
    }
  });

  // Polling / Heartbeat
  Timer.periodic(const Duration(seconds: 5), (timer) async {
    if (service is AndroidServiceInstance) {
      if (await service.isForegroundService()) {
        service.setForegroundNotificationInfo(
          title: "PeerHost Worker Active",
          content:
              "Listening for tasks... (Time: \${DateTime.now().hour}:\${DateTime.now().minute})",
        );
        logger.d("Worker Heartbeat: Alive");
      }
    }
  });
}

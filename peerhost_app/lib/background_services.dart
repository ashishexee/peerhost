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

  // Custom Logger that broadcasts to UI
  void broadcastLog(String category, String message) {
    final logParams = {'message': '[$category] $message'};
    service.invoke('log', logParams);
    logger.i("[$category] $message");
  }

  // Initialize Services
  final blockchainService = BlockchainService();
  final executionEngine = ExecutionEngine();

  broadcastLog("Listener", "Starting PeerHost Worker Node...");

  try {
    await blockchainService.initialize();
    broadcastLog("Listener", "Connected to RPC Provider.");
  } catch (e) {
    broadcastLog("Error", "Failed to initialize: $e");
  }

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
    broadcastLog("Listener", "Stopping service...");
    service.stopSelf();
  });

  // Start Listening to Blockchain Events
  broadcastLog("Listener", "Watching execution contract...");

  blockchainService.listenForDecodedRequests().listen((req) async {
    try {
      final requestId = req['requestId'].toString();
      final project = req['project'];
      final fn = req['fn'];
      final cid = req['cid'];

      broadcastLog(
        "Event",
        "ExecutionRequested: $project/$fn (ReqID: $requestId)",
      );

      // 1. Fetch Code
      broadcastLog("Worker", "Fetching code for $project/$fn ($cid)...");
      String code;
      try {
        code = await blockchainService.fetchCode(cid);
        // broadcastLog("IPFS", "Code fetched successfully.");
      } catch (e) {
        broadcastLog("IPFS", "Failed to fetch code: $e");
        return;
      }

      // 2. Fetch Inputs
      broadcastLog("Worker", "Fetching inputs for $requestId (Attempt 1/5)...");
      Map<String, dynamic> inputs = {};
      bool inputsReady = false;

      for (int i = 0; i < 5; i++) {
        try {
          inputs = await blockchainService.fetchInputs(requestId);
          inputsReady = true;
          broadcastLog("Worker", "Inputs fetched successfully.");
          break;
        } catch (e) {
          if (i < 4) {
            broadcastLog(
              "Worker",
              "Inputs not ready yet (404). Retrying in 1s...",
            );
            await Future.delayed(const Duration(seconds: 1));
          } else {
            broadcastLog("Worker", "Failed to fetch inputs after 5 attempts.");
          }
        }
      }

      if (!inputsReady) return;

      // 3. Execute
      broadcastLog("Executor", "Running code...");
      String result;
      try {
        result = await executionEngine.execute(code, inputs);
        broadcastLog("Executor", "Execution success.");
      } catch (e) {
        broadcastLog("Executor", "Execution failed: $e");
        return;
      }

      // 4. Submit Result
      broadcastLog("Result", "Processing result for $requestId");
      broadcastLog("Result", "Submitting proof on-chain...");

      try {
        final txHash = await blockchainService.submitResult(requestId, result);
        broadcastLog("Result", "Transaction sent: $txHash");
        broadcastLog("Result", "Successfully delivered result data.");
      } catch (e) {
        broadcastLog("Result", "Submission failed: $e");
      }
    } catch (e) {
      broadcastLog("Worker", "Error processing request: $e");
    }
  });

  // Polling / Heartbeat
  Timer.periodic(const Duration(seconds: 5), (timer) async {
    if (service is AndroidServiceInstance) {
      if (await service.isForegroundService()) {
        service.setForegroundNotificationInfo(
          title: "PeerHost Worker Active",
          content:
              "Scanning for tasks... (Time: ${DateTime.now().hour}:${DateTime.now().minute})",
        );
        broadcastLog("Worker", "Scanning for new tasks...");
      }
    } else {
      broadcastLog("Worker", "Scanning for new tasks...");
    }
  });
}

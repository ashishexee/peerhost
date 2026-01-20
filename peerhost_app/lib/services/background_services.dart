import 'dart:async';
import 'dart:ui';
import 'package:flutter/material.dart';
import 'package:flutter_background_service/flutter_background_service.dart';
import 'package:flutter_local_notifications/flutter_local_notifications.dart';
import 'package:logger/logger.dart';
import 'blockchain_service.dart';
import 'execution_engine.dart';

final Logger logger = Logger();

// Top-level function for background action handling
@pragma('vm:entry-point')
void notificationTapBackground(NotificationResponse notificationResponse) {
  if (notificationResponse.actionId == 'stop_service') {
    final service = FlutterBackgroundService();
    service.invoke("stopService");
  }
}

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

  await flutterLocalNotificationsPlugin
      .resolvePlatformSpecificImplementation<
        AndroidFlutterLocalNotificationsPlugin
      >()
      ?.requestNotificationsPermission();

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

@pragma('vm:entry-point')
void onStart(ServiceInstance service) async {
  DartPluginRegistrant.ensureInitialized();
  final FlutterLocalNotificationsPlugin flutterLocalNotificationsPlugin =
      FlutterLocalNotificationsPlugin();

  // this is for initializing the Default Icon (need to change that later ofc)
  const AndroidInitializationSettings androidInitializationSettings =
      AndroidInitializationSettings('mipmap/ic_launcher');

  final InitializationSettings initializationSettings = InitializationSettings(
    android: androidInitializationSettings,
  );

  int totalRequests = 0; // Request Counter

  await flutterLocalNotificationsPlugin.initialize(
    initializationSettings,
    onDidReceiveNotificationResponse: (NotificationResponse response) {
      if (response.actionId == 'stop_service') {
        service.stopSelf();
      }
    },
    onDidReceiveBackgroundNotificationResponse: notificationTapBackground,
  );

  // 2. Helper to Update Notification
  void updateNotification(String statusText) async {
    if (service is AndroidServiceInstance) {
      if (await service.isForegroundService()) {
        // Define the "Stop" Action
        const AndroidNotificationAction stopAction = AndroidNotificationAction(
          'stop_service', // action ID
          'Stop Service', // button text
          titleColor: Colors.red,
          showsUserInterface: false, // Don't open app
          cancelNotification: false,
        );

        flutterLocalNotificationsPlugin.show(
          888, // Must match foregroundServiceNotificationId in configure()
          'PeerHost Node', // Simplified Title
          statusText, // Simplified Body (removed "Status:" prefix)
          NotificationDetails(
            android: AndroidNotificationDetails(
              'peerhost_worker_channel',
              'PeerHost Worker Service',
              icon: 'mipmap/ic_launcher',
              ongoing: true, // Make it persistent
              actions: [stopAction], // Add the button
            ),
          ),
        );
      }
    }
  }

  // 3. Periodic Update Logic
  Timer.periodic(const Duration(seconds: 1), (timer) async {
    if (service is AndroidServiceInstance) {
      if (await service.isForegroundService()) {
        updateNotification("Running • Processed: $totalRequests");
      }
    }
  });

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

      broadcastLog("Result", "Processing result for $requestId");
      broadcastLog("Result", "Submitting proof on-chain...");

      try {
        await blockchainService.submitResultOffChain(requestId, result);
        broadcastLog("Result", "Signature submitted off-chain.");
        broadcastLog("Result", "Successfully delivered result data.");

        totalRequests++; // Increment counter on success
        updateNotification("Running • Processed: $totalRequests");
      } catch (e) {
        broadcastLog("Result", "Submission failed: $e");
      }
    } catch (e) {
      broadcastLog("Worker", "Error processing request: $e");
    }
  });
}

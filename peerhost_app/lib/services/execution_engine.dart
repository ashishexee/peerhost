import 'dart:async';
import 'dart:convert';
import 'package:flutter_js/flutter_js.dart';
import 'package:logger/logger.dart';

class ExecutionEngine {
  final Logger _logger = Logger();
  late JavascriptRuntime _runtime;
  Completer<String>? _activeCompleter;

  ExecutionEngine() {
    _logger.i("Initializing QuickJS Runtime...");
    _runtime = getJavascriptRuntime();
  }

  void initialize() {
    _runtime.onMessage('log', (dynamic args) {
      _logger.d('[JS Log] $args');
    });

    _runtime.onMessage('error', (dynamic args) {
      _logger.e('[JS Err] $args');
    });

    _runtime.onMessage('execution_result', (dynamic args) {
      _logger.d("[JS Result Received] $args");
      if (_activeCompleter != null && !_activeCompleter!.isCompleted) {
        String resultPayload;
        if (args is String) {
          resultPayload = args;
        } else {
          resultPayload = jsonEncode(args);
        }
        _activeCompleter!.complete(resultPayload);
      }
    });

    _runtime.onMessage('execution_error', (dynamic args) {
      _logger.e("[JS Error Received] $args");
      if (_activeCompleter != null && !_activeCompleter!.isCompleted) {
        _activeCompleter!.completeError(Exception(args.toString()));
      }
    });

    _runtime.evaluate("""
      var window = global = this;
      var console = {
        log: function(msg) { sendMessage('log', JSON.stringify(msg)); },
        error: function(msg) { sendMessage('error', JSON.stringify(msg)); }
      };
      var process = { 
        env: { NODE_ENV: 'production' } 
      };
    """);
  }

  Future<String> execute(String code, Map<String, dynamic> inputs) async {
    _logger.i("Executing worker code...");

    _activeCompleter = Completer<String>();

    final inputsJson = jsonEncode(inputs);

    try {
      _runtime.evaluate("var args = $inputsJson;");
      _runtime.evaluate(code);

      final invocationScript =
          """
      (function() {
        console.log("Invoking worker...");
        
        if (typeof globalThis.peerhost_worker === 'undefined') {
           console.error("Worker Global is undefined!");
           throw new Error('Worker not found. The bundle did not assign globalThis.peerhost_worker.');
        }
        
        var fn = globalThis.peerhost_worker.default || globalThis.peerhost_worker;
        console.log("Worker Type: " + typeof fn);
        
        // Internal helper to handle the result
        function sendRes(val) { 
            console.log("Sending Result: " + JSON.stringify(val));
            sendMessage('execution_result', JSON.stringify(val)); 
        }
        function sendErr(err) { 
            console.error("Sending Error: " + err);
            sendMessage('execution_error', err ? err.toString() : "Unknown JS Error"); 
        }

        try {
           // 1. If it's a Function -> Call it
           if (typeof fn === 'function') {
              console.log("Calling worker function...");
              var res = fn($inputsJson);
              
              if (res && typeof res.then === 'function') {
                 console.log("Worker returned Promise. Waiting...");
                 res.then(sendRes).catch(sendErr);
                 return "PENDING";
              }
              sendRes(res); 
              return "DONE";
           }
           
           // 2. If it's a Promise (Direct Export of Async IIFE) -> Await it
           if (fn && typeof fn.then === 'function') {
              console.log("Worker exported a Promise. Waiting...");
              fn.then(sendRes).catch(sendErr);
              return "PENDING";
           }

           // 3. If it's an Object/Value -> Return it
           console.log("Worker exported value: " + JSON.stringify(fn));
           sendRes(fn);
           return "DONE";
           
        } catch(e) {
           sendErr(e);
           return "PENDING";
        }
      })();
      """;

      final JsEvalResult jsResult = _runtime.evaluate(invocationScript);

      if (jsResult.stringResult == "PENDING") {
        Timer? pumpTimer;
        pumpTimer = Timer.periodic(Duration(milliseconds: 10), (timer) {
          _runtime.executePendingJob();
          if (_activeCompleter!.isCompleted) timer.cancel();
        });

        try {
          return await _activeCompleter!.future.timeout(
            Duration(seconds: 30),
            onTimeout: () {
              if (!_activeCompleter!.isCompleted) {
                _activeCompleter!.complete(
                  jsonEncode({
                    "error": "Timeout",
                    "details": "Execution took too long (> 30s).",
                  }),
                );
              }
              return jsonEncode({
                "error": "Timeout",
                "details": "Execution took too long (> 30s).",
              });
            },
          );
        } finally {
          pumpTimer.cancel();
        }
      }
      return await _activeCompleter!
          .future; 
    } catch (e) {
      _logger.e("Execution failed: $e");
      rethrow;
    }
  }

  void dispose() {
    _runtime.dispose();
  }
}

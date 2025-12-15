import 'dart:async';
import 'package:flutter_js/flutter_js.dart';
import 'package:logger/logger.dart';

class ExecutionEngine {
  final Logger _logger = Logger();
  late JavascriptRuntime _runtime;

  ExecutionEngine() {
    _logger.i("Initializing QuickJS Runtime...");
    _runtime = getJavascriptRuntime();
  }

  /// Initialize the sandbox with polyfills
  void initialize() {
    // 1. Console Polyfill
    _runtime.onMessage('log', (dynamic args) {
      _logger.d('[JS Log] $args');
    });

    _runtime.onMessage('error', (dynamic args) {
      _logger.e('[JS Err] $args');
    });

    // 2. Fetch Polyfill (Basic GET support for now)
    // Note: flutter_js runs synchronously-ish or async depending on implementation.
    // For async operations like fetch, we usually need to use 'sendMessage' back to Dart
    // and wait for a promise. This is complex in pure QuickJS without a bridge.
    // For MVP, we pass inputs directly, so fetch might not be needed INSIDE the worker
    // unless the worker code explicitly fetches external data.

    // Simplest Polyfill for environment variables
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

  /// Executes the worker code
  Future<String> execute(String code, Map<String, dynamic> inputs) async {
    _logger.i("Executing worker code...");

    // Inject Inputs as a global variable
    /*
      The worker code usually looks like:
      export default async function(args) { ... }
      OR it's a script that evaluates.
      
      We will wrap it to call a main function or similar.
      Assuming the code expects 'args' to be available globally for this MVP.
    */

    // Serialize inputs
    // We bind 'args' via evaluation or passing it.
    final inputsJson = inputs.toString(); // Naive

    // Evaluate the user code
    // We wrap it in an IIFE to capture the return
    final wrappedCode =
        """
      (function() {
        var args = $inputsJson; // Creating global scope args
        
        // USER CODE START
        $code
        // USER CODE END
        
        // If the code evaluated to something, return it.
        // Or if it set a result variable.
      })();
    """;

    try {
      final JsEvalResult jsResult = _runtime.evaluate(wrappedCode);

      if (jsResult.isError) {
        throw Exception("JS Error: ${jsResult.stringResult}");
      }

      return jsResult.stringResult; // Return result as string
    } catch (e) {
      _logger.e("Execution failed: $e");
      rethrow;
    }
  }

  void dispose() {
    _runtime.dispose();
  }
}

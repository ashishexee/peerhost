import 'dart:math';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'package:web3dart/web3dart.dart';
import 'package:web3dart/crypto.dart';
import 'package:logger/logger.dart';

class WalletService {
  final _storage = const FlutterSecureStorage();
  final Logger _logger = Logger();
  static const _keyParams = 'worker_private_key';

  /// Gets the existing worker key or generates a new one safely.
  Future<EthPrivateKey> getOrGenerateWorkerKey() async {
    String? privateKeyHex = await _storage.read(key: _keyParams);

    if (privateKeyHex == null) {
      _logger.i("No worker key found. Generating new Session Key...");
      final rng = Random.secure();
      final privateKey = EthPrivateKey.createRandom(rng);

      // Store as hex string
      final keyBytes = privateKey.privateKey;
      privateKeyHex = bytesToHex(keyBytes, include0x: true);

      await _storage.write(key: _keyParams, value: privateKeyHex);
      _logger.i("New Worker Key Generated: ${privateKey.address.hex}");
      return privateKey;
    } else {
      _logger.d("Worker key loaded from secure storage.");
      return EthPrivateKey.fromHex(privateKeyHex);
    }
  }

  /// Check if locally marked as authorized
  Future<bool> isAuthorized() async {
    String? val = await _storage.read(key: 'is_authorized');
    return val == 'true';
  }

  /// Mark as authorized
  Future<void> setAuthorized(bool authorized) async {
    await _storage.write(key: 'is_authorized', value: authorized.toString());
  }

  /// Clears the key (for debugging/reset)
  Future<void> clearKey() async {
    await _storage.delete(key: _keyParams);
    await _storage.delete(key: 'is_authorized');
  }
}

import 'dart:math';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'package:web3dart/web3dart.dart';
import 'package:web3dart/crypto.dart';
import 'package:logger/logger.dart';

class WalletService {
  final _storage = const FlutterSecureStorage();
  final Logger _logger = Logger();
  static const _keyParams = 'worker_private_key';

  /// Saves a specific worker key for an address
  Future<void> saveWorkerKey(String address, String privateKeyHex) async {
    final normalizedAddr = address.toLowerCase();
    await _storage.write(
      key: 'worker_key_$normalizedAddr',
      value: privateKeyHex,
    );
  }

  /// Checks if we have the private key for a given address
  Future<bool> hasKey(String address) async {
    final normalizedAddr = address.toLowerCase();
    final key = await _storage.read(key: 'worker_key_$normalizedAddr');
    return key != null;
  }

  /// Retrieves the private key for a specific address
  Future<EthPrivateKey?> getPrivateKeyForAddress(String address) async {
    final normalizedAddr = address.toLowerCase();
    final keyHex = await _storage.read(key: 'worker_key_$normalizedAddr');
    if (keyHex == null) return null;
    return EthPrivateKey.fromHex(keyHex);
  }

  /// Gets existing default key or generates new one.
  /// Maintained for backward compatibility but effectively manages "current session" key.
  Future<EthPrivateKey> getOrGenerateWorkerKey() async {
    // We still use the legacy key param for the "default" or "active" key
    // simply to not break existing flow immediately, but optimal flow is address-driven.
    String? privateKeyHex = await _storage.read(key: _keyParams);

    if (privateKeyHex == null) {
      return await regenerateWorkerKey();
    } else {
      return EthPrivateKey.fromHex(privateKeyHex);
    }
  }

  /// Forces generation of a NEW worker key and saves it securely.
  Future<EthPrivateKey> regenerateWorkerKey() async {
    _logger.i("Regenerating Worker Key...");
    final rng = Random.secure();
    final privateKey = EthPrivateKey.createRandom(rng);

    final keyBytes = privateKey.privateKey;
    final privateKeyHex = bytesToHex(keyBytes, include0x: true);
    final address = privateKey.address.hex.toLowerCase();

    // Save as THE default key
    await _storage.write(key: _keyParams, value: privateKeyHex);
    // ALSO save mapped to its address so we can find it by address later
    await saveWorkerKey(address, privateKeyHex);

    await setAuthorized(false);
    _logger.i("New Worker Key Generated: $address");
    return privateKey;
  }

  Future<bool> isAuthorized() async {
    String? val = await _storage.read(key: 'is_authorized');
    return val == 'true';
  }

  Future<void> setAuthorized(bool authorized) async {
    await _storage.write(key: 'is_authorized', value: authorized.toString());
  }

  Future<void> clearKey() async {
    await _storage.delete(key: _keyParams);
    await _storage.delete(key: 'is_authorized');
  }
}

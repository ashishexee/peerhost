// ignore_for_file: constant_identifier_names

const String EXECUTION_COORDINATOR_ADDRESS =
    "0xdd94D8F7061320B8C10263E52951852948420608";
const String RPC_URL =
    "https://polygon-amoy.g.alchemy.com/v2/pBRHwIu8bYhPcgeittRy4";
const String GATEWAY_URL = "https://peerhost-jl8u.vercel.app";

const String EXECUTION_COORDINATOR_ABI = '''
[
  {
    "type": "function",
    "name": "registerWorker",
    "inputs": [
      { "name": "worker", "type": "address", "internalType": "address" }
    ],
    "outputs": [],
    "stateMutability": "nonpayable"
  },
  {
    "type": "function",
    "name": "getUserWorkers",
    "inputs": [
        { "name": "user", "type": "address", "internalType": "address" }
    ],
    "outputs": [
        { "name": "workers", "type": "address[]", "internalType": "address[]" }
    ],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "workerToUser",
    "inputs": [
        { "name": "", "type": "address", "internalType": "address" }
    ],
    "outputs": [
        { "name": "", "type": "address", "internalType": "address" }
    ],
    "stateMutability": "view"
  },

  {
    "type": "function",
    "name": "triggerRequest",
    "inputs": [
      { "name": "wallet", "type": "address", "internalType": "address" },
      { "name": "project", "type": "string", "internalType": "string" },
      { "name": "fn", "type": "string", "internalType": "string" },
      { "name": "cid", "type": "string", "internalType": "string" },
      { "name": "inputHash", "type": "bytes32", "internalType": "bytes32" }
    ],
    "outputs": [{ "name": "", "type": "bytes32", "internalType": "bytes32" }],
    "stateMutability": "nonpayable"
  },
  {
    "type": "function",
    "name": "submitResult",
    "inputs": [
      { "name": "requestId", "type": "bytes32", "internalType": "bytes32" },
      { "name": "resultHash", "type": "bytes32", "internalType": "bytes32" }
    ],
    "outputs": [],
    "stateMutability": "nonpayable"
  },
  {
    "type": "event",
    "name": "ExecutionRequested",
    "inputs": [
      { "name": "wallet", "type": "address", "indexed": true, "internalType": "address" },
      { "name": "project", "type": "string", "indexed": false, "internalType": "string" },
      { "name": "fn", "type": "string", "indexed": false, "internalType": "string" },
      { "name": "cid", "type": "string", "indexed": false, "internalType": "string" },
      { "name": "requestId", "type": "bytes32", "indexed": false, "internalType": "bytes32" }
    ],
    "anonymous": false
  },
  {
    "type": "event",
    "name": "ResultSubmitted",
    "inputs": [
      { "name": "requestId", "type": "bytes32", "indexed": true, "internalType": "bytes32" },
      { "name": "worker", "type": "address", "indexed": true, "internalType": "address" },
      { "name": "resultHash", "type": "bytes32", "indexed": false, "internalType": "bytes32" }
    ],
    "anonymous": false
  }
]
''';

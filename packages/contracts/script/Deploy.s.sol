// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Script.sol";
import "../src/ExecutionCoordinator.sol";

contract DeployScript is Script {
    function run() external {
        vm.startBroadcast();

        ExecutionCoordinator coordinator = new ExecutionCoordinator();

        console.log("Deployed ExecutionCoordinator at:", address(coordinator));

        vm.stopBroadcast();
    }
}

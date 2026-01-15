// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Test.sol";
import "../src/ExecutionCoordinator.sol";

contract ExecutionCoordinatorTest is Test {
    ExecutionCoordinator coordinator;
    address user = address(0x123);
    address worker = address(0x456);
    address gateway = address(0x789);

    function setUp() public {
        coordinator = new ExecutionCoordinator();

        // Set gateway permission
        coordinator.setGateway(gateway, true);

        coordinator.depositTreasury{value: 10 ether}();
    }

    function testTriggerRequest() public {
        vm.prank(user);
        bytes32 requestId = coordinator.triggerRequest(
            user,
            "test-project",
            "test-fn",
            "QmTestCID",
            bytes32(0)
        );

        assertTrue(coordinator.processedRequests(requestId));
    }

    function testWorkerRegistration() public {
        vm.prank(user);
        coordinator.registerWorker(worker);

        address registeredUser = coordinator.workerToUser(worker);
        assertEq(registeredUser, user);
    }

    function testStaking() public {
        // Register worker first
        vm.prank(user);
        coordinator.registerWorker(worker);

        // Stake
        vm.prank(user);
        coordinator.stake{value: 2 ether}(worker);

        (uint256 stakedAmount, bool isBlacklisted, , ) = coordinator
            .workerStakes(worker);
        assertEq(stakedAmount, 2 ether);
        assertFalse(isBlacklisted);
    }

    function testFinalizeRequests() public {
        // 1. Register and stake worker
        vm.prank(user);
        coordinator.registerWorker(worker);

        vm.prank(user);
        coordinator.stake{value: 2 ether}(worker);

        // 2. Trigger request
        vm.prank(user);
        bytes32 requestId = coordinator.triggerRequest(
            user,
            "test-project",
            "test-fn",
            "QmTestCID",
            bytes32(0)
        );

        // 3. Create signature
        bytes32 resultHash = keccak256("test-result");
        bytes32 messageHash = keccak256(
            abi.encodePacked(requestId, resultHash)
        );
        bytes32 ethSignedMessageHash = keccak256(
            abi.encodePacked("\x19Ethereum Signed Message:\n32", messageHash)
        );

        (uint8 v, bytes32 r, bytes32 s) = vm.sign(
            uint256(uint160(worker)),
            ethSignedMessageHash
        );
        bytes memory signature = abi.encodePacked(r, s, v);

        // 4. Finalize
        address[] memory workers = new address[](1);
        workers[0] = worker;

        bytes[] memory signatures = new bytes[](1);
        signatures[0] = signature;

        address[] memory slashees = new address[](0);

        uint256 balanceBefore = user.balance;

        vm.prank(gateway);
        coordinator.finalizeRequests(
            requestId,
            resultHash,
            workers,
            signatures,
            worker, // fastest worker
            slashees
        );

        // 5. Verify completion
        (, bytes32 storedHash, bool isCompleted) = coordinator.requests(
            requestId
        );
        assertEq(storedHash, resultHash);
        assertTrue(isCompleted);

        // 6. Verify reward
        uint256 balanceAfter = user.balance;
        assertGt(balanceAfter, balanceBefore);
    }

    function testCannotFinalizeWithoutGateway() public {
        vm.prank(user);
        bytes32 requestId = coordinator.triggerRequest(
            user,
            "p",
            "f",
            "c",
            bytes32(0)
        );

        address[] memory workers = new address[](0);
        bytes[] memory signatures = new bytes[](0);
        address[] memory slashees = new address[](0);

        vm.expectRevert("Not gateway");
        vm.prank(user);
        coordinator.finalizeRequests(
            requestId,
            bytes32(0),
            workers,
            signatures,
            address(0),
            slashees
        );
    }
}

// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Test.sol";
import "../src/ExecutionCoordinator.sol";

contract ExecutionCoordinatorTest is Test {
    ExecutionCoordinator coordinator;
    address worker = address(0x123);
    address requester = address(0x456);

    function setUp() public {
        coordinator = new ExecutionCoordinator();
    }

    function testTriggerRequest() public {
        vm.prank(requester);
        bytes32 requestId = coordinator.triggerRequest(
            requester,
            "test-project",
            "test-fn",
            "QmTestCID",
            bytes32(0)
        );

        assertTrue(coordinator.processedRequests(requestId));
    }

    function testSubmitResult() public {
        vm.prank(requester);
        bytes32 requestId = coordinator.triggerRequest(
            requester,
            "test-project",
            "test-fn",
            "QmTestCID",
            bytes32(0)
        );

        bytes32 resultHash = keccak256("result");

        vm.prank(worker);
        coordinator.submitResult(requestId, resultHash);

        (
            address req,
            address wonWorker,
            bytes32 resHash,
            bool isCompleted
        ) = coordinator.requests(requestId);

        assertEq(wonWorker, worker);
        assertEq(resHash, resultHash);
        assertTrue(isCompleted);
    }

    function testCannotSubmitTwice() public {
        vm.prank(requester);
        bytes32 requestId = coordinator.triggerRequest(
            requester,
            "test-project",
            "test-fn",
            "QmTestCID",
            bytes32(0)
        );

        bytes32 resultHash = keccak256("result");

        vm.prank(worker);
        coordinator.submitResult(requestId, resultHash);

        vm.expectRevert("Request already completed");
        vm.prank(address(0x999));
        coordinator.submitResult(requestId, resultHash);
    }

    function testRewardPayout() public {
        // 1. Fund Treasury
        coordinator.depositTreasury{value: 1 ether}();

        // 2. Trigger
        vm.prank(requester);
        bytes32 requestId = coordinator.triggerRequest(
            requester,
            "p",
            "f",
            "c",
            bytes32(0)
        );

        // 3. Worker balances before
        uint256 balanceBefore = worker.balance;

        // 4. Submit
        vm.prank(worker);
        coordinator.submitResult(requestId, keccak256("res"));

        // 5. Check Payout
        uint256 balanceAfter = worker.balance;
        assertEq(balanceAfter, balanceBefore + 0.001 ether);
    }

    function testNoPayoutIfEmpty() public {
        // Treasury empty
        vm.prank(requester);
        bytes32 requestId = coordinator.triggerRequest(
            requester,
            "p",
            "f",
            "c",
            bytes32(0)
        );

        uint256 balanceBefore = worker.balance;

        vm.prank(worker);
        coordinator.submitResult(requestId, keccak256("res"));

        uint256 balanceAfter = worker.balance;
        assertEq(balanceAfter, balanceBefore); 
    }
}

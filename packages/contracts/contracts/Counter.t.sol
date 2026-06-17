// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import { Counter } from "./Counter.sol";

/// @dev Hardhat 3 Solidity tests (Foundry-compatible). A `test*` function that
/// reverts fails; `testFuzz_*` params are fuzzed. No forge-std needed for plain
/// `require` assertions.
contract CounterTest {
    Counter private counter;

    function setUp() public {
        counter = new Counter();
    }

    function test_startsAtZero() public view {
        require(counter.count() == 0, "count should start at 0");
    }

    function test_incrementAddsOne() public {
        counter.increment();
        require(counter.count() == 1, "increment should make count 1");
    }

    function testFuzz_setCount(uint256 value) public {
        counter.setCount(value);
        require(counter.count() == value, "setCount should store value");
    }
}

// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

/// @title Counter — minimal demo contract for the starter.
contract Counter {
    uint256 public count;

    event Incremented(uint256 newCount);

    function increment() public {
        count++;
        emit Incremented(count);
    }

    function setCount(uint256 value) public {
        count = value;
        emit Incremented(count);
    }
}

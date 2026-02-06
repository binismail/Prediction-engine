// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract CollateralVault is Ownable {
    using ECDSA for bytes32;

    IERC20 public usdc;
    mapping(address => uint256) public nonces;

    event Deposit(address indexed user, uint256 amount);
    event Withdrawal(address indexed user, uint256 amount, uint256 nonce);

    constructor(address _usdc, address _owner) Ownable(_owner) {
        usdc = IERC20(_usdc);
    }

    function deposit(uint256 amount) external {
        require(usdc.transferFrom(msg.sender, address(this), amount), "Transfer failed");
        emit Deposit(msg.sender, amount);
    }

    function withdraw(uint256 amount, uint256 nonce, bytes memory signature) external {
        require(nonce == nonces[msg.sender]++, "Invalid nonce");
        
        bytes32 hash = keccak256(abi.encode(msg.sender, amount, nonce));
        address signer = hash.toEthSignedMessageHash().recover(signature);
        
        require(signer == owner(), "Invalid signature");
        require(usdc.transfer(msg.sender, amount), "Transfer failed");
        
        emit Withdrawal(msg.sender, amount, nonce);
    }
}

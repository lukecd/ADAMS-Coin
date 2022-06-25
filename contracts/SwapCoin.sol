// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract SwapCoin is ERC20 {
    
    constructor() ERC20("SwapCoin", "SWAP") {
       _mint(msg.sender, 42000000 * (10 ** decimals()));   
    }
}
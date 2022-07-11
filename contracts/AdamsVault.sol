// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

import "./AdamsCoin.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "hardhat/console.sol";

/**
 * @title A crypto currency inspired by the writings of Douglas Adams
 * @author Luke Cassady-Dorion
 * @dev This is part of a project I built to teach myself Solidity and React.
 * The Vault holds a collection of ADAMS COINS and allows users to claim 4200 coins each.
 * One claim per wallet. This allows users to interact with the system easily. 
 * 
 * Coins can also be claimed by using (free) Goerli ETH and swapping for ADAMS,
 * but I thought it would be fun to code a simple vault and to reduce barrier
 * to entry. 
 */
contract AdamsVault is Ownable {
    // the token we distribute with our vault
    IERC20 public immutable token;

    // mapping listing addresses and how much they have claimed
    mapping (address => uint) public transferRecipients; 

    // emitted on successful vault distributions
    event VaultDistribution(address distributionAddress, uint amount);

    constructor(address adamsAddress) {
        token = IERC20(adamsAddress);
    }

    /**
     * @notice allows anyone to deposit ADAMS coins into this contract (for eventual distribution to people)
     * @dev Minimum deposit is 42 ADAMS
     * @param amount The amount of ADAMS to deposit
     */
    function deposit(uint amount) external {
        require(amount > 42, "Come on, at least deposit 42 coins!");

        token.transferFrom(msg.sender, address(this), amount);
    }

    /**
     * @notice allows the contract owner to retrieve ADAMS coins stored in the contract
     */
    function withdraw() external onlyOwner {
        uint balance = token.balanceOf(address(this));
        require(balance > 0, "You appear to be out of ADAMS:(");

        token.transfer(msg.sender, balance);
    }

    /**
     * @notice Allows for each wallet to claim a total of 4200 ADAMS Coins
     * @dev The number of tokens available to claim is intentionally hard-coded. No
     * reason to waste gas creating a way to update it.
     * We actually transfer 10,000 tokens, which after tax is 4200. 
     * Originally I planned to allow this to be a tax-free transfer,
     * but now I think it's more fun to have more rewards floating around.
     */
    function claimDistribution() public {
        uint claimedRewards = transferRecipients[msg.sender];
        require(claimedRewards == 0, "Didn't I already give you some?");
        uint balance = token.balanceOf(address(this));
        require(balance > 0, "Hey, I'm out of ADAMS now, sorry. Can you come back later?:(");

        // 724137931 / 6000
        //transferRecipients[msg.sender] = 4200;
        //token.transfer(msg.sender, 4200 * (10 ** 18));
        transferRecipients[msg.sender] = (724137932 / 100000) * (10 ** 18);
        token.transfer(msg.sender, (724137932 / 100000) * (10 ** 18));
        
        // send an event 
        emit VaultDistribution(msg.sender, 4200);
    }

    /**
     * @notice Utility function to determine if msg.sender has claimed rewards as of yet.
     * Used by the UI to show / hide functionality based on usage. 
     * We only allow 1 wallet to claim 1 set of rewards.
     */
    function hasClaimedDistribution() public view returns(bool) {
        uint claimedRewards = transferRecipients[msg.sender];
        return (claimedRewards > 0); 
    }

    /**
    * @notice Returns the amount AdamsCoin tokens held by the contract
    */
    function getReserve() public view returns (uint) {
        return token.balanceOf(address(this));
    }
}
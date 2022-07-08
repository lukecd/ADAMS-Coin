// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

import "./AdamsCoin.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "hardhat/console.sol";

/**
 * @title A simple exchange contract allowing GOR / ADAMS swaps
 * @author Luke Cassady-Dorion (but this really isn't my code, it's mostly tutorial stuff)
 * @dev Based on https://www.learnweb3.io/tracks/sophomore/defi-amm-dapp. 
 *
 * The Swap component ended up being the hardest part of the project for me, mostly
 * because I had a hard time groking the math behind it. Eventually I found this
 * Tweet, which helped a lot https://twitter.com/BarryFried1/status/1537778904643117056
 * and then this tutorial https://www.learnweb3.io/tracks/sophomore/defi-amm-dapp.
 *
 * My original plan was to fork Uniswap v2, which I did and got it working, but I 
 * realized I didn't fully grok the code, so I didn't want to use it. Like I understood 
 * what it was doing (mostly), but felt like I should understand it at a deeper 
 * level before actually using it. SO ... I decided to launch with this code based
 * on the learnweb3 tutorial, which is basically like Uniswap V1. Post launch
 * I plan to study other LP pools and build them out here too. Next up will 
 * be forking Uniswap and then I'll look at other setups.
 *
 * This whole ADAMS Coin / ADAMS Exchange project is here to teach me about 
 * DeFi, so I figured the best way to do that is to just code up lots of different options.
 *
 * Normally ERC20 contracts that tax transfers this way wouldn't be
 * acceepted by Uniswap or other DEXs, but this all is just one big thought
 * experiment, so we get to be creative.
 *
 */
 contract AdamsSwap is ERC20 {
    AdamsCoin public immutable token;
    
    constructor(address adamsCoinAddress) ERC20("AdamsCoin LP Token", "ADLP") {
        require(adamsCoinAddress != address(0), "Token address passed is a null address");
        token = AdamsCoin(adamsCoinAddress);
    }

    /**
    * @notice Returns the amount AdamsCoin tokens held by the contract
    */
    function getReserve() public view returns (uint) {
        return token.balanceOf(address(this));
    }


    /**
    * @notice Adds liquidity to the exchange. 
    * @dev This contract allows for swapping between ADAMS and GOR
    * @param amount The amount of LP tokens to add 
    */
    function addLiquidity(uint amount) public payable returns (uint) {
        uint liquidity;
        uint ethBalance = address(this).balance;
        uint adamsReserve = getReserve();

        // this case only happens when the swap contract is empty
        if(adamsReserve == 0) {
            // transfer ADAMS ... this transfer will be taxed!
            token.transferFrom(msg.sender, address(this), amount);
            // mint LP tokens
            liquidity = ethBalance;
            _mint(msg.sender, liquidity);
        } 
        else {
            // ok, this is the math 
            // reserve is not empty, maintain the proper ratio
            uint ethReserve =  ethBalance - msg.value;
            // Ratio should always be maintained so that there are no major price impacts when adding liquidity
            // Ratio is -> (adamsTokenAmount user can add/cryptoDevTokenReserve in the contract) = (Eth Sent by the user/Eth Reserve in the contract);
            // So doing some maths, (cryptoDevTokenAmount user can add) = (Eth Sent by the user * cryptoDevTokenReserve /Eth Reserve);
            uint adamsTokenAmount = (msg.value * adamsReserve)/(ethReserve);
            require(amount >= adamsTokenAmount, "Amount of tokens sent is less than the minimum tokens required");
            // transfer only (cryptoDevTokenAmount user can add) amount of `Crypto Dev tokens` from users account
            // to the contract
            token.transferFrom(msg.sender, address(this), adamsTokenAmount);
            // The amount of LP tokens that would be sent to the user should be propotional to the liquidity of
            // ether added by the user
            // Ratio here to be maintained is ->
            // (LP tokens to be sent to the user (liquidity)/ totalSupply of LP tokens in contract) = (Eth sent by the user)/(Eth reserve in the contract)
            // by some maths -> liquidity =  (totalSupply of LP tokens in contract * (Eth sent by the user))/(Eth reserve in the contract)
            liquidity = (totalSupply() * msg.value)/ ethReserve;
            _mint(msg.sender, liquidity);
        }
        return liquidity;
    }

   /** 
    * @notice Removes liquidity from the exchange. 
    * @dev This contract allows for swapping between ADAMS and GOR
    * @param amount The amount of LP tokens to withdraw
    */
    function removeLiquidity(uint amount) public returns (uint , uint) {
        require(amount > 0, "_amount should be greater than zero");
        uint ethReserve = address(this).balance;
        uint _totalSupply = totalSupply();
        // The amount of Eth that would be sent back to the user is based
        // on a ratio
        // Ratio is -> (Eth sent back to the user) / (current Eth reserve)
        // = (amount of LP tokens that user wants to withdraw) / (total supply of LP tokens)
        // Then by some maths -> (Eth sent back to the user)
        // = (current Eth reserve * amount of LP tokens that user wants to withdraw) / (total supply of LP tokens)
        uint ethAmount = (ethReserve * amount)/ _totalSupply;
        // The amount of AADAMS that would be sent back to the user is based
        // on a ratio
        // Ratio is -> (ADAMS sent back to the user) / (current ADAMS reserve)
        // = (amount of LP tokens that user wants to withdraw) / (total supply of LP tokens)
        // Then by some maths -> (ADAMS sent back to the user)
        // = (current ADAMS token reserve * amount of LP tokens that user wants to withdraw) / (total supply of LP tokens)
        uint adamsTokenAmount = (getReserve() * amount)/ _totalSupply;
        // Burn the sent LP tokens from the user's wallet because they are already sent to
        // remove liquidity
        _burn(msg.sender, amount);
        // Transfer `ethAmount` of Eth from user's wallet to the contract
        payable(msg.sender).transfer(ethAmount);
        // Transfer `adamsTokenAmount` of Crypto Dev tokens from the user's wallet to the contract
        token.transfer(msg.sender, adamsTokenAmount);
        return (ethAmount, adamsTokenAmount);
    }


    /**
    * @notice Returns the amount Eth/ADAMS tokens that would be returned to the user in the swap
    */
    function getAmountOfTokens(uint256 inputAmount, uint256 inputReserve, uint256 outputReserve) public pure returns (uint256) {
        require(inputReserve > 0 && outputReserve > 0, "invalid reserves");
        // We are charging a fee of `1%`
        // Input amount with fee = (input amount - (1*(input amount)/100)) = ((input amount)*99)/100
        uint256 inputAmountWithFee = inputAmount * 99;
        // Because we need to follow the concept of `XY = K` curve
        // We need to make sure (x + Δx) * (y - Δy) = x * y
        // So the final formula is Δy = (y * Δx) / (x + Δx)
        // Δy in our case is `tokens to be received`
        // Δx = ((input amount)*99)/100, x = inputReserve, y = outputReserve
        // So by putting the values in the formulae you can get the numerator and denominator
        uint256 numerator = inputAmountWithFee * outputReserve;
        uint256 denominator = (inputReserve * 100) + inputAmountWithFee;
        return numerator / denominator;
    }

   /** 
    * @notice Swaps Goerli ETH for ADAMS Tokens
    * @param minTokens Pre-tax minimum, not that ADAMS COIN will tax this 42%
    * @dev Normally ERC20 contracts that tax transfers this way wouldn't be
    * acceepted by Uniswap or other DEXs, but this all is just one big thought
    * experiment, so we get to be creative.
    */
    function ethToAdams(uint minTokens) public payable {
        uint256 tokenReserve = getReserve();
        // call the `getAmountOfTokens` to get the amount of Adams tokens
        // that would be returned to the user after the swap
        // Notice that the `inputReserve` we are sending is equal to  
        // `address(this).balance - msg.value` instead of just `address(this).balance`
        // because `address(this).balance` already contains the `msg.value` user has sent in the given call
        // so we need to subtract it to get the actual input reserve
        uint256 tokensBought = getAmountOfTokens(
            msg.value,
            address(this).balance - msg.value,
            tokenReserve
        );

        require(tokensBought >= minTokens, "insufficient output amount");
        // Transfer the ADAMS tokens to the user
        token.transfer(msg.sender, tokensBought);
    }

    /** 
    * @notice Swaps ADAMS Tokens for Goerli Eth
    * @param adamsSold Amount of ADAMS to sell
    * @param minEth Minimum amount of GOR to get back
    */
    function adamsToEth(uint adamsSold, uint minEth) public {
        uint256 tokenReserve = getReserve();
        // call the `getAmountOfTokens` to get the amount of Eth
        // that would be returned to the user after the swap
        uint256 ethBought = getAmountOfTokens(adamsSold, tokenReserve, address(this).balance);
        
        require(ethBought >= minEth, "insufficient output amount");
        // Transfer ADAMS tokens from the user's address to the contract
        token.transferFrom(msg.sender, address(this), adamsSold);
        // send the `ethBought` to the user from the contract
        payable(msg.sender).transfer(ethBought);
    }

 }
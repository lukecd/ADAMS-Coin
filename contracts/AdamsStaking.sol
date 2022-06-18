// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

import "./AdamsCoin.sol";
import "./Interest.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

/**
 * @title A crypto currency inspired by the writings of Douglas Adams
 * @author Luke Cassady-Dorion
 * @dev This is part of a project I built to teach myself Solidity and React.
 * The Staking contact allows users to stake their ADAMS and earn 42% APR. 
 * It is (somewhat) inspired by this tutorial
 * https://www.youtube.com/watch?v=aZRdaE8jxPk&list=PLMj8NvODurfEYLsuiClgikZBGDfhwdcXF&index=6
 */
contract AdamsStaking is Ownable {
  // the token we allow to be staked
  IERC20 public immutable token;

  // structs
  struct Deposit {
    uint256 timestamp;
    uint256 amount;
  }

  // mappings
  mapping(address => Deposit[]) public balances;

  // total amount staked
  // we track this so we can make sure the contract has enough additional balance to pay staking rewards
  uint public totalAmountStaked = 0;

  // variables
  //interest is paid at an annual rate of 42% 
  uint256 public rewardAPY = 42;

  uint256 public currentBlock = 0;

  // events
  event Stake(address indexed sender, uint256 amount);
  event StateWithdrawal(address recipient, uint amount);

  // constructor
  constructor(address adamsAddress) {
    token = IERC20(adamsAddress);
  }

  /**
   * @notice Allows user to stake tokens
   * @dev Assumes permission has already been given to access the tokens
   */
  function stake(uint amount) public {
    // transfer the tokens to the staking contract
    token.transferFrom(msg.sender, address(this), amount);

    // track total staked
    totalAmountStaked += amount;

    // track them in our ledger
    balances[msg.sender].push(Deposit(block.timestamp, amount));
    emit Stake(msg.sender, amount);
  }

  function withdraw() public  {
    Deposit[] storage deposits = balances[msg.sender];
    require(deposits.length !=0, "You have to deposit before withdrawing");

    uint amountToTransfer = 0;
    for(uint i=0; i<deposits.length; i++) {
      // update total amount staked
      totalAmountStaked -= deposits[i].amount;
      amountToTransfer += getRewardsForPrinciple(deposits[i].timestamp, deposits[i].amount);
    }

    token.transfer(msg.sender, amountToTransfer);

    emit StateWithdrawal(msg.sender, amountToTransfer);
  }

  /**
   * @notice Given a deposit amount and timestamp, calculate how much its worth with compounded interest
   * We take the base 42% APR and do lazy APR->APY calculation with to figure out compounded interest.
   * Users can deposit / withdraw whenever, but we don't pay interest until they have staked at least 1 day.
   * @dev Makes use of 3rd party libraries for the math stuff.
   */
  function getRewardsForPrinciple(uint whenStaked, uint principal) public returns (uint interest) {
    uint256 age = block.timestamp - whenStaked;

    // while we do auto-compound, we also require people to stake at least a day before withdrawing interest
    if(age <= 86400) return principal;

    // takes principal, rate, age
    Interest interestCalculator = new Interest();
    uint256 rate = interestCalculator.yearlyRateToRay(0.42 ether); //0.42 ETHER is 42% APR.
    uint256 principalPlusInterest = interestCalculator.accrueInterest(principal, rate, age);

    return principalPlusInterest; 
  }

  /**
   * @dev funciton to backdate the start-time (for testing interest calculations)
   */
  function backdateStartTimeOneMonth(address addressToBackdate) public {
    Deposit[] storage deposits = balances[addressToBackdate];
    for(uint i=0; i<deposits.length; i++) {
      deposits[i].timestamp -= 4 weeks;
    }
  }

  /**
   * @dev funciton to backdate the start-time (for testing interest calculations)
   */
  function backdateStartTimeOneYear(address addressToBackdate) public {
    Deposit[] storage deposits = balances[addressToBackdate];
    for(uint i=0; i<deposits.length; i++) {
      deposits[i].timestamp -= 52 weeks;
    }
  }
  

}

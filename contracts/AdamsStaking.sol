// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

import "./AdamsCoin.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";



/**
 * @title A crypto currency inspired by the writings of Douglas Adams
 * @author Luke Cassady-Dorion
 * @dev This is part of a project I built to teach myself Solidity and React.
 * The Staking contact allows users to stake their ADAMS and earn 42% APR. 
 * Users can stake as many times as they want, each earns interest from the time stakes
 * 
 * When the user withdraws their coins, we do a lazy computation of 
 * using this library https://github.com/wolflo/solidity-interest-helper
 *
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
    bool withdrawn; 
  }

  // mappings
  mapping(address => Deposit[]) public balances;
  address[] public depositors;

  // variables
  //interest is paid at an annual rate of 42% 
  uint256 public rewardAPY = 42;

  // used for interest calculations
  uint constant WAD = 10 ** 18;
  uint constant RAY = 10 ** 27;

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

    // track them in our ledger
    balances[msg.sender].push(Deposit(block.timestamp, amount, false));
    _checkAndAddToDepositorArray(msg.sender);
    emit Stake(msg.sender, amount);
  }

  /**
   * @notice Withdraws all staked funds and accrued interest
   */
  function withdraw() public  {
    Deposit[] storage deposits = balances[msg.sender];
    require(deposits.length !=0, "You have to deposit before withdrawing");

    uint amountToTransfer = 0;
    for(uint i=0; i<deposits.length; i++) {
      if(! deposits[i].withdrawn) {
        deposits[i].withdrawn = true; // mark as withdrawn
        amountToTransfer += getRewardsForPrinciple(deposits[i].timestamp, deposits[i].amount);

      }
    }

    token.transfer(msg.sender, amountToTransfer);

    emit StateWithdrawal(msg.sender, amountToTransfer);
  }

  /**
    * @notice Returns the total amount msg.sender has staked
    * including staking events from all dates.
    */
    function getAmountStaked() public view returns (uint) {
      Deposit[] storage deposits = balances[msg.sender];
      if(deposits.length == 0) return 0;

      uint totalStaked = 0;
      for(uint i=0; i<deposits.length; i++) {
        // update total amount staked
        if(!deposits[i].withdrawn) totalStaked += deposits[i].amount;
      }

      return totalStaked;
    }

    /**
    * @notice Returns the total available for withdraw for msg.sender, includes all interest
    */
    function getTotalDue() public view returns (uint) {
      Deposit[] storage deposits = balances[msg.sender];
      if(deposits.length == 0) return 0;

      uint totalDue = 0;
      for(uint i=0; i<deposits.length; i++) {
        // update total amount staked
        if(!deposits[i].withdrawn) totalDue += getRewardsForPrinciple(deposits[i].timestamp, deposits[i].amount);
      }
      return totalDue;
    }

    /**
     * @notice Returns the total amount staked by *all* users
     */
    function getTotalStaked() public view returns (uint) {
      if(depositors.length == 0) return 0;
      uint256 totalStaked = 0;
      // first iterate over the array of depositors
      for(uint i=0; i<depositors.length; i++) {

        Deposit[] storage deposits = balances[depositors[i]];

        // then iterate over the array of deposits for that user
        for(uint j=0; j<deposits.length; j++) {
          // update total amount staked
          if(!deposits[j].withdrawn) totalStaked += deposits[j].amount;
        }

      }

      return totalStaked;
    }


    /**
     * @notice Returns the *total* contract debt.
     * This is how much would be paid out if everyone removed their staked assets now
     */
    function getContractDebt() public view returns (uint) {
      if(depositors.length == 0) return 0;

      uint totalDebt = 0;
      // first iterate over the array of depositors
      for(uint i=0; i<depositors.length; i++) {
        Deposit[] storage deposits = balances[depositors[i]];
        // then iterate over the array of deposits for that user
        for(uint j=0; j<deposits.length; j++) {
          // update total amount staked
          if(!deposits[j].withdrawn) totalDebt += getRewardsForPrinciple(deposits[j].timestamp, deposits[j].amount);
        }

      }
      
      return totalDebt;
    }

    /**
     * @notice Returns the balance owned by the contract, includes 
     * all money staked and the reserve held to pay out rewards. 
     * This, combined with getContractDebt() is a useful way to make sure
     * enough rewards have been added to the staking contract
     */
    function getBalance() public view returns (uint) {
      return token.balanceOf(address(this));     
    }

    /**
      * @notice Given a deposit amount and timestamp, calculate how much its worth with compounded interest
      * We take the base 42% APR and do lazy APR->APY calculation with to figure out compounded interest.
      * Users can deposit / withdraw whenever, but we don't pay interest until they have staked at least 1 day.
      * @dev Makes use of 3rd party libraries for the math stuff.
      */
    function getRewardsForPrinciple(uint whenStaked, uint principal) private view returns (uint interest) {
      uint256 age = block.timestamp - whenStaked;

      // while we do auto-compound, we also require people to stake at least a day before withdrawing interest
      if(age <= 86400) return principal;

      // takes principal, rate, age
      //Interest interestCalculator = new Interest();
      uint256 rate = yearlyRateToRay(0.42 ether); //0.42 ETHER is 42% APR.
      uint256 principalPlusInterest = accrueInterest(principal, rate, age);

      return principalPlusInterest; 
    }

    /**
      * @dev Adds newHolder to the array of balances.
      * @dev Does not add if newHolder is already in the array.
      * @param newHolder The address to add.
      */
    function _checkAndAddToDepositorArray(address newHolder) private {
       for(uint i=0; i<depositors.length; i++) {
            // we're already in the array, so just return
            if(depositors[i] == newHolder) return;
        }
        depositors.push(newHolder);
    }
  /**
   * @dev function to backdate the start-time (for testing interest calculations)
   * I'm leaving these in here in case anyone looking at the code finds
   * them useful for their own testing
   */
  // function backdateStartTimeOneMonth(address addressToBackdate) public {
  //   Deposit[] storage deposits = balances[addressToBackdate];
  //   for(uint i=0; i<deposits.length; i++) {
  //     deposits[i].timestamp -= 4 weeks;
  //   }
  // }

  /**
   * @dev function to backdate the start-time (for testing interest calculations)
   */
  // function backdateStartTimeOneYear(address addressToBackdate) public {
  //   Deposit[] storage deposits = balances[addressToBackdate];
  //   for(uint i=0; i<deposits.length; i++) {
  //     deposits[i].timestamp -= 52 weeks;
  //   }
  // }
  
  // To simplify things (and optimize gas?), I've copied and pasted some functions from 
  // these 3rd party libraries. I DID NOT write them myself.
  // Links to the libraries are in the contract comments up top.
  /**
  * @dev Takes in the desired nominal interest rate per year, compounded
  *   every second (this is approximately equal to nominal interest rate
  *   per year compounded continuously). Returns the ray value expected
  *   by the accrueInterest function 
  * @param _rateWad A wad of the desired nominal interest rate per year,
  *   compounded continuously. Converting from ether to wei will effectively
  *   convert from a decimal value to a wad. So 5% rate = 0.05
  *   should be input as yearlyRateToRay( 0.05 ether )
  * @return 1 * 10 ** 27 + Effective Interest Rate Per Second * 10 ** 27
  */
  function yearlyRateToRay(uint _rateWad) internal pure returns (uint) {
      return add(wadToRay(1 ether), rdiv(wadToRay(_rateWad), weiToRay(365*86400)));
  }

  /**
  * @dev Uses an approximation of continuously compounded interest 
  * (discretely compounded every second)
  * @param _principal The principal to calculate the interest on.
  *   Accepted in wei.
  * @param _rate The interest rate. Accepted as a ray representing 
  *   1 + the effective interest rate per second, compounded every 
  *   second. As an example:
  *   I want to accrue interest at a nominal rate (i) of 5.0% per year 
  *   compounded continuously. (Effective Annual Rate of 5.127%).
  *   This is approximately equal to 5.0% per year compounded every 
  *   second (to 8 decimal places, if max precision is essential, 
  *   calculate nominal interest per year compounded every second from 
  *   your desired effective annual rate). Effective Rate Per Second = 
  *   Nominal Rate Per Second compounded every second = Nominal Rate 
  *   Per Year compounded every second * conversion factor from years 
  *   to seconds
  *   Effective Rate Per Second = 0.05 / (365 days/yr * 86400 sec/day) = 1.5854895991882 * 10 ** -9
  *   The value we want to send this function is 
  *   1 * 10 ** 27 + Effective Rate Per Second * 10 ** 27
  *   = 1000000001585489599188229325
  *   This will return 5.1271096334354555 Dai on a 100 Dai principal 
  *   over the course of one year (31536000 seconds)
  * @param _age The time period over which to accrue interest. Accepted
  *   in seconds.
  * @return The new principal as a wad. Equal to original principal + 
  *   interest accrued
  */
  function accrueInterest(uint _principal, uint _rate, uint _age) internal pure returns (uint) {
      return rmul(_principal, rpow(_rate, _age));
  }

  function wadToRay(uint _wad) internal pure returns (uint) {
      return mul(_wad, 10 ** 9);
  }

  // Go from wei to ray (10**27)
  function weiToRay(uint _wei) internal pure returns (uint) {
      return mul(_wei, 10 ** 27);
  } 

  // This program is free software: you can redistribute it and/or modify
  // it under the terms of the GNU General Public License as published by
  // the Free Software Foundation, either version 3 of the License, or
  // (at your option) any later version.

  // This program is distributed in the hope that it will be useful,
  // but WITHOUT ANY WARRANTY; without even the implied warranty of
  // MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
  // GNU General Public License for more details.

  // You should have received a copy of the GNU General Public License
  // along with this program.  If not, see <http://www.gnu.org/licenses/>.  
  function add(uint x, uint y) internal pure returns (uint z) {
      require((z = x + y) >= x, "ds-math-add-overflow");
  }
  function sub(uint x, uint y) internal pure returns (uint z) {
      require((z = x - y) <= x, "ds-math-sub-underflow");
  }
  function mul(uint x, uint y) internal pure returns (uint z) {
      require(y == 0 || (z = x * y) / y == x, "ds-math-mul-overflow");
  }

  function min(uint x, uint y) internal pure returns (uint z) {
      return x <= y ? x : y;
  }
  function max(uint x, uint y) internal pure returns (uint z) {
      return x >= y ? x : y;
  }
  function imin(int x, int y) internal pure returns (int z) {
      return x <= y ? x : y;
  }
  function imax(int x, int y) internal pure returns (int z) {
      return x >= y ? x : y;
  }

  //rounds to zero if x*y < WAD / 2
  function wmul(uint x, uint y) internal pure returns (uint z) {
      z = add(mul(x, y), WAD / 2) / WAD;
  }
  //rounds to zero if x*y < WAD / 2
  function rmul(uint x, uint y) internal pure returns (uint z) {
      z = add(mul(x, y), RAY / 2) / RAY;
  }
  //rounds to zero if x*y < WAD / 2
  function wdiv(uint x, uint y) internal pure returns (uint z) {
      z = add(mul(x, WAD), y / 2) / y;
  }
  //rounds to zero if x*y < RAY / 2
  function rdiv(uint x, uint y) internal pure returns (uint z) {
      z = add(mul(x, RAY), y / 2) / y;
  }

  // This famous algorithm is called "exponentiation by squaring"
  // and calculates x^n with x as fixed-point and n as regular unsigned.
  //
  // It's O(log n), instead of O(n) for naive repeated multiplication.
  //
  // These facts are why it works:
  //
  //  If n is even, then x^n = (x^2)^(n/2).
  //  If n is odd,  then x^n = x * x^(n-1),
  //   and applying the equation for even x gives
  //    x^n = x * (x^2)^((n-1) / 2).
  //
  //  Also, EVM division is flooring and
  //    floor[(n-1) / 2] = floor[n / 2].
  //
  function rpow(uint x, uint n) internal pure returns (uint z) {
      z = n % 2 != 0 ? x : RAY;

      for (n /= 2; n != 0; n /= 2) {
          x = rmul(x, x);

          if (n % 2 != 0) {
              z = rmul(z, x);
          }
      }
  }


}

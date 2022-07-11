// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Burnable.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Snapshot.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/math/SafeMath.sol";
import "hardhat/console.sol";


/**
 * @title A crypto currency inspired by the writings of Douglas Adams
 * @author Luke Cassady-Dorion
 * @dev This is part of a project I built to teach myself Solidity and React.
 * ADAMSCoin asks the question If "42" is the answer to the “ultimate question of life, the universe, and everything, 
 * then perhaps the question is "what random and unexpected thing will happen to me today?". 
 * Each token transfer is taxed 42% and then that tax is randomly given to one account holder.
 * Tax distribution is done according to these rules:
 * - The contract owner can never win
 * - 10 % of the time, there is a non-weighted distribution. Each wallet has an equal chance of winning, regardless of their token balance.
 * - 90% of the time there is a weighted distribution. Each token owned increases your chance of winning.
 */
contract AdamsCoin is ERC20, ERC20Burnable, ERC20Snapshot, Ownable {
    using SafeMath for uint256;

    // We track total coins in circulation for computing the weighted average
    // this DOES NOT include tokens owned by _owner or any contracts.
    // Just to be clear, tokens owend by AdamsVault and AdamsStaking are NOT included.
    // this is because they're transferred via the taxFreeTransfer() function
    uint256 private _totalCirculation = 0;

    // list of all addresses allowed to do tax-free transfers
    // if an address has a non-zero value it can do a tax-free transfer
    // this is mostly used to add swap liquidity, and also exists to make
    // this code futureproof.
    mapping(address => uint256) private _taxFreeAddresses;

    // list of all address blacklisted from getting rewards
    // if an address has a non-zero value it's not eligable for rewards
    // at present used to blacklist things like vault and staking contracts
    mapping(address => uint256) private _rewardsBlacklist;

    // for our psued-random number generation
    uint private _nonce;

    // These two data sctructures are maintained in parallel
    // nonOwerHolders is an array holding addresses of all wallets holding tokens who are !owner.
    // rewards is a mapping listing each wallet and its unclaimed rewards.
    address[] private _nonOwnerHolders;
    mapping(address => uint256) private _rewards;

    // emitted every time there's a tax distribution 
    event TaxDistribution(string _distributionType, address _winner, uint _value);

    constructor() ERC20("Adams Coin", "ADAMS") {
        _mint(msg.sender, 42000000 * (10 ** decimals()));
        blacklistFromRewards(msg.sender);
        blacklistFromRewards(address(this));
        _nonce = 42;
    }

    /**
     * @notice Transfers tokens while also taxing that trasnfer 42% and distributing that tax to a random holder
     * @dev This is called for 3rd party transfers, those that have been authorized with an approve
     * transaction first. 
     *
     * Since this will be called by the AdamsSwap contract, it's the main place we handle taxation.
     */
    function transferFrom(address from, address to, uint256 amount) public virtual override returns (bool) {
        // has recipient been whitelisted for tax-free tranfers?
        if(_taxFreeAddresses[to] != 0 || msg.sender == owner() || tx.origin == owner()) {
            return super.transferFrom(from, to, amount);
        }

        // add to the array of address holders
        _checkAndAddToHolderArray(to);
         
        // tax 42%
        uint256 tax = amount.mul(42).div(100);

        // first do the transfer, this allows the current tx
        // to be elgible for winning. technically it's possible to win
        // one's own taxes back.
        if( super.transferFrom(from, to, amount.sub(tax)) ) {
            // since we only transferred amount-tax out of the account, we now have to
            // burn the tax amount, we mint it a-new when rewards are claimed
             _burn(from, tax);

            // then distribute the tax
            _distributeTax(tax, to);

            // then increase circulation
            _totalCirculation = _totalCirculation.add(amount.sub(tax));

            return true;
        }
        return false;

    }

    /**
     * @notice Transfers tokens while also taxing that trasnfer 42% and distributing that tax to a random holder
     */
    function transfer(address to, uint256 amount) public override returns (bool) {
        // has recipient been whitelisted for tax-free tranfers?
        if(_taxFreeAddresses[to] != 0 || 
           msg.sender == owner() || 
           tx.origin == owner()) {
            return super.transfer(to, amount);
        }

        // add to the array of address holders
        _checkAndAddToHolderArray(to);
    
        // tax 42%
        uint256 tax = amount.mul(42).div(100);

        // first do the transfer, this allows the current tx
        // to be elgible for winning. technically it's possible to win
        // one's own taxes back.
        if( super.transfer(to, amount.sub(tax)) ) {
            // burn the tax amount, we mint it a-new when rewards are claimed
             _burn(msg.sender, tax);
             
            // then distribute the tax
            _distributeTax(tax, to);

            // then increase circulation
            _totalCirculation = _totalCirculation.add(amount.sub(tax));

            return true;
        }
        return false;
    }
    /**
     * @notice Does a tax-free transfer of ADAMS
     * @dev Is currently used to transfer coins to vault and staking contracts, might be used for other things in the future.
     */
    function taxFreeTransfer(address destination, uint amount) public onlyOwner() {
        super.transfer(destination, amount);
    }

    /**
     * @notice Whitelists an address to make tax-free transfers
     * @dev Is currently used to aid in adding liquidity to the swap contract, might be used for other things in the future.
     */
    function addTaxFreeActor(address taxFreeAddress) public onlyOwner() {
        // Using 0 and 42 as boolean values.
        // if _taxFreeAddresses[n] == 0, then n pays tax (AND IS ELIGABLE FOR REWARDS)
        _taxFreeAddresses[taxFreeAddress] = 42;
    }

    /**
     * @notice Allows us to blacklist an address from getting rewards
     * At present it's used to keep the large balances of coins owned by the staking
     * and vault contracts from winning most of the rewards. Structured it this way
     * to (hopefully) make things future-proof. Let's me add new things down the line.
     */
    function blacklistFromRewards(address noRewardsForYou) public onlyOwner() {
        _rewardsBlacklist[noRewardsForYou] = 42;
    }

    /**
     * @dev Adds newHolder to the array of holders.
     * @dev Does not add if newHolder is the contract owner.
     * @dev Does not add if newHolder is already in the array.
     * @dev Does not add if address is in _rewardsBlacklist
     * @param newHolder The address to add.
     */
    function _checkAndAddToHolderArray(address newHolder) private {
        if(newHolder == owner()) return;
        if(_rewardsBlacklist[newHolder] != 0) return;

        for(uint i=0; i<_nonOwnerHolders.length; i++) {
            // we're already in the array, so just return
            if(_nonOwnerHolders[i] == newHolder) return;
        }
        _nonOwnerHolders.push(newHolder);
    }

    /**
     * @notice Randomally select one wallet to receive that tax.
     * @dev The meaning of life may be 42, but the question that keeps us going, 
     * is "what random thing might happen to me today?"
     */
    function _distributeTax(uint taxAmount, address to) internal {

        // for the corner case when _totalCirculation == 0, we give tax to msg.sender
        if(_totalCirculation == 0) {
            _rewards[to] =  _rewards[to].add(taxAmount);
            emit TaxDistribution("Total circulation", to, taxAmount);    
            return;
        }
        
        uint whichWayToDistribute = _random(10);
         // 90% of the time we do a weighted distribution
        // meaning the bigger your balance, the more chance
        // you have of "winning"
        if(whichWayToDistribute <= 9) {
            _weightedDistribution(taxAmount);
        }
        else {
            // 10% of the time, we do an even distribution
            // where each wallet has an equal chance
            // of "winning", regardless of token balance.
            _evenDistribution(taxAmount);
        }
    }

    /**
     * @notice Performs a weighted distribution of the tax. 
     * @dev Each token owned increases your chance of winning.
     */
    function _weightedDistribution(uint taxAmount) internal {
        // pick a random number between 1 and _totalCirculation
        uint winningIndex = _random(_totalCirculation);

        // go through the accounts and pick a winner based on token balance
        uint runningTotal = 0;
        uint i = 0;
        while( (i<_nonOwnerHolders.length) && (winningIndex > runningTotal)) {     
            uint curBalance = balanceOf(_nonOwnerHolders[i]); 
            runningTotal = runningTotal.add(curBalance);
            if(winningIndex <= runningTotal) {
                _rewards[_nonOwnerHolders[i]] = _rewards[_nonOwnerHolders[i]].add(taxAmount);
                
                emit TaxDistribution("weighted distribution", _nonOwnerHolders[i], taxAmount);    
            }
            i++;
        }

    }

    /**
     * @notice Performs an evenly-weighted distribution of the tax.
     * @dev Every account has an equal chance of winning regardless of their token balance.
     */
    function _evenDistribution(uint taxAmount) internal {
        // pick a "random" number between 1 and the number
        // of account holders we have
        uint256 winningAccount = uint256(_random(_nonOwnerHolders.length));

        // subtract 1 as arrays are 0 indexed
        winningAccount--;

        // winning address
        address winningAddress = _nonOwnerHolders[winningAccount];

        // give the rewards to the winning account
        _rewards[winningAddress] = _rewards[winningAddress].add(taxAmount);

        emit TaxDistribution("even distribution", winningAddress, taxAmount);
    }

    /*
     * @notice Claim the rewards ownded my msg.sender and then zero out available rewards for that account.
     */
    function claimRewards() public {
        uint256 reward = _rewards[msg.sender];
        require((reward != 0), "no rewards available for claiming");

        // zero before sending
        _rewards[msg.sender] = 0;

        // increase circulation
        _totalCirculation = _totalCirculation.add(reward);
        
        
        // IMPORTANT
        // we call super.transfer as calling this.transfer would tax the rewards.
        //super.transferFrom(address(this), msg.sender, reward);
        _mint(msg.sender, reward);
    }

    /**
     * @notice Check available tax rewards for specified account.
     */
    function _checkRewards(address _account) internal view returns (uint) {
        return _rewards[_account];
    }
    
    /**
     * @notice Check available tax rewards for msg.sender
     */
    function checkRewards() public view returns (uint) {
        return(_checkRewards(msg.sender));
    }

    /**
     * @notice Returns two parallal arrays of addresses that have rewards and the reward amount
     * @dev Since Solidity doesn't allow returning an array of Struct, I wrote the function this way.
     * @dev I kinda feel like the code is a bit ugly and not really optimized, but
     * from what I understand, this way uses the least amount of gas. So, you know, don't
     * hate on the weird code that seems repetitive, at least it's free.
     */
    function getAllAvailableRewards() public view returns (address[] memory addresses, uint256[] memory rewards) {
        // first find out how many addresses have rewards available for claiming
        uint256 rewardsCount = 0;
        for(uint i=0; i<_nonOwnerHolders.length; i++) {
            if(_rewards[_nonOwnerHolders[i]] != 0) {
                rewardsCount++;
            }
        }

        // declare 2 static arrays matching our function parameters
        addresses = new address[](rewardsCount);
        rewards = new uint256[](rewardsCount);

        // fill the arrays
        uint256 j = 0;
        for(uint i=0; i<_nonOwnerHolders.length; i++) {
            if(_rewards[_nonOwnerHolders[i]] != 0) {
                addresses[j] = _nonOwnerHolders[i];
                rewards[j] = _rewards[_nonOwnerHolders[i]];
                j++;
            }
        }
        // no need to return as we specify variable names in returns above
    }

    // for testing
    function getNonOwnerHolders() public view returns(address[] memory) {
        return _nonOwnerHolders;
    }

    /**
     * @dev Returns a psuedo-random number between 1 and max. 
     * YES, I know it's not totally random :)
     */
    function _random(uint max) private returns (uint) {
        _nonce++;
        return uint(keccak256(abi.encodePacked(_nonce, block.timestamp, block.difficulty, msg.sender))) % max + 1;
    }

    // The following functions are overrides required by Solidity
    function _beforeTokenTransfer(address from, address to, uint256 amount)
        internal
        override(ERC20, ERC20Snapshot)
    {
        super._beforeTokenTransfer(from, to, amount);
    }
}
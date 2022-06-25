// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Burnable.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Snapshot.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/math/SafeMath.sol";
import "hardhat/console.sol";

/**
 Sat Jun 25 14:23
 AdamsCoin deployed to: 0xF122D843512bf2506e52f64a4bF6af12A9677Eda
AdamsVault deployed to: 0x8D721e9a6687433F88929A23F4295581b7b7D0d4
AdamsStaking deployed to: 0xb49382Eb42dEf1c991A9a45aB0f2881bEcfa5E1F
AdamsSwap deployed to: 0x36642552D9eCd1c679c0079C5EFBDCc9749B8550
 */

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
    uint256 private _totalCirculation = 0;

    // addresses of our vault, staking and swap contracts
    address private _vaultAddress;
    address private _stakingAddress;
    address private _swapAddress;

    // Tracks true ownership of tokens. This covers the case where a user stakes their ADAMS. 
    // As this changes ownership from the user's wallet to the staking contract, it would then
    // make those tokens ineligable for rewards. To get around this, we keep parallel ledgers
    // the parent contract tracks coins as they move from the user's wallet to the staking contract,
    // and this mapping tracks actual wallet ownership. 
    mapping(address => uint256) private _unstakedBalances;

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
        _nonce = 42;
    }

    /**
     * @dev Override _mint to allow us to maintain our parallel ledger
     */
    function _mint(address account, uint256 amount) internal virtual override {
        _unstakedBalances[account] = amount;
        return super._mint(account, amount);
    }

    /**
     * @notice Sets the address of our vault contract
     * @dev We track this address as we don't want coins owned by the vault to be eligable for rewards
     # @param vaultAddress The address of the vault contract
     */
    function setVaultAddress(address vaultAddress) public onlyOwner {
        _vaultAddress = vaultAddress;
    }

    /**
     * @notice Sets the address of our staking contract
     * @dev We track this address as we don't want coins owned by the staking contract to be eligable for rewards.
     * Also this allows us to continue issuing rewards to people who have staked their coins.
     # @param stakingAddress The address of the staking contract
     */
    function setStakingAddress(address stakingAddress) public onlyOwner {
        _stakingAddress = stakingAddress;
    }

    /**
     * @notice Sets the address of our swap contract
     * @dev We track this address as we don't want coins owned by the swap contract to be eligable for rewards.
     * Also this allows us to continue issuing rewards to people who have staked their coins.
     # @param swapAddress The address of the staking contract
     */
    function setSwapAddress(address swapAddress) public onlyOwner {
        _swapAddress = swapAddress;
    }

    /**
     * @notice Transfers tokens while also taxing that trasnfer 42% and distributing that tax to a random holder
     * @dev This is called for 3rd party transfers, those that have been authorized with an approve
     * transaction first. 
     *
     * Since this will be called by the AdamsSwap contract, it's the main place we handle taxation.
     */
    function transferFrom(address from, address to, uint256 amount) public virtual override returns (bool) {
      // if we are transferring to _vaultAddress or _stakingAddress or _swapAddress, this is a tax free transfer
        if( (to == _vaultAddress) || (to == _stakingAddress) || (to == _swapAddress)) {
            return super.transferFrom(from, to, amount);       
        }

        // if the staking contract or vault contract are the sender, this is a tax free transfer
        if( (from == _vaultAddress) || (from == _stakingAddress)) {
            return super.transferFrom(from, to, amount);       
        }

        // if "to" != contract owner, see if they have an entry in rewards mapping
        if( to != owner() ) {
            // add to the array of address holders
            _checkAndAddToHolderArray(to);
        }
        // tax 42%
        uint256 tax = amount.mul(42).div(100);

        // first do the transfer, this allows the current tx
        // to be elgible for winning. technically it's possible to win
        // one's own taxes back.
        if( super.transferFrom(from, to, amount.sub(tax)) ) {
            // then distribute the tax
            _distributeTax(tax, to);

            // then increase circulation
            _totalCirculation = _totalCirculation.add(amount.sub(tax));

            // then update our parallel ledger
            uint256 fromBalance = _unstakedBalances[from];
            unchecked {
                _unstakedBalances[from] = fromBalance - amount;
            }
            _unstakedBalances[to] += amount;

            return true;
        }
        return false;

    }

    /**
     * @notice Transfers tokens while also taxing that trasnfer 42% and distributing that tax to a random holder
     */
    function transfer(address to, uint256 amount) public override returns (bool) {
        // if we are transferring to _vaultAddress or _stakingAddress or _swapAddress, this is a tax free transfer
        if( (to == _vaultAddress) || (to == _stakingAddress) || (to == _swapAddress)) {
            return super.transfer(to, amount);       
        }

        // if the staking contract or vault contract are the sender, this is a tax free transfer
        if( (msg.sender == _vaultAddress) || (msg.sender == _stakingAddress)) {
            return super.transfer(to, amount);       
        }

        // if "to" != contract owner, see if they have an entry in rewards mapping
        if( to != owner() ) {
            // add to the array of address holders
            _checkAndAddToHolderArray(to);
        }
        // tax 42%
        uint256 tax = amount.mul(42).div(100);

        // first do the transfer, this allows the current tx
        // to be elgible for winning. technically it's possible to win
        // one's own taxes back.
        if( super.transfer(to, amount.sub(tax)) ) {
            // then distribute the tax
            _distributeTax(tax, to);

            // then increase circulation
            _totalCirculation = _totalCirculation.add(amount.sub(tax));

            // then update our parallel ledger
            uint256 fromBalance = _unstakedBalances[msg.sender];
            unchecked {
                _unstakedBalances[msg.sender] = fromBalance - amount;
            }
            _unstakedBalances[to] += amount;

            return true;
        }
        return false;
    }

    /**
     * @dev Adds newHolder to the array of holders.
     * @dev Does not add if newHolder is the contract owner.
     * @dev Does not add if newHolder is already in the array.
     * @param newHolder The address to add.
     */
    function _checkAndAddToHolderArray(address newHolder) private {
        // QUESTION
        // I'm not sure which of these two lines is the best way
        // my guess is using require, but not sure if require is
        // generally used with private functions?
        // if(newHolder == owner) return;
        // or should it be an assert? 
        require(newHolder != owner() );
        
        // QUESTION
        // Is constantly iterating over this array to see if it contains a value
        // going to eat lots of gas? Should I instead just keep a mapping of
        // accounts currently in the array? Or would having an extra mapping
        // actually eat more gas as it has to be persisted?
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
            // This is where we use the parallel ledger. Calling balanceOf for an account that
            // staked all its tokens would return 0. Since we want to encourage staking
            // and also allow staked tokens to contrinute to winning a weightedDistribution, 
            // we have to use our paralle ledger instead of just calling balanceOf
            //uint curBalance = balanceOf(_nonOwnerHolders[i]); //DONT CALL THIS!
            uint curBalance = _unstakedBalances[_nonOwnerHolders[i]];

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
        _rewards[msg.sender] = 0;

        // increase circulation
        _totalCirculation = _totalCirculation.add(reward);
        
        // IMPORTANT
        // we call super.transfer as calling this.transfer would tax the rewards.
        super.transfer(msg.sender, reward);
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
        console.log("getAllAvailableRewards");
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

    /**
     * @dev Returns a psuedo-random number between 1 and max. 
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
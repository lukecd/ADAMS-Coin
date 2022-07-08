const hre = require("hardhat");

async function main() {
    const [owner, tranferRecipient1, tranferRecipient2, tranferRecipient3] = await hre.ethers.getSigners();
    let amountToTransfer = hre.ethers.utils.parseEther("1000000");

    console.log("\n\n\nOWNER IS ", owner.address);

    const AdamsCoin = await hre.ethers.getContractFactory("AdamsCoin");
    const adamsCoin = await AdamsCoin.deploy();
    await adamsCoin.deployed();
    console.log("AdamsCoin deployed to:", adamsCoin.address);
    console.log("AdamsCoin owner:", await adamsCoin.connect(owner).owner());

    const AdamsVault = await hre.ethers.getContractFactory("AdamsVault");
    const adamsVault = await AdamsVault.deploy(adamsCoin.address);
    await adamsVault.deployed();
    console.log("AdamsVault deployed to:", adamsVault.address);  

    const AdamsStaking = await hre.ethers.getContractFactory("AdamsStaking");
    const adamsStaking = await AdamsStaking.deploy(adamsCoin.address);
    await adamsStaking.deployed();
    console.log("AdamsStaking deployed to:", adamsStaking.address);  

    // set vault & staking address to prevent taxing
    await adamsCoin.connect(owner).setVaultAddress(adamsVault.address);
    await adamsCoin.connect(owner).setStakingAddress(adamsStaking.address);

    // transfer coins to AdamsVault 
    adamsCoin.connect(owner).transfer(adamsVault.address, amountToTransfer);
    let vaultBalance = await adamsCoin.connect(owner).balanceOf(adamsVault.address);
    vaultBalance = hre.ethers.utils.formatEther(vaultBalance);

    // transfer coins to AdamsStaking 
    adamsCoin.connect(owner).transfer(adamsStaking.address, amountToTransfer);
    let stakingContractBalance = await adamsCoin.connect(owner).balanceOf(adamsStaking.address);
    stakingContractBalance = hre.ethers.utils.formatEther(stakingContractBalance);

    // check that as deployer, I have 42,000,000 ADAMS Coins
    let ownerBalance = await adamsCoin.connect(owner).balanceOf(owner.address);
    ownerBalance = hre.ethers.utils.formatEther(ownerBalance);
    console.log(`Owner ${owner.address} has ${ownerBalance} ADAMS Coins`);

    // make 3 transfers
    adamsCoin.connect(owner).transfer(tranferRecipient1.address, amountToTransfer);
    adamsCoin.connect(owner).transfer(tranferRecipient2.address, amountToTransfer);
    adamsCoin.connect(owner).transfer(tranferRecipient3.address, amountToTransfer);
    
    // Now that we have 3 active users, let's try staking
    let amountToStake = await adamsCoin.connect(tranferRecipient1).balanceOf(tranferRecipient1.address);
    await adamsCoin.connect(tranferRecipient1).approve(adamsStaking.address, amountToStake);
    console.log(`approved ${adamsStaking.address} to access ${amountToStake}`);
    // check that approval worked
    let allowance = await adamsCoin.connect(tranferRecipient1).allowance(tranferRecipient1.address, adamsStaking.address);
    console.log(`${adamsStaking.address} is authorized to spend ${allowance}`);

    let tr1Balance = await adamsCoin.connect(owner).balanceOf(tranferRecipient1.address);
    tr1Balance = hre.ethers.utils.formatEther(tr1Balance);
    console.log(`Before Staking Transfer Recipient 1 ${tranferRecipient1.address} has ${tr1Balance} ADAMS Coins`);

    // stake in two chunks
    let formattedAmount = hre.ethers.utils.formatEther(amountToStake);
    let stakePt1 = formattedAmount / 2;
    let stakePt2 = stakePt1;
    stakePt1 = hre.ethers.utils.parseEther(""+stakePt1);
    stakePt2 = hre.ethers.utils.parseEther(""+stakePt2);
    await adamsStaking.connect(tranferRecipient1).stake(stakePt1);
    await adamsStaking.connect(tranferRecipient1).stake(stakePt2);
    console.log('coins staked');

    // check balances of staking contract and of tranferRecipient1
    tr1Balance = await adamsCoin.connect(owner).balanceOf(tranferRecipient1.address);
    tr1Balance = hre.ethers.utils.formatEther(tr1Balance);
    console.log(`After Staking Transfer Recipient 1 ${tranferRecipient1.address} has ${tr1Balance} ADAMS Coins`);
    
    let stakingBalance = await adamsCoin.connect(owner).balanceOf(adamsStaking.address);
    stakingBalance = hre.ethers.utils.formatEther(stakingBalance);
    console.log(`After Staking Staking Contract ${adamsStaking.address} has ${stakingBalance} ADAMS Coins`);

    // backdate the staking event 1 month. 
    // NOTE That the function is left in the contract after deploying to serve as 
    // a teaching tool, but the body is commented out on deploying
    await adamsStaking.connect(tranferRecipient1).backdateStartTimeOneYear(tranferRecipient1.address);
    console.log("staking backdated 1 year");

    // now try to withdraw all funds staked
    await adamsStaking.connect(tranferRecipient1).withdraw();
    console.log('coins un-staked');

    // and again check balances
    tr1Balance = await adamsCoin.connect(owner).balanceOf(tranferRecipient1.address);
    tr1Balance = hre.ethers.utils.formatEther(tr1Balance);
    console.log(`After Un-Staking Transfer Recipient 1 ${tranferRecipient1.address} has ${tr1Balance} ADAMS Coins`);
    
    stakingBalance = await adamsCoin.connect(owner).balanceOf(adamsStaking.address);
    stakingBalance = hre.ethers.utils.formatEther(stakingBalance);
    console.log(`After Un-Staking Staking Contract ${adamsStaking.address} has ${stakingBalance} ADAMS Coins`);

}


main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });


  /**
   * 
   * AdamsCoin deployed to: 0x87e128c6cD8Ffa3d8409187DE25CaBCaac1e2EF5
AdamsVault deployed to: 0xa20e128fFec6F8A59eF0C507901855cE9dB4279B
   */

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
  const adamsStaking = await AdamsVault.deploy(adamsCoin.address);
  await adamsStaking.deployed();
  console.log("AdamsStaking deployed to:", adamsStaking.address);  

  // set vault & staking address to prevent taxing
  await adamsCoin.connect(owner).setVaultAddress(adamsVault.address);
  await adamsCoin.connect(owner).setStakingAddress(adamsStaking.address);

  // transfer coins to vault and ensure they're not taxed
  adamsCoin.connect(owner).transfer(adamsVault.address, amountToTransfer);
  let vaultBalance = await adamsCoin.connect(owner).balanceOf(adamsVault.address);
  vaultBalance = hre.ethers.utils.formatEther(vaultBalance);
  console.log(`AdamsVault ${adamsVault.address} has ${vaultBalance} ADAMS Coins`);

  // check that as deployer, I have 42,000,000 ADAMS Coins
  let ownerBalance = await adamsCoin.connect(owner).balanceOf(owner.address);
  ownerBalance = hre.ethers.utils.formatEther(ownerBalance);
  console.log(`Owner ${owner.address} has ${ownerBalance} ADAMS Coins`);
  
  // transfer from ADAMS from owner to holder1 and verify tax amounts
  adamsCoin.connect(owner).transfer(tranferRecipient1.address, amountToTransfer);
  let tr1Balance = await adamsCoin.connect(owner).balanceOf(tranferRecipient1.address);
  tr1Balance = hre.ethers.utils.formatEther(tr1Balance);
  console.log(`Transfer Recipient 1 ${tranferRecipient1.address} has ${tr1Balance} ADAMS Coins`);
  console.log('Math check: 1000000 - 42% ', 1000000 - (1000000 * .42));

  // transfer from ADAMS from owner to holder2 and verify tax amounts
  adamsCoin.connect(owner).transfer(tranferRecipient2.address, amountToTransfer);
  let tr2Balance = await adamsCoin.connect(owner).balanceOf(tranferRecipient2.address);
  tr2Balance = hre.ethers.utils.formatEther(tr2Balance);
  console.log(`Transfer Recipient 2 ${tranferRecipient2.address} has ${tr2Balance} ADAMS Coins`);
  console.log('Math check: 1000000 - 42% ', 1000000 - (1000000 * .42));  

  // transfer from ADAMS from owner to holder3 and verify tax amounts
  adamsCoin.connect(owner).transfer(tranferRecipient3.address, amountToTransfer);
  let tr3Balance = await adamsCoin.connect(owner).balanceOf(tranferRecipient3.address);
  tr3Balance = hre.ethers.utils.formatEther(tr3Balance);
  console.log(`Transfer Recipient 3 ${tranferRecipient3.address} has ${tr3Balance} ADAMS Coins`);
  console.log('Math check: 1000000 - 42% ', 1000000 - (1000000 * .42));  

  // now see where the rewards are
  let tr1Rewards = await adamsCoin.connect(tranferRecipient1).checkRewards();
  let tr2Rewards = await adamsCoin.connect(tranferRecipient2).checkRewards();
  let tr3Rewards = await adamsCoin.connect(tranferRecipient3).checkRewards();
  tr1Rewards =  hre.ethers.utils.formatEther(tr1Rewards);
  tr2Rewards =  hre.ethers.utils.formatEther(tr2Rewards);
  tr3Rewards =  hre.ethers.utils.formatEther(tr3Rewards);

  console.log(`Transfer Recipient 1 ${tr1Rewards.address} has ${tr1Rewards} rewards`);
  console.log(`Transfer Recipient 2 ${tr2Rewards.address} has ${tr2Rewards} rewards`);
  console.log(`Transfer Recipient 3 ${tr3Rewards.address} has ${tr3Rewards} rewards`);

  // get all rewards as two arrays and print
  const getAllAvailableRewards = await adamsCoin.connect(owner).getAllAvailableRewards();
  const {0: addresses, 1: rewards} = getAllAvailableRewards;
  console.log("addresses ", addresses);
  console.log("rewards ", rewards);
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
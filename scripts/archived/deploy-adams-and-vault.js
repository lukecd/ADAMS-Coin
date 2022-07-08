
const hre = require("hardhat");

async function deployOnly() {
  //const AdamsCoin = await hre.ethers.getContractFactory("AdamsCoin");
  //const adamsCoin = await AdamsCoin.deploy();
  //await adamsCoin.deployed();
  //console.log("AdamsCoin deployed to:", adamsCoin.address);

  const AdamsVault = await hre.ethers.getContractFactory("AdamsVault");
  const adamsVault = await AdamsVault.deploy('0x87e128c6cD8Ffa3d8409187DE25CaBCaac1e2EF5');
  await adamsVault.deployed();
  console.log("AdamsVault deployed to:", adamsVault.address);  
}

async function transferToVault() {
    const [owner] = await hre.ethers.getSigners();
    // approve vault contract to access msg.sender's tokens

    const adamsCoin = await hre.ethers.getContractAt("AdamsCoin", '0xF122D843512bf2506e52f64a4bF6af12A9677Eda');
    console.log("AdamsCoin connected to:", adamsCoin.address);
    const adamsVault = await hre.ethers.getContractAt("AdamsVault", '0x74F4c8606e3c07bcB2C53f700f50eBB03268a939');
    console.log("AdamsVault connected to:", adamsVault.address);

    let amountToTransfer = hre.ethers.utils.parseEther("1000000");
    adamsCoin.connect(owner).approve(adamsVault.address, amountToTransfer);
    console.log("approved transfer");
    
    // transfer 1,000,000 tokens to the AdamsVault
    adamsVault.connect(owner).deposit(amountToTransfer);

    // check that the vault now has 1,000,000 tokens
    let vaultBalance = await adamsCoin.connect(owner).balanceOf(adamsVault.address);
    vaultBalance = hre.ethers.utils.formatEther(vaultBalance);
    console.log(`vault ${adamsVault.address} has ${vaultBalance} ADAMS Coins`);
}

async function main() {
  const [owner, vaultClaimer, tranferRecipient1, tranferRecipient2, tranferRecipient3] = await hre.ethers.getSigners();

  const AdamsCoin = await hre.ethers.getContractFactory("AdamsCoin");
  const adamsCoin = await AdamsCoin.deploy();
  await adamsCoin.deployed();
  console.log("AdamsCoin deployed to:", adamsCoin.address);

  const AdamsVault = await hre.ethers.getContractFactory("AdamsVault");
  const adamsVault = await AdamsVault.deploy(adamsCoin.address);
  await adamsVault.deployed();
  console.log("AdamsVault deployed to:", adamsVault.address);  

  // check that as deployer, I have 42,000,000 ADAMS Coins
  let ownerBalance = await adamsCoin.connect(owner).balanceOf(owner.address);
  ownerBalance = hre.ethers.utils.formatEther(ownerBalance);
  console.log(`Owner ${owner.address} has ${ownerBalance} ADAMS Coins`);

  // approve vault contract to access msg.sender's tokens
  let amountToTransfer = hre.ethers.utils.parseEther("1000000");
  adamsCoin.connect(owner).approve(adamsVault.address, amountToTransfer);

  // transfer 1,000,000 tokens to the AdamsVault
  adamsVault.connect(owner).deposit(amountToTransfer);

  // check that the vault now has 1,000,000 tokens
  let vaultBalance = await adamsCoin.connect(owner).balanceOf(adamsVault.address);
  vaultBalance = hre.ethers.utils.formatEther(vaultBalance);
  console.log(`vault ${adamsVault.address} has ${vaultBalance} ADAMS Coins`);

  // try claming awards from the vault
  await adamsVault.connect(vaultClaimer).claimDistribution();
  let vcBalance = await adamsCoin.connect(vaultClaimer).balanceOf(vaultClaimer.address);
  vcBalance = hre.ethers.utils.formatEther(vcBalance);
  console.log(`Vault Claimer ${vaultClaimer.address} has ${vcBalance} ADAMS Coins`);

  // check if we have claimed rewards
  let hasClaimedRewads = await adamsVault.connect(vaultClaimer).hasClaimedDistribution();
  console.log(`Vault Claimer ${vaultClaimer.address} hasClaimedRewads=${hasClaimedRewads}`);
  

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
  let tr1Rewards = await adamsCoin.connect(owner).checkRewards(tranferRecipient1.address);
  let tr2Rewards = await adamsCoin.connect(owner).checkRewards(tranferRecipient2.address);
  let tr3Rewards = await adamsCoin.connect(owner).checkRewards(tranferRecipient3.address);
  tr1Rewards =  hre.ethers.utils.formatEther(tr1Rewards);
  tr2Rewards =  hre.ethers.utils.formatEther(tr2Rewards);
  tr3Rewards =  hre.ethers.utils.formatEther(tr3Rewards);

  console.log(`Transfer Recipient 1 ${tr1Rewards.address} has ${tr1Rewards} rewards`);
  console.log(`Transfer Recipient 2 ${tr2Rewards.address} has ${tr2Rewards} rewards`);
  console.log(`Transfer Recipient 3 ${tr3Rewards.address} has ${tr3Rewards} rewards`);
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
//main()
transferToVault()
//deployOnly()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });


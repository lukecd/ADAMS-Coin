
const hre = require("hardhat");


async function main() {
  const [owner, vaultClaimer] = await hre.ethers.getSigners();

  const AdamsCoin = await hre.ethers.getContractFactory("AdamsCoin");
  const adamsCoin = await AdamsCoin.deploy();
  await adamsCoin.deployed();
  console.log("AdamsCoin deployed to:", adamsCoin.address);

  const AdamsVault = await hre.ethers.getContractFactory("AdamsVault");
  const adamsVault = await AdamsVault.deploy(adamsCoin.address);
  await adamsVault.deployed();
  console.log("AdamsVault deployed to:", adamsVault.address);  

  await adamsCoin.connect(owner).setVaultAddress(adamsVault.address);
  
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
  

}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });


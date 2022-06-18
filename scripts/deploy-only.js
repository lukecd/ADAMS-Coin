
const hre = require("hardhat");


async function main() {
  const [owner, vaultClaimer, tranferRecipient1, tranferRecipient2, tranferRecipient3] = await hre.ethers.getSigners();
  let amountToTransfer = hre.ethers.utils.parseEther("1000000");
  
  const AdamsCoin = await hre.ethers.getContractFactory("AdamsCoin");
  const adamsCoin = await AdamsCoin.deploy();
  await adamsCoin.deployed();
  console.log("AdamsCoin deployed to:", adamsCoin.address);

  const AdamsVault = await hre.ethers.getContractFactory("AdamsVault");
  const adamsVault = await AdamsVault.deploy(adamsCoin.address);
  await adamsVault.deployed();
  console.log("AdamsVault deployed to:", adamsVault.address);  

  const AdamsStaking = await hre.ethers.getContractFactory("AdamsStaking");
  const adamsStaking = await AdamsStaking.deploy(adamsCoin.address);
  await adamsStaking.deployed();
  console.log("AdamsStaking deployed to:", adamsStaking.address);  

  await adamsCoin.connect(owner).setVaultAddress(adamsVault.addres);
  console.log("Vault address set inside AdamsCoin");
  await adamsCoin.connect(owner).setStakingAddress(adamsStaking.address);
  console.log("Staking address set inside AdamsCoin");

}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });



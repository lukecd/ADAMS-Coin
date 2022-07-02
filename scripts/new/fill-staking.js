
const hre = require("hardhat");

/**
 * Simple script to add coins to the staking contract
 * 
 * 
 */
async function main() {
  const [owner] = await hre.ethers.getSigners();
  let amountToTransfer = hre.ethers.utils.parseEther("1000000");

  const adamsCoin = await hre.ethers.getContractAt("AdamsCoin", '0x721a90F0D1EA77dfbb1948eA5d3Fb61EE7eF4951');
  console.log("AdamsCoin connected to:", adamsCoin.address);
  const adamsStaking = await hre.ethers.getContractAt("AdamsStaking", '0xc0f5F68ccA498547b4Cb0A0f3BF3F9b06973548f');
  console.log("AdamsStaking connected to:", adamsStaking.address);

  // fill the vault
  await adamsCoin.connect(owner).taxFreeTransfer(adamsStaking.address, amountToTransfer);

  let balance = await adamsCoin.connect(owner).balanceOf(adamsStaking.address);
  balance = hre.ethers.utils.formatEther(balance);
  console.log(`Staking Contract ${adamsStaking.address} has ${balance} ADAMS Coins`);    

}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });



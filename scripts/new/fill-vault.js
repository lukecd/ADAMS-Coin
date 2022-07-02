
const hre = require("hardhat");

/**
 * Simple script to add coins to the vault
 * 
 */
async function main() {
  const [owner] = await hre.ethers.getSigners();
  let amountToTransfer = hre.ethers.utils.parseEther("1000000");

  const adamsCoin = await hre.ethers.getContractAt("AdamsCoin", '0x721a90F0D1EA77dfbb1948eA5d3Fb61EE7eF4951');
  console.log("AdamsCoin connected to:", adamsCoin.address);
  const adamsVault = await hre.ethers.getContractAt("AdamsVault", '0x223E4b76e88dBA8E1b480B71465079886b4594f1');
  console.log("AdamsVault connected to:", adamsVault.address);

  // fill the vault
  await adamsCoin.connect(owner).taxFreeTransfer(adamsVault.address, amountToTransfer);

  let balance = await adamsCoin.connect(owner).balanceOf(adamsVault.address);
  balance = hre.ethers.utils.formatEther(balance);
  console.log(`Vault Contract ${adamsVault.address} has ${balance} ADAMS Coins`);    

}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });



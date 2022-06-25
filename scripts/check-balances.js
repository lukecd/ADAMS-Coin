
const hre = require("hardhat");

/**
 * Simple script to check balances of our contracts
 * AdamsCoin deployed to: 0xF122D843512bf2506e52f64a4bF6af12A9677Eda
 * AdamsVault deployed to: 0x8D721e9a6687433F88929A23F4295581b7b7D0d4
 * AdamsStaking deployed to: 0xb49382Eb42dEf1c991A9a45aB0f2881bEcfa5E1F
 * AdamsSwap deployed to: 0x36642552D9eCd1c679c0079C5EFBDCc9749B8550
 */
async function main() {
    const [owner] = await hre.ethers.getSigners();
    let provider = ethers.provider;
    let amountToTransfer = hre.ethers.utils.parseEther("1000000");

    const adamsCoin = await hre.ethers.getContractAt("AdamsCoin", '0xF122D843512bf2506e52f64a4bF6af12A9677Eda');
    console.log("AdamsCoin connected to:", adamsCoin.address);
    const adamsSwap = await hre.ethers.getContractAt("AdamsSwap", '0x36642552D9eCd1c679c0079C5EFBDCc9749B8550');
    console.log("AdamsSwap connected to:", adamsSwap.address);
    const adamsVault = await hre.ethers.getContractAt("AdamsVault", '0x8D721e9a6687433F88929A23F4295581b7b7D0d4');
    console.log("AdamsVault connected to:", adamsVault.address);
    const adamsStaking = await hre.ethers.getContractAt("AdamsStaking", '0xb49382Eb42dEf1c991A9a45aB0f2881bEcfa5E1F');
    console.log("AdamsStaking connected to:", adamsStaking.address);

    let balance = await adamsCoin.connect(owner).balanceOf(adamsSwap.address);
    balance = hre.ethers.utils.formatEther(balance);
    console.log(`Swap Contract ${adamsSwap.address} has ${balance} ADAMS Coins`);    

    balance = await adamsCoin.connect(owner).balanceOf(adamsVault.address);
    balance = hre.ethers.utils.formatEther(balance);
    console.log(`Vault Contract ${adamsVault.address} has ${balance} ADAMS Coins`);    

    balance = await adamsCoin.connect(owner).balanceOf(adamsStaking.address);
    balance = hre.ethers.utils.formatEther(balance);
    console.log(`Staking Contract ${adamsStaking.address} has ${balance} ADAMS Coins`);    
}
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });



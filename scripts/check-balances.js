
const hre = require("hardhat");

/**
 * Simple script to check balances of our contracts


AdamsCoin deployed to: 0x005F065F00b12d4F1B2c9c98B3F1b28385A56254
AdamsVault deployed to: 0xAFF2dFc45540864AA841CA18E96e710d06c8BCF5
AdamsStaking deployed to: 0xC9f83D2d010dc887CE9D7cD2aCb2e5ea34b2eeBD
AdamsSwap deployed to: 0xe6d007d76b299C8E88eB2323148F84B2C6C25ac2

 */
async function main() {
    const [owner] = await hre.ethers.getSigners();
    let provider = ethers.provider;
    let amountToTransfer = hre.ethers.utils.parseEther("1000000");

    const adamsCoin = await hre.ethers.getContractAt("AdamsCoin", '0x005F065F00b12d4F1B2c9c98B3F1b28385A56254');
    console.log("AdamsCoin connected to:", adamsCoin.address);
    const adamsSwap = await hre.ethers.getContractAt("AdamsSwap", '0xe6d007d76b299C8E88eB2323148F84B2C6C25ac2');
    console.log("AdamsSwap connected to:", adamsSwap.address);
    const adamsVault = await hre.ethers.getContractAt("AdamsVault", '0xAFF2dFc45540864AA841CA18E96e710d06c8BCF5');
    console.log("AdamsVault connected to:", adamsVault.address);
    const adamsStaking = await hre.ethers.getContractAt("AdamsStaking", '0xC9f83D2d010dc887CE9D7cD2aCb2e5ea34b2eeBD');
    console.log("AdamsStaking connected to:", adamsStaking.address);

    let balance = await adamsCoin.connect(owner).balanceOf(adamsCoin.address);
    balance = hre.ethers.utils.formatEther(balance);
    console.log(`Coin Contract ${adamsCoin.address} has ${balance} ADAMS Coins`);   

    balance = await adamsCoin.connect(owner).balanceOf(adamsSwap.address);
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




const hre = require("hardhat");

/**
 * Simple script to check balances of our contracts
AdamsCoin deployed to: 0xCe1211D8B1e41857F521669B21c23400436affF9
AdamsVault deployed to: 0x26ee675a054E8813cd3F572509AC04c94D504d27
AdamsStaking deployed to: 0xB58113319627CcEE4b14A3ab0f7F8D3729FeD2F3
AdamsSwap deployed to: 0xce2EC93aC48Fa5Aa42a29856cD1A6D418E4e6bba
 */
async function main() {
    const [owner] = await hre.ethers.getSigners();
    let provider = ethers.provider;
    let amountToTransfer = hre.ethers.utils.parseEther("1000000");

    const adamsCoin = await hre.ethers.getContractAt("AdamsCoin", '0xCe1211D8B1e41857F521669B21c23400436affF9');
    console.log("AdamsCoin connected to:", adamsCoin.address);
    const adamsSwap = await hre.ethers.getContractAt("AdamsSwap", '0xce2EC93aC48Fa5Aa42a29856cD1A6D418E4e6bba');
    console.log("AdamsSwap connected to:", adamsSwap.address);
    const adamsVault = await hre.ethers.getContractAt("AdamsVault", '0x26ee675a054E8813cd3F572509AC04c94D504d27');
    console.log("AdamsVault connected to:", adamsVault.address);
    const adamsStaking = await hre.ethers.getContractAt("AdamsStaking", '0xB58113319627CcEE4b14A3ab0f7F8D3729FeD2F3');
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



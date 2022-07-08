
const hre = require("hardhat");

/**
 * Simple script to check balances of our contracts

AdamsCoin deployed to: 0x64f6fe8b3706295395a315D2Ea354E7CC785ac48
AdamsVault deployed to: 0x59225F45693CF5Ea777B0cbDD8fF244C7D35f5E4
AdamsStaking deployed to: 0x148E3199B7Ec184F301285764996A3B0351630A1
AdamsSwap deployed to: 0x2E69b91D8cd91AD5Edb29c65c901b23e2f095A1f

 */
async function main() {
    const [owner] = await hre.ethers.getSigners();
    let provider = ethers.provider;
    let amountToTransfer = hre.ethers.utils.parseEther("1000000");

    const adamsCoin = await hre.ethers.getContractAt("AdamsCoin", '0x64f6fe8b3706295395a315D2Ea354E7CC785ac48');
    console.log("AdamsCoin connected to:", adamsCoin.address);
    const adamsSwap = await hre.ethers.getContractAt("AdamsSwap", '0x2E69b91D8cd91AD5Edb29c65c901b23e2f095A1f');
    console.log("AdamsSwap connected to:", adamsSwap.address);
    const adamsVault = await hre.ethers.getContractAt("AdamsVault", '0x59225F45693CF5Ea777B0cbDD8fF244C7D35f5E4');
    console.log("AdamsVault connected to:", adamsVault.address);
    const adamsStaking = await hre.ethers.getContractAt("AdamsStaking", '0x148E3199B7Ec184F301285764996A3B0351630A1');
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



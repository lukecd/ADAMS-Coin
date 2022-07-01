
const hre = require("hardhat");

/**
 * Simple script to check balances of our contracts
AdamsCoin deployed to: 0xb37C634bB7877Ce22c729Ff37075Eb18F42879f9
AdamsVault deployed to: 0x725e78299d62bf230FD6BC3e0324C67119b6B503
AdamsStaking deployed to: 0x3ab6FcF1B4A87Dd246d6f75D6594B77EAA1fcAAC
AdamsSwap deployed to: 0xC2A2150219148bC394cAA81Dc3e1e80e20c116Bc
 */
async function main() {
    const [owner] = await hre.ethers.getSigners();
    let provider = ethers.provider;
    let amountToTransfer = hre.ethers.utils.parseEther("1000000");

    const adamsCoin = await hre.ethers.getContractAt("AdamsCoin", '0xb37C634bB7877Ce22c729Ff37075Eb18F42879f9');
    console.log("AdamsCoin connected to:", adamsCoin.address);
    const adamsSwap = await hre.ethers.getContractAt("AdamsSwap", '0xC2A2150219148bC394cAA81Dc3e1e80e20c116Bc');
    console.log("AdamsSwap connected to:", adamsSwap.address);
    const adamsVault = await hre.ethers.getContractAt("AdamsVault", '0x725e78299d62bf230FD6BC3e0324C67119b6B503');
    console.log("AdamsVault connected to:", adamsVault.address);
    const adamsStaking = await hre.ethers.getContractAt("AdamsStaking", '0x3ab6FcF1B4A87Dd246d6f75D6594B77EAA1fcAAC');
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



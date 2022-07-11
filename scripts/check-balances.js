
const hre = require("hardhat");

/**
 * Simple script to check balances of our contracts


AdamsCoin deployed to: 0xAA75B2F0A38506EE5A42fF74241f44645508b72e
AdamsVault deployed to: 0x8B517538168d8674f859b6a29C136F4DcA3e0EAa
AdamsStaking deployed to: 0x1c6BE1E04E78dae5D91F2b0d7E3455bBCAA3a851
AdamsSwap deployed to: 0x3315e0Ca84565B1DF96931F385505F457d1A4fbe

 */
async function main() {
    const [owner] = await hre.ethers.getSigners();
    let provider = ethers.provider;
    let amountToTransfer = hre.ethers.utils.parseEther("1000000");

    const adamsCoin = await hre.ethers.getContractAt("AdamsCoin", '0xAA75B2F0A38506EE5A42fF74241f44645508b72e');
    console.log("AdamsCoin connected to:", adamsCoin.address);
    const adamsSwap = await hre.ethers.getContractAt("AdamsSwap", '0x3315e0Ca84565B1DF96931F385505F457d1A4fbe');
    console.log("AdamsSwap connected to:", adamsSwap.address);
    const adamsVault = await hre.ethers.getContractAt("AdamsVault", '0x8B517538168d8674f859b6a29C136F4DcA3e0EAa');
    console.log("AdamsVault connected to:", adamsVault.address);
    const adamsStaking = await hre.ethers.getContractAt("AdamsStaking", '0x1c6BE1E04E78dae5D91F2b0d7E3455bBCAA3a851');
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



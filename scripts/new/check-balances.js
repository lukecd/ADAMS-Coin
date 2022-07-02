
const hre = require("hardhat");

/**
 * Simple script to check balances of our contracts


AdamsCoin deployed to: 0x23066f44A441421F6ACbB7dC17526a3FEC38e528
AdamsVault deployed to: 0xc00cf2bF83C72412113c4b64eb0001F58A1A7b26
AdamsStaking deployed to: 0x008B232AA9e238D5B9b6A599B9308c8D24F9fb2a
AdamsSwap deployed to: 0x81A4769E613d103F6A59AB330bf5bAD383d18efE

 */
async function main() {
    const [owner] = await hre.ethers.getSigners();
    let provider = ethers.provider;
    let amountToTransfer = hre.ethers.utils.parseEther("1000000");

    const adamsCoin = await hre.ethers.getContractAt("AdamsCoin", '0x23066f44A441421F6ACbB7dC17526a3FEC38e528');
    console.log("AdamsCoin connected to:", adamsCoin.address);
    const adamsSwap = await hre.ethers.getContractAt("AdamsSwap", '0x81A4769E613d103F6A59AB330bf5bAD383d18efE');
    console.log("AdamsSwap connected to:", adamsSwap.address);
    const adamsVault = await hre.ethers.getContractAt("AdamsVault", '0xc00cf2bF83C72412113c4b64eb0001F58A1A7b26');
    console.log("AdamsVault connected to:", adamsVault.address);
    const adamsStaking = await hre.ethers.getContractAt("AdamsStaking", '0x008B232AA9e238D5B9b6A599B9308c8D24F9fb2a');
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



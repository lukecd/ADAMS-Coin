
const hre = require("hardhat");

/**
 * Simple script to add liquidity to the Swap Contract
 */
async function main() {
  const [owner] = await hre.ethers.getSigners();
  let provider = ethers.provider;
  
  const adamsSwap = await hre.ethers.getContractAt("AdamsSwap", '0xA8760D4EB93b90FE0122A9153BA25D588A742032');
  console.log("AdamsSwap connected to:", adamsSwap.address);
  const adamsCoin = await hre.ethers.getContractAt("AdamsCoin", '0x20a75Cf5781B2ef4bbc9cB34DE5ad8556A265B76');
  console.log("AdamsCoin connected to:", adamsCoin.address);

  let swapBalance = await adamsCoin.connect(owner).balanceOf(adamsSwap.address);
  swapBalance = hre.ethers.utils.formatEther(swapBalance);
  console.log(`BEFORE:  Swap Contract ${adamsSwap.address} has ${swapBalance} ADAMS Coins`);    

  let swapEtherBalance = await provider.getBalance(adamsSwap.address);
  swapEtherBalance = hre.ethers.utils.formatEther(swapEtherBalance);
  console.log(`BEFORE: Swap Contract ${adamsSwap.address} has ${swapEtherBalance} GOR`);  

  // remove liquidity
  const amountToRemove = hre.ethers.utils.parseEther("0.01");
  await adamsSwap.removeLiquidity(amountToRemove, {
    gasLimit: 100000,
  });
  console.log("removed liquidity");

  swapBalance = await adamsCoin.connect(owner).balanceOf(adamsSwap.address);
  swapBalance = hre.ethers.utils.formatEther(swapBalance);
  console.log(`AFTER:  Swap Contract ${adamsSwap.address} has ${swapBalance} ADAMS Coins`);    

  swapEtherBalance = await provider.getBalance(adamsSwap.address);
  swapEtherBalance = hre.ethers.utils.formatEther(swapEtherBalance);
  console.log(`AFTER: Swap Contract ${adamsSwap.address} has ${swapEtherBalance} GOR`);  
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });



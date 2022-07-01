
const hre = require("hardhat");

/**
 * Simple script to add liquidity to the Swap Contract
 */
async function main() {
  const [owner] = await hre.ethers.getSigners();
  let provider = ethers.provider;
  
  const adamsSwap = await hre.ethers.getContractAt("AdamsSwap", '0x01F52Af3f5a43125ef866af37530da2FBBFA9437');
  console.log("AdamsSwap connected to:", adamsSwap.address);
  const adamsCoin = await hre.ethers.getContractAt("AdamsCoin", '0x8E8F24eCB0e9337e91C5724093F351B345699b73');
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



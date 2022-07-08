
const hre = require("hardhat");

/**
 * Simple script to add liquidity to the Swap Contract
 */
async function main() {
  const [owner] = await hre.ethers.getSigners();
  let provider = ethers.provider;
  
  const adamsSwap = await hre.ethers.getContractAt("AdamsSwap", '0x2E69b91D8cd91AD5Edb29c65c901b23e2f095A1f');
  console.log("AdamsSwap connected to:", adamsSwap.address);
  const adamsCoin = await hre.ethers.getContractAt("AdamsCoin", '0x64f6fe8b3706295395a315D2Ea354E7CC785ac48');
  console.log("AdamsCoin connected to:", adamsCoin.address);

  let swapBalance = await adamsCoin.connect(owner).balanceOf(adamsSwap.address);
  swapBalance = hre.ethers.utils.formatEther(swapBalance);
  console.log(`BEFORE:  Swap Contract ${adamsSwap.address} has ${swapBalance} ADAMS Coins`);    

  let swapEtherBalance = await provider.getBalance(adamsSwap.address);
  swapEtherBalance = hre.ethers.utils.formatEther(swapEtherBalance);
  console.log(`BEFORE: Swap Contract ${adamsSwap.address} has ${swapEtherBalance} GOR`);  

  // remove liquidity
  const amountToRemove = hre.ethers.utils.parseEther("8.97");
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



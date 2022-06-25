
const hre = require("hardhat");

/**
 * Simple script to add liquidity to the Swap Contract
 */
async function main() {
  const [owner] = await hre.ethers.getSigners();
  let provider = ethers.provider;
  let amountToTransfer = hre.ethers.utils.parseEther("1000000");
  
  const adamsCoin = await hre.ethers.getContractAt("AdamsCoin", '0xF122D843512bf2506e52f64a4bF6af12A9677Eda');
  console.log("AdamsCoin connected to:", adamsCoin.address);
  const adamsSwap = await hre.ethers.getContractAt("AdamsSwap", '0x36642552D9eCd1c679c0079C5EFBDCc9749B8550');
  console.log("AdamsSwap connected to:", adamsSwap.address);

  // add liquidity to the swap
  // 1000 ADAMS and .01 GOR
  // I need to figure out how to get more GOR so I can have lots of liquidity
  amountToTransfer = hre.ethers.utils.parseEther("1000");
  await adamsCoin.connect(owner).approve(adamsSwap.address, amountToTransfer);
  await adamsSwap.addLiquidity(amountToTransfer, { value: ethers.utils.parseEther(".01") });
  console.log("added liquidity");

  let swapBalance = await adamsCoin.connect(owner).balanceOf(adamsSwap.address);
  swapBalance = hre.ethers.utils.formatEther(swapBalance);
  console.log(`Swap Contract ${adamsSwap.address} has ${swapBalance} ADAMS Coins`);    

  let swapEtherBalance = await provider.getBalance(adamsSwap.address);
  swapEtherBalance = hre.ethers.utils.formatEther(swapEtherBalance);
  console.log(`Swap Contract ${adamsSwap.address} has ${swapEtherBalance} GOR`);  
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });



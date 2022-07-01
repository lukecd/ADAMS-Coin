
const hre = require("hardhat");

/**
 * Simple script to add liquidity to the Swap Contract
 */
async function main() {
  const [owner] = await hre.ethers.getSigners();
  let provider = ethers.provider;
  let amountToTransfer = hre.ethers.utils.parseEther("1000000");
  
  const adamsCoin = await hre.ethers.getContractAt("AdamsCoin", '0xb37C634bB7877Ce22c729Ff37075Eb18F42879f9');
  console.log("AdamsCoin connected to:", adamsCoin.address);
  const adamsSwap = await hre.ethers.getContractAt("AdamsSwap", '0xC2A2150219148bC394cAA81Dc3e1e80e20c116Bc');
  console.log("AdamsSwap connected to:", adamsSwap.address);

  // add liquidity to the swap
  // 100000 ADAMS and .01 GOR
  // I need to figure out how to get more GOR so I can have lots of liquidity
  amountToTransfer = hre.ethers.utils.parseEther("100000");
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



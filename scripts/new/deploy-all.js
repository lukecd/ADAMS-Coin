const hre = require("hardhat");

const main = async () => {
    const [owner] = await hre.ethers.getSigners();
    let provider = ethers.provider;
    
    const AdamsCoin = await hre.ethers.getContractFactory("AdamsCoin");
    const adamsCoin = await AdamsCoin.deploy();
    await adamsCoin.deployed();
    console.log("AdamsCoin deployed to:", adamsCoin.address);
  
    const AdamsVault = await hre.ethers.getContractFactory("AdamsVault");
    const adamsVault = await AdamsVault.deploy(adamsCoin.address);
    await adamsVault.deployed();
    console.log("AdamsVault deployed to:", adamsVault.address);  
  
    const AdamsStaking = await hre.ethers.getContractFactory("AdamsStaking");
    const adamsStaking = await AdamsStaking.deploy(adamsCoin.address);
    await adamsStaking.deployed();
    console.log("AdamsStaking deployed to:", adamsStaking.address);  
  
    const AdamsSwap = await hre.ethers.getContractFactory("AdamsSwap");
    const adamsSwap = await AdamsSwap.deploy(adamsCoin.address);
    await adamsSwap.deployed();
    console.log("AdamsSwap deployed to:", adamsSwap.address);  
  
    await adamsCoin.connect(owner).setVaultAddress(adamsVault.address);
    console.log("Vault address set inside AdamsCoin");
    await adamsCoin.connect(owner).setStakingAddress(adamsStaking.address);
    console.log("Staking address set inside AdamsCoin");
    await adamsCoin.connect(owner).setSwapAddress(adamsSwap.address);
    console.log("Swap address set inside AdamsCoin");
  
    // transfer 1,000,000 tokens to the vault contract
    adamsCoin.connect(owner).approve(adamsVault.address, amountToTransfer);
    adamsVault.connect(owner).deposit(amountToTransfer);
  
    // check that the vault now has 1,000,000 tokens
    let vaultBalance = await adamsCoin.connect(owner).balanceOf(adamsVault.address);
    vaultBalance = hre.ethers.utils.formatEther(vaultBalance);
    console.log(`Vault ${adamsVault.address} has ${vaultBalance} ADAMS Coins`);
  
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



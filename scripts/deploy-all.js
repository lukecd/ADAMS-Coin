const hre = require("hardhat");

const main = async () => {
    const [owner] = await hre.ethers.getSigners();
    let provider = ethers.provider;
    let amountToTransfer = hre.ethers.utils.parseEther("1000000");

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
  
    await adamsCoin.connect(owner).addTaxFreeActor(adamsSwap.address);
    await adamsCoin.connect(owner).addTaxFreeActor(adamsStaking.address);
    console.log("Swap / Staking address whitelisted for tax free status");
  
    // transfer 1,000,000 tokens to the vault contract
    adamsCoin.connect(owner).taxFreeTransfer(adamsVault.address, amountToTransfer);
  
    // check that the vault now has 1,000,000 tokens
    let balance = await adamsCoin.connect(owner).balanceOf(adamsVault.address);
    balance = hre.ethers.utils.formatEther(balance);
    console.log(`Vault ${adamsVault.address} has ${balance} ADAMS Coins`);

    // transfer 1,000,000 tokens to the staking contract
    await adamsCoin.connect(owner).taxFreeTransfer(adamsStaking.address, amountToTransfer);
  
    // check that the vault now has 1,000,000 tokens
    let vaultBalance = await adamsCoin.connect(owner).balanceOf(adamsStaking.address);
    vaultBalance = hre.ethers.utils.formatEther(vaultBalance);
    console.log(`Staking ${adamsStaking.address} has ${vaultBalance} ADAMS Coins`);
  
    // add liquidity to the swap
    // 900,000 ADAMS and 9 GOR
    amountToTransfer = hre.ethers.utils.parseEther("900000");
    await adamsCoin.connect(owner).approve(adamsSwap.address, amountToTransfer);
    await adamsSwap.addLiquidity(amountToTransfer, { value: ethers.utils.parseEther("9.0") });
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



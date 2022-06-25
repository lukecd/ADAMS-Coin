const hre = require("hardhat");

async function main() {
    const [owner, swapper1, swapper2] = await hre.ethers.getSigners();
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

    // create our swap
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

    // approve before swapping
    await adamsCoin.connect(owner).approve(adamsSwap.address, amountToTransfer);
    console.log(`approved ${adamsSwap.address} to access ${amountToTransfer}`);

    // add 1,000,000 ADAMS and 10 ETH (GOR)
    await adamsSwap.addLiquidity(amountToTransfer, { value: ethers.utils.parseEther("10") });
    console.log("added liquidity");

    let swapBalance = await adamsCoin.connect(owner).balanceOf(adamsSwap.address);
    swapBalance = hre.ethers.utils.formatEther(swapBalance);
    console.log(`Swap Contract ${adamsSwap.address} has ${swapBalance} ADAMS Coins`);    

    let swapEtherBalance = await provider.getBalance(adamsSwap.address);
    swapEtherBalance = hre.ethers.utils.formatEther(swapEtherBalance);
    console.log(`Swap Contract ${adamsSwap.address} has ${swapEtherBalance} ETH`);    

    // now let's try swapping 1 ETH, which should give us 100,000 ADAMS
    // STEP 1. Check amount of tokens returned
    // getAmountOfTokens takes (uint256 inputAmount, uint256 inputReserve, uint256 outputReserve)
    // when swapping GOR for ADAMS we use the following values
    // inputAmount = amount of ETH we want to swap
    // inputReserve = ETH balance of Swap Contract
    // outputReserve = ADAMS balance of Swap Contract
    let inputAmount = hre.ethers.utils.parseEther("1");
    let inputReserve = await provider.getBalance(adamsSwap.address);
    let outputReserve = await adamsCoin.connect(owner).balanceOf(adamsSwap.address);
    let amountOfTokens = await adamsSwap.connect(owner).getAmountOfTokens(inputAmount, inputReserve, outputReserve);
    // format them to make easier to read
    let inputAmountFormatted = hre.ethers.utils.formatEther(inputAmount);
    let amountOfTokensFormatted = hre.ethers.utils.formatEther(amountOfTokens);
    console.log(`Swapping ${inputAmountFormatted} GOR will get you ${amountOfTokensFormatted} ADAMS`);  
    
    // STEP 2: SWAP
    await adamsSwap.connect(swapper1).ethToAdams(amountOfTokens, { value: ethers.utils.parseEther("1") });

    // STEP 3: Check balance
    let swapper1Balance = await adamsCoin.connect(owner).balanceOf(swapper1.address);
    swapper1Balance = hre.ethers.utils.formatEther(swapper1Balance);
    console.log(`Post swap ${swapper1.address} has ${swapper1Balance} ADAMS`);

    // now let's try swapping 10,000 ADAMS and see what happens
    // STEP 1. Check amount of tokens returned
    // getAmountOfTokens takes (uint256 inputAmount, uint256 inputReserve, uint256 outputReserve)
    // when swapping ADAMS for GOR we use the following values
    // inputAmount = amount of ADAMS we want to swap
    // inputReserve = ADAMS balance of Swap Contract
    // outputReserve = ETH balance of Swap Contract
    inputAmount = hre.ethers.utils.parseEther("10000");
    inputReserve = await adamsCoin.connect(owner).balanceOf(adamsSwap.address);
    outputReserve = await provider.getBalance(adamsSwap.address);
    amountOfTokens = await adamsSwap.connect(owner).getAmountOfTokens(inputAmount, inputReserve, outputReserve);
    // format them to make easier to read
    inputAmountFormatted = hre.ethers.utils.formatEther(inputAmount);
    amountOfTokensFormatted = hre.ethers.utils.formatEther(amountOfTokens);
    console.log(`Swapping ${inputAmountFormatted} ADAMS will get you ${amountOfTokensFormatted} GOR`);  
    
    // STEP 2: APPROVE
    // Since this is ADAMS to GOR, we need to approve the contract to access our ADAMS first
    await adamsCoin.connect(swapper1).approve(adamsSwap.address, inputAmount);
    console.log(`approved ${adamsSwap.address} to access ${inputAmount}`);

    // STEP 3: SWAP
    await adamsSwap.connect(swapper1).adamsToEth(inputAmount, amountOfTokens);

    // STEP 4: Check balance
    swapper1Balance = await provider.getBalance(swapper1.address);
    swapper1Balance = hre.ethers.utils.formatEther(swapper1Balance);
    console.log(`Post swap ${swapper1.address} has ${swapper1Balance} GOR`);   
   
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });



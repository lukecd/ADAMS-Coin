const hre = require("hardhat");

async function main() {
    const [owner, p1, p2, p3, p4, p5, p6, p7, p8, p9] = await hre.ethers.getSigners();
    const swappers = [p1, p2, p3, p4, p5, p6, p7];
    //const swappers = [p1, p2, p3, p4];
    let amountToTransfer = hre.ethers.utils.parseEther("1000000");

    const AdamsCoin = await hre.ethers.getContractFactory("AdamsCoin");
    const adamsCoin = await AdamsCoin.deploy();
    await adamsCoin.deployed();
    console.log("AdamsCoin deployed to:", adamsCoin.address);

    const AdamsSwap = await hre.ethers.getContractFactory("AdamsSwap");
    const adamsSwap = await AdamsSwap.deploy(adamsCoin.address);
    await adamsSwap.deployed();
    console.log("AdamsSwap deployed to:", adamsSwap.address);  

    // whitelist for tax free status
    await adamsCoin.connect(owner).addTaxFreeActor(adamsSwap.address);
    console.log("Swap address whitelisted for tax free status");

    // set contract address and transfer amountToTransfer ADAMS  / ETH to swap contract
    await adamsCoin.connect(owner).approve(adamsSwap.address, amountToTransfer);
    console.log(`approved ${adamsSwap.address} to access ${amountToTransfer}`);
    await adamsSwap.addLiquidity(amountToTransfer, { value: ethers.utils.parseEther("10") });
    let swapADAMSBalance = await adamsCoin.connect(owner).balanceOf(adamsSwap.address);
    swapADAMSBalance = hre.ethers.utils.formatEther(swapADAMSBalance);
    console.log(`ADAMS Swap Contract has ${swapADAMSBalance} ADAMS`);

        
    console.log("\n\n\n********************** ETH TO ADAMS ******************************")
    // use the swap contract to swap ETH for ADAMS
    for(let i=0; i<swappers.length; i++) {
        // now let's try swapping 1 ETH, which should give us 100,000 ADAMS
        // STEP 1. Check amount of tokens returned
        // getAmountOfTokens takes (uint256 inputAmount, uint256 inputReserve, uint256 outputReserve)
        // when swapping GOR for ADAMS we use the following values
        // inputAmount = amount of ETH we want to swap
        // inputReserve = ETH balance of Swap Contract
        // outputReserve = ADAMS balance of Swap Contract
        let inputAmount = hre.ethers.utils.parseEther("1");
        let inputReserve = await ethers.provider.getBalance(adamsSwap.address);
        let outputReserve = await adamsCoin.connect(owner).balanceOf(adamsSwap.address);
        let amountOfTokens = await adamsSwap.connect(owner).getAmountOfTokens(inputAmount, inputReserve, outputReserve);
        // format them to make easier to read
        let inputAmountFormatted = hre.ethers.utils.formatEther(inputAmount);
        let amountOfTokensFormatted = hre.ethers.utils.formatEther(amountOfTokens);
        console.log(`${i}: Swapping ${inputAmountFormatted} GOR will get you ${amountOfTokensFormatted} ADAMS`);  
    
        // STEP 2: SWAP
        await adamsSwap.connect(swappers[i]).ethToAdams(amountOfTokens, { value: ethers.utils.parseEther("1") });

        // STEP 3: Check balance
        let swapperBalance = await adamsCoin.connect(owner).balanceOf(swappers[i].address);
        swapperBalance = hre.ethers.utils.formatEther(swapperBalance);
        console.log(`${i}: Post swap ${swappers[i].address} has ${swapperBalance} ADAMS`);
    }
    
    // see how rewards got distributed
    let getAllAvailableRewards = await adamsCoin.connect(owner).getAllAvailableRewards();
    let {0: addresses, 1: rewards} = getAllAvailableRewards;
    console.log("addresses ", addresses);
    console.log("rewards ", rewards);
    
    // make sure all the tax got transferred to ADAMSCOin
    console.log("\n\n\n********************** ADAMS BALANCE ******************************")
    let coinBalance = await adamsCoin.connect(owner).balanceOf(adamsCoin.address);
    coinBalance = hre.ethers.utils.formatEther(coinBalance);
    console.log(`ADAMS COIN ${adamsCoin.address} has ${coinBalance} ADAMS`)

    console.log("\n\n\n********************** ADAMS TO ETH ******************************")
    // NOW SWAP ADAMS FOR ETH
    // use the swap contract to swap ETH for ADAMS
    for(let i=0; i<swappers.length; i++) {
        // now let's try swapping 10,000 ADAMS and see what happens
        // STEP 1. Check amount of tokens returned
        // getAmountOfTokens takes (uint256 inputAmount, uint256 inputReserve, uint256 outputReserve)
        // when swapping ADAMS for GOR we use the following values
        // inputAmount = amount of ADAMS we want to swap
        // inputReserve = ADAMS balance of Swap Contract
        // outputReserve = ETH balance of Swap Contract
        inputAmount = hre.ethers.utils.parseEther("10000");
 
        inputReserve = await adamsCoin.connect(owner).balanceOf(adamsSwap.address);
        outputReserve = await ethers.provider.getBalance(adamsSwap.address);
        amountOfTokens = await adamsSwap.connect(owner).getAmountOfTokens(inputAmount, inputReserve, outputReserve);
        // format them to make easier to read
        inputAmountFormatted = hre.ethers.utils.formatEther(inputAmount);
        amountOfTokensFormatted = hre.ethers.utils.formatEther(amountOfTokens);
        
        // STEP 2: APPROVE
        // Since this is ADAMS to GOR, we need to approve the contract to access our ADAMS first
        await adamsCoin.connect(swappers[i]).approve(adamsSwap.address, inputAmount);

        // STEP 3: SWAP
        let swapperBalance = await ethers.provider.getBalance(swappers[i].address);
        swapperBalance = hre.ethers.utils.formatEther(swapperBalance);
        console.log(`${i}: Pre swap ${swappers[i].address} has ${swapperBalance} GOR`); 
        console.log(`${i} inputAmount ${inputAmount}`);
        console.log(`${i} amountOfTokens ${amountOfTokens}`);
        await adamsSwap.connect(swappers[i]).adamsToEth(inputAmount, amountOfTokens);

        // STEP 4: Check balance
        swapperBalance = await ethers.provider.getBalance(swappers[i].address);
        swapperBalance = hre.ethers.utils.formatEther(swapperBalance);
        console.log(`${i}: Post swap ${swappers[i].address} has ${swapperBalance} GOR`);  
    }

    // see how rewards got distributed
    getAllAvailableRewards = await adamsCoin.connect(owner).getAllAvailableRewards();
    let {0: addresses1, 1: rewards1} = getAllAvailableRewards;
    console.log("addresses ", addresses1);
    console.log("rewards ", rewards1);

    // make sure all the tax got transferred to ADAMSCOin
    console.log("\n\n\n********************** ADAMS BALANCE ******************************")
    coinBalance = await adamsCoin.connect(owner).balanceOf(adamsCoin.address);
    coinBalance = hre.ethers.utils.formatEther(coinBalance);
    console.log(`ADAMS COIN ${adamsCoin.address} has ${coinBalance} ADAMS`)
       
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });



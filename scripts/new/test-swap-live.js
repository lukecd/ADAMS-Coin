const hre = require("hardhat");

async function main() {
    const [owner, p1, p2, p3, p4, p5, p6, p7, p8, p9] = await hre.ethers.getSigners();
    const adamsCoin = await hre.ethers.getContractAt("AdamsCoin", '0xb37C634bB7877Ce22c729Ff37075Eb18F42879f9');
    console.log("AdamsCoin connected to:", adamsCoin.address);
    
    const adamsSwap = await hre.ethers.getContractAt("AdamsSwap", '0xC2A2150219148bC394cAA81Dc3e1e80e20c116Bc');
    console.log("AdamsSwap connected to:", adamsSwap.address);
    
    console.log("\n\n\n********************** ADAMS TO ETH ******************************")
    // NOW SWAP ADAMS FOR ETH
    // use the swap contract to swap ETH for ADAMS

    // now let's try swapping 10,000 ADAMS and see what happens
    // STEP 1. Check amount of tokens returned
    // getAmountOfTokens takes (uint256 inputAmount, uint256 inputReserve, uint256 outputReserve)
    // when swapping ADAMS for GOR we use the following values
    // inputAmount = amount of ADAMS we want to swap
    // inputReserve = ADAMS balance of Swap Contract
    // outputReserve = ETH balance of Swap Contract
    inputAmount = hre.ethers.utils.parseEther("627");
    inputReserve = await adamsCoin.connect(owner).balanceOf(adamsSwap.address);
    outputReserve = await ethers.provider.getBalance(adamsSwap.address);
    amountOfTokens = await adamsSwap.connect(owner).getAmountOfTokens(inputAmount, inputReserve, outputReserve);
    // format them to make easier to read
    inputAmountFormatted = hre.ethers.utils.formatEther(inputAmount);
    amountOfTokensFormatted = hre.ethers.utils.formatEther(amountOfTokens);
    console.log(`Swapping ${inputAmountFormatted} ADAMS will get you ${amountOfTokensFormatted} GOR`);  
    
    // STEP 2: APPROVE
    // Since this is ADAMS to GOR, we need to approve the contract to access our ADAMS first
    //await adamsCoin.connect(owner).approve(adamsSwap.address, inputAmount);
    let swapperBalance = await ethers.provider.getBalance(owner.address);
    swapperBalance = hre.ethers.utils.formatEther(swapperBalance);
    let adamsBalance = await adamsCoin.connect(owner).balanceOf(owner.address);
    adamsBalance = hre.ethers.utils.formatEther(adamsBalance);
    console.log(`Pre swap ${owner.address} has ${swapperBalance} GOR`);  
    console.log(`Pre swap ${owner.address} has ${adamsBalance} ADAMS`);  

    // STEP 3: SWAP
    const tx = await adamsSwap.connect(owner).adamsToEth(inputAmount, amountOfTokens, {
        gasLimit: 100000,
      });

      console.log("transaction done ", tx);
    // STEP 4: Check balance
    swapperBalance = await ethers.provider.getBalance(owner.address);
    swapperBalance = hre.ethers.utils.formatEther(swapperBalance);
    adamsBalance = await adamsCoin.connect(owner).balanceOf(owner.address);
    adamsBalance = hre.ethers.utils.formatEther(adamsBalance);
    console.log(`Post swap ${owner.address} has ${swapperBalance} GOR`);  
    console.log(`Post swap ${owner.address} has ${adamsBalance} ADAMS`);  

    // see how rewards got distributed
    getAllAvailableRewards = await adamsCoin.connect(owner).getAllAvailableRewards();
    let {0: addresses1, 1: rewards1} = getAllAvailableRewards;
    console.log("addresses ", addresses1);
    console.log("rewards ", rewards1);
       
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });



//39869000.57114

//39860000.57114

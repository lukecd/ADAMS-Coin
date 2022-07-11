const hre = require("hardhat");

const main = async () => {
    const [owner, p1, p2, p3, p4, p5, p6, p7, p8, p9] = await hre.ethers.getSigners();
    const stakers = [p1, p2, p3, p4, p5, p6, p7, p8, p9];
    let amountToTransfer = hre.ethers.utils.parseEther("1000000");

    const AdamsCoin = await hre.ethers.getContractFactory("AdamsCoin");
    const adamsCoin = await AdamsCoin.deploy();
    await adamsCoin.deployed();
    console.log("AdamsCoin deployed to:", adamsCoin.address);

    const AdamsStaking = await hre.ethers.getContractFactory("AdamsStaking");
    const adamsStaking = await AdamsStaking.deploy(adamsCoin.address);
    await adamsStaking.deployed();
    console.log("AdamsStaking deployed to:", adamsStaking.address);  

    await adamsCoin.connect(owner).addTaxFreeActor(adamsStaking.address);
    await adamsCoin.connect(owner).blacklistFromRewards(adamsStaking.address);
    console.log("added tax free actor & blacklisted from rewards ", adamsStaking.address);

    // give each staker some money
    for(let i=0; i<stakers.length; i++) {
        console.log(`Transferring ${amountToTransfer} to ${stakers[i].address}`);  
        await adamsCoin.connect(owner).transfer(stakers[i].address, amountToTransfer);
    }
    console.log("Transferred ADAMS to all");  

    // now stake (yes, this could be combined with the loop above, but i want to test each feature independently)
    let baseStake = hre.ethers.utils.parseEther("10000");
    let totalStaked = 0;
    for(let i=0; i<stakers.length; i++) {
        // have everyone stake a different amount
        let baseStake = hre.ethers.utils.parseEther(""+10000*(i+1));
        totalStaked += parseInt(hre.ethers.utils.formatEther(baseStake));
        // approve then stake
        await adamsCoin.connect(stakers[i]).approve(adamsStaking.address, baseStake);
        // stake in 2 chunks just to test
        await adamsStaking.connect(stakers[i]).stake(baseStake.div(2));
        await adamsStaking.connect(stakers[i]).stake(baseStake.div(2));

        console.log(`${stakers[i].address} staked ${10000*(i+1)}`);
    }   

    // query the contract and getAmountStaked for each
    for(let i=0; i<stakers.length; i++) {
        let amountStaked = await adamsStaking.connect(stakers[i]).getAmountStaked();
        amountStaked = hre.ethers.utils.formatEther(amountStaked);
        console.log(`${stakers[i].address} staked ${amountStaked} (per contract)`);
    }  

    // check totals, make them easy to read too
    console.log(`\nTOTAL STAKED (per JS) ${totalStaked}`);
    let contractStaked = await adamsStaking.connect(owner).getTotalStaked();
    contractStaked = hre.ethers.utils.formatEther(contractStaked);
    console.log(`TOTAL STAKED (per contract) ${contractStaked}`);
    console.log('Are they equal ', (contractStaked == totalStaked))

    // now backdate all deposits 1 year    
    // for(let i=0; i<stakers.length; i++) {
    //     await adamsStaking.connect(owner).backdateStartTimeOneYear(stakers[i].address);
    // }
    // console.log("Deposits backdated");
    
    // // check how much each is owed    
    let contractDebt = 0;
    for(let i=0; i<stakers.length; i++) {
        let totalDue = await adamsStaking.connect(stakers[i]).getTotalDue();
        totalDue = hre.ethers.utils.formatEther(totalDue.toString());
        contractDebt += parseInt(totalDue);
        console.log(`${stakers[i].address} is due ${totalDue}`);
    }

    let contractDuePerContract = await adamsStaking.connect(owner).getContractDebt();
    contractDuePerContract = hre.ethers.utils.formatEther(contractDuePerContract);
    console.log(`\nTOTAL DUE (per JS) ${contractDebt}`);
    console.log(`TOTAL DUE (per contract) ${contractDuePerContract}`);
    console.log('Are they equal ', (contractDebt == contractDuePerContract)) 
    
    // now check how much is staked in the contract
    contractStaked = await adamsStaking.connect(owner).getTotalStaked();
    contractStaked = hre.ethers.utils.formatEther(contractStaked);
    console.log("BEFORE WITHDRAW totalStaked ", contractStaked);

    // now withdraw all money
    for(let i=0; i<stakers.length; i++) {
        await adamsStaking.connect(stakers[i]).withdraw();
        console.log("withdraw complete for ", stakers[i].address);
    }    

    // now check how much is staked in the contract
    contractStaked = await adamsStaking.connect(owner).getTotalStaked();
    contractStaked = hre.ethers.utils.formatEther(contractStaked);
    console.log("AFTER WITHDRAW totalStaked ", contractStaked);

    // query the contract and getAmountStaked for each
    for(let i=0; i<stakers.length; i++) {
        let amountStaked = await adamsStaking.connect(stakers[i]).getAmountStaked();
        amountStaked = hre.ethers.utils.formatEther(amountStaked);
        console.log(`${stakers[i].address} staked ${amountStaked} (per contract)`);
    }  
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });



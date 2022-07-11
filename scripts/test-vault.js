const hre = require("hardhat");

const main = async () => {
    const [owner, p1] = await hre.ethers.getSigners();
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
  
    await adamsCoin.connect(owner).addTaxFreeActor(adamsVault.address);
    await adamsCoin.connect(owner).blacklistFromRewards(adamsVault.address);

    console.log("Vault Whitelisted & blaclisted from rewards");

    // transfer 1,000,000 tokens to the vault contract
    await adamsCoin.connect(owner).taxFreeTransfer(adamsVault.address, amountToTransfer);
    console.log("AdamsVault Transferred Coins");  

    // try claiming tokens
    await adamsVault.connect(p1).claimDistribution();
    console.log("AdamsVault Claimed Distribution");  

    // check p1's balance
    let balance = await adamsCoin.connect(owner).balanceOf(p1.address);
    balance = hre.ethers.utils.formatEther(balance);
    console.log(`p1 ${p1.address} has ${balance} ADAMS Coins`);   

}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });


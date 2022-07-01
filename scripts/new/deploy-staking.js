const hre = require("hardhat");

const main = async () => {
    const [owner] = await hre.ethers.getSigners();
    let amountToTransfer = hre.ethers.utils.parseEther("1000000");

    const adamsCoin = await hre.ethers.getContractAt("AdamsCoin", '0xF122D843512bf2506e52f64a4bF6af12A9677Eda');
    console.log("AdamsCoin connected to:", adamsCoin.address);

    const AdamsStaking = await hre.ethers.getContractFactory("AdamsStaking");
    const adamsStaking = await AdamsStaking.deploy(adamsCoin.address);
    await adamsStaking.deployed();
    console.log("AdamsStaking deployed to:", adamsStaking.address);  

    await adamsCoin.connect(owner).taxFreeTransfer(adamsStaking.address, amountToTransfer);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });



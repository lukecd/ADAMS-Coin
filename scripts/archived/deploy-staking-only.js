const hre = require("hardhat");

async function main() {
  const [owner] = await hre.ethers.getSigners();

  const AdamsStaking = await hre.ethers.getContractFactory("AdamsStaking");
  const adamsStaking = await AdamsStaking.deploy('0xF122D843512bf2506e52f64a4bF6af12A9677Eda');
  await adamsStaking.deployed();
  console.log("AdamsStaking deployed to:", adamsStaking.address);  

  const adamsCoin = await hre.ethers.getContractAt("AdamsCoin", '0xF122D843512bf2506e52f64a4bF6af12A9677Eda');
  console.log("AdamsCoin connected to:", adamsCoin.address);
  await adamsCoin.setStakingAddress('0xCA2Ba87BEF07c7fd027DF57B2a153676400f8409');
  console.log("set staking address");

}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });



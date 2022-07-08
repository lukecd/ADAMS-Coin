const hre = require("hardhat");

async function main() {
  const [owner] = await hre.ethers.getSigners();

  const AdamsVault = await hre.ethers.getContractFactory("AdamsVault");
  const adamsVault = await AdamsVault.deploy('0xF122D843512bf2506e52f64a4bF6af12A9677Eda');
  await adamsVault.deployed();
  console.log("AdamsVault deployed to:", adamsVault.address);  

  const adamsCoin = await hre.ethers.getContractAt("AdamsCoin", '0xF122D843512bf2506e52f64a4bF6af12A9677Eda');
  console.log("AdamsCoin connected to:", adamsCoin.address);
  await adamsCoin.setVaultAddress('0xCA2Ba87BEF07c7fd027DF57B2a153676400f8409');
  console.log("set vault address");

}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });



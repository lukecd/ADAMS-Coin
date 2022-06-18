
const hre = require("hardhat");
const dev1Wallet = '0x125480d196cb351B91C29E47Dc45e0205fE37AEE';
const dev2Wallet = '0xcb082454a4D41cc44F031600A5F3bc00Ae66Fc6f';

async function main() {
    const [owner] = await hre.ethers.getSigners();
    // approve vault contract to access msg.sender's tokens

    const adamsCoin = await hre.ethers.getContractAt("AdamsCoin", '0x87e128c6cD8Ffa3d8409187DE25CaBCaac1e2EF5');
    console.log("AdamsCoin connected to:", adamsCoin.address);

    let checkRewards = await adamsCoin.checkRewards(dev2Wallet);
    checkRewards = hre.ethers.utils.formatEther(checkRewards);
    console.log("checkRewards ", checkRewards);
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });


  /**
   * 
   * AdamsCoin deployed to: 0x87e128c6cD8Ffa3d8409187DE25CaBCaac1e2EF5
AdamsVault deployed to: 0xa20e128fFec6F8A59eF0C507901855cE9dB4279B
   */

const hre = require("hardhat");

/**
 * Queries the main contract for a list of all accounts with rewards available for claiming
 */
async function main() {
    const [owner] = await hre.ethers.getSigners();
    // approve vault contract to access msg.sender's tokens

    const adamsCoin = await hre.ethers.getContractAt("AdamsCoin", '0xb37C634bB7877Ce22c729Ff37075Eb18F42879f9');
    console.log("AdamsCoin connected to:", adamsCoin.address);

    // see how rewards got distributed
    let getAllAvailableRewards = await adamsCoin.connect(owner).getAllAvailableRewards();
    let {0: addresses1, 1: rewards1} = getAllAvailableRewards;
    console.log("addresses ", addresses1);
    console.log("rewards ", rewards1);
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });



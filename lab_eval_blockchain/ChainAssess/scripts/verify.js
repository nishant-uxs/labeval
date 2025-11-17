const { run } = require("hardhat");

async function main() {
  console.log("🔍 Starting contract verification on Etherscan...");

  // Load deployment info
  const fs = require('fs');
  let deploymentInfo;
  
  try {
    deploymentInfo = JSON.parse(fs.readFileSync('contract-addresses.json', 'utf8'));
  } catch (error) {
    console.error("❌ Could not load contract-addresses.json. Please deploy contracts first.");
    process.exit(1);
  }

  const { contracts } = deploymentInfo;

  // Verify AssignmentSubmission
  try {
    console.log("\n📚 Verifying AssignmentSubmission contract...");
    await run("verify:verify", {
      address: contracts.AssignmentSubmission.address,
      constructorArguments: [],
    });
    console.log("✅ AssignmentSubmission verified!");
    contracts.AssignmentSubmission.verified = true;
  } catch (error) {
    console.log("⚠️  AssignmentSubmission verification failed:", error.message);
  }

  // Verify TokenReward
  try {
    console.log("\n🪙 Verifying TokenReward contract...");
    await run("verify:verify", {
      address: contracts.TokenReward.address,
      constructorArguments: [],
    });
    console.log("✅ TokenReward verified!");
    contracts.TokenReward.verified = true;
  } catch (error) {
    console.log("⚠️  TokenReward verification failed:", error.message);
  }

  // Verify NFTReward
  try {
    console.log("\n🏆 Verifying NFTReward contract...");
    await run("verify:verify", {
      address: contracts.NFTReward.address,
      constructorArguments: [],
    });
    console.log("✅ NFTReward verified!");
    contracts.NFTReward.verified = true;
  } catch (error) {
    console.log("⚠️  NFTReward verification failed:", error.message);
  }

  // Update deployment info
  deploymentInfo.contracts = contracts;
  fs.writeFileSync(
    'contract-addresses.json',
    JSON.stringify(deploymentInfo, null, 2)
  );

  console.log("\n✨ Verification process completed!");
  console.log("📄 Updated contract-addresses.json with verification status");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Verification failed:", error);
    process.exit(1);
  });
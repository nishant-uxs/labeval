import hre from "hardhat";

async function main() {
  console.log("🚀 Upgrading BatchManagement and AssignmentSubmission contracts...\n");

  const [deployer] = await hre.ethers.getSigners();
  console.log("Deploying with account:", deployer.address);
  console.log("Account balance:", hre.ethers.formatEther(await hre.ethers.provider.getBalance(deployer.address)), "ETH\n");

  // Existing contract addresses (keep these)
  const ACCESS_CONTROL_ADDRESS = "0xFB7c09E0d25577401cB98C9b29B0465243A97E5F";
  const TOKEN_REWARD_ADDRESS = "0xe319Df69e389fea0F76Ae1546112c2e3e2ED2592";
  
  // Deploy new BatchManagement
  console.log("📚 Deploying updated BatchManagement contract...");
  const BatchManagement = await hre.ethers.getContractFactory("BatchManagement");
  const batchManagement = await BatchManagement.deploy(ACCESS_CONTROL_ADDRESS);
  await batchManagement.waitForDeployment();
  const batchManagementAddress = await batchManagement.getAddress();
  console.log("✅ BatchManagement deployed to:", batchManagementAddress);

  // Deploy new AssignmentSubmission
  console.log("\n📝 Deploying updated AssignmentSubmission contract...");
  const AssignmentSubmission = await hre.ethers.getContractFactory("AssignmentSubmission");
  const assignmentSubmission = await AssignmentSubmission.deploy(
    ACCESS_CONTROL_ADDRESS,
    batchManagementAddress
  );
  await assignmentSubmission.waitForDeployment();
  const assignmentSubmissionAddress = await assignmentSubmission.getAddress();
  console.log("✅ AssignmentSubmission deployed to:", assignmentSubmissionAddress);

  // Update TokenReward to use new BatchManagement
  console.log("\n🪙 Deploying updated TokenReward contract...");
  const TokenReward = await hre.ethers.getContractFactory("TokenReward");
  const tokenReward = await TokenReward.deploy(
    ACCESS_CONTROL_ADDRESS,
    batchManagementAddress,
    deployer.address
  );
  await tokenReward.waitForDeployment();
  const tokenRewardAddress = await tokenReward.getAddress();
  console.log("✅ TokenReward deployed to:", tokenRewardAddress);

  // Set TokenReward address in AssignmentSubmission
  console.log("\n🔗 Setting TokenReward address in AssignmentSubmission...");
  const tx = await assignmentSubmission.setTokenRewardContract(tokenRewardAddress);
  await tx.wait();
  console.log("✅ TokenReward address set successfully");

  console.log("\n" + "=".repeat(70));
  console.log("🎉 DEPLOYMENT COMPLETE!");
  console.log("=".repeat(70));
  console.log("\n📋 UPDATED CONTRACT ADDRESSES:");
  console.log("   AccessControl:        ", ACCESS_CONTROL_ADDRESS, "(unchanged)");
  console.log("   BatchManagement:      ", batchManagementAddress, "(NEW)");
  console.log("   AssignmentSubmission: ", assignmentSubmissionAddress, "(NEW)");
  console.log("   TokenReward:          ", tokenRewardAddress, "(NEW)");
  
  console.log("\n⚠️  IMPORTANT NEXT STEPS:");
  console.log("1. Update .env file with new contract addresses");
  console.log("2. Update client/src/lib/contracts.ts with new addresses");
  console.log("3. User needs to recreate their batch with the NEW BatchManagement contract");
  console.log("4. Teacher role is preserved (same AccessControl contract)");
  console.log("\n✨ The assignment creation bug is now FIXED! ✨\n");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });

import hre from "hardhat";

async function main() {
  console.log("🚀 Deploying ONLY AssignmentSubmission contract...\n");

  const [deployer] = await hre.ethers.getSigners();
  console.log("Deploying with account:", deployer.address);
  console.log("Account balance:", hre.ethers.formatEther(await hre.ethers.provider.getBalance(deployer.address)), "ETH\n");

  // Existing contract addresses (keep same)
  const ACCESS_CONTROL_ADDRESS = "0xFB7c09E0d25577401cB98C9b29B0465243A97E5F";
  const BATCH_MANAGEMENT_ADDRESS = "0xddD637Fd04a8b14470Bcf3b78c683c1a87C99aB8";
  const TOKEN_REWARD_ADDRESS = "0xe319Df69e389fea0F76Ae1546112c2e3e2ED2592";
  
  // Deploy new AssignmentSubmission
  console.log("📝 Deploying updated AssignmentSubmission contract (no student registration check)...");
  const AssignmentSubmission = await hre.ethers.getContractFactory("AssignmentSubmission");
  const assignmentSubmission = await AssignmentSubmission.deploy(
    ACCESS_CONTROL_ADDRESS,
    BATCH_MANAGEMENT_ADDRESS
  );
  await assignmentSubmission.waitForDeployment();
  const assignmentSubmissionAddress = await assignmentSubmission.getAddress();
  console.log("✅ AssignmentSubmission deployed to:", assignmentSubmissionAddress);

  console.log("\n" + "=".repeat(70));
  console.log("🎉 DEPLOYMENT COMPLETE!");
  console.log("=".repeat(70));
  console.log("\n📋 NEW CONTRACT ADDRESS:");
  console.log("   AssignmentSubmission: ", assignmentSubmissionAddress);
  
  console.log("\n⚠️  NEXT STEPS:");
  console.log("1. Update ASSIGNMENT_SUBMISSION_CONTRACT in .env");
  console.log("2. Update assignmentSubmission address in client/src/lib/contracts.ts");
  console.log("3. Restart workflow");
  console.log("\n✨ Students can now submit without prior registration - just need batch membership! ✨\n");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });

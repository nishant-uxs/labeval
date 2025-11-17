const hre = require("hardhat");
const fs = require("fs");

async function main() {
  console.log("🚀 Deploying EduChain Contracts to Sepolia...\n");

  const [deployer] = await hre.ethers.getSigners();
  console.log("📝 Deploying from:", deployer.address);
  
  const balance = await hre.ethers.provider.getBalance(deployer.address);
  console.log("💰 Balance:", hre.ethers.formatEther(balance), "ETH\n");

  if (balance < hre.ethers.parseEther("0.01")) {
    console.error("❌ Insufficient balance!");
    process.exit(1);
  }

  // Deploy AccessControl
  console.log("📦 Deploying AccessControl...");
  const AccessControl = await hre.ethers.getContractFactory("EduChainAccessControl");
  const accessControl = await AccessControl.deploy(deployer.address);
  await accessControl.waitForDeployment();
  const accessControlAddress = await accessControl.getAddress();
  console.log("✅ AccessControl:", accessControlAddress);

  // Use existing BatchManagement
  const batchManagementAddress = "0xd7076A4440a7f8DfD0c5c495b76BF19CEEe96a66";
  console.log("✅ BatchManagement (existing):", batchManagementAddress);

  // Deploy TokenReward
  console.log("\n📦 Deploying TokenReward...");
  const TokenReward = await hre.ethers.getContractFactory("EduChainToken");
  const tokenReward = await TokenReward.deploy(
    accessControlAddress,
    batchManagementAddress,
    deployer.address
  );
  await tokenReward.waitForDeployment();
  const tokenRewardAddress = await tokenReward.getAddress();
  console.log("✅ TokenReward:", tokenRewardAddress);

  // Deploy AssignmentSubmission
  console.log("\n📦 Deploying AssignmentSubmission...");
  const AssignmentSubmission = await hre.ethers.getContractFactory("AssignmentSubmission");
  const assignmentSubmission = await AssignmentSubmission.deploy(
    accessControlAddress,
    batchManagementAddress
  );
  await assignmentSubmission.waitForDeployment();
  const assignmentSubmissionAddress = await assignmentSubmission.getAddress();
  console.log("✅ AssignmentSubmission:", assignmentSubmissionAddress);

  // Grant roles
  console.log("\n🔐 Setting up roles...");
  
  const teacherAddress = "0xc39d22dC2d0A3Ca341CE8F69EFA563D113607688";
  const studentAddress = "0x31d05d7a6130f3e8b149008ec70090022f9c9330";
  
  console.log("👨‍🏫 Granting teacher role...");
  await (await accessControl.grantTeacherRole(teacherAddress)).wait();
  
  console.log("👨‍🎓 Granting student role...");
  await (await accessControl.grantStudentRole(studentAddress)).wait();
  
  console.log("⚙️  Granting GRADER_ROLE to AssignmentSubmission...");
  await (await tokenReward.grantGraderRole(assignmentSubmissionAddress)).wait();

  // Save addresses
  const addresses = {
    network: "sepolia",
    chainId: "11155111",
    deployer: deployer.address,
    deployedAt: new Date().toISOString(),
    contracts: {
      AccessControl: accessControlAddress,
      BatchManagement: batchManagementAddress,
      AssignmentSubmission: assignmentSubmissionAddress,
      TokenReward: tokenRewardAddress
    },
    teacher: teacherAddress,
    student: studentAddress
  };

  fs.writeFileSync('contract-addresses-deployed.json', JSON.stringify(addresses, null, 2));

  console.log("\n📋 Deployment Complete!");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log("🔐 AccessControl:        ", accessControlAddress);
  console.log("👥 BatchManagement:      ", batchManagementAddress);
  console.log("📚 AssignmentSubmission: ", assignmentSubmissionAddress);
  console.log("🪙 TokenReward:          ", tokenRewardAddress);
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  
  console.log("\n🔗 Update .env with:");
  console.log(`VITE_ACCESS_CONTROL_CONTRACT=${accessControlAddress}`);
  console.log(`VITE_BATCH_MANAGEMENT_CONTRACT=${batchManagementAddress}`);
  console.log(`VITE_ASSIGNMENT_SUBMISSION_CONTRACT=${assignmentSubmissionAddress}`);
  console.log(`VITE_TOKEN_REWARD_CONTRACT=${tokenRewardAddress}`);
  
  console.log("\n🎉 Deployment successful!");
}

main().catch((error) => {
  console.error("\n❌ Deployment failed:", error);
  process.exit(1);
});

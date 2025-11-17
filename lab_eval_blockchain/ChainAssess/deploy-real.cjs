const hre = require("hardhat");
const fs = require("fs");

async function main() {
  console.log("🚀 Deploying EduChain Contracts to Sepolia...\n");

  const [deployer] = await hre.ethers.getSigners();
  console.log("📝 Deploying with account:", deployer.address);
  
  const balance = await hre.ethers.provider.getBalance(deployer.address);
  console.log("💰 Account balance:", hre.ethers.formatEther(balance), "ETH\n");

  if (balance < hre.ethers.parseEther("0.01")) {
    console.error("❌ Insufficient balance! Need at least 0.01 ETH for deployment.");
    process.exit(1);
  }

  // Deploy AccessControl
  console.log("📦 Deploying AccessControl...");
  const AccessControl = await hre.ethers.getContractFactory("AccessControl");
  const accessControl = await AccessControl.deploy();
  await accessControl.waitForDeployment();
  const accessControlAddress = await accessControl.getAddress();
  console.log("✅ AccessControl deployed to:", accessControlAddress);

  // Deploy BatchManagement
  console.log("\n📦 Deploying BatchManagement...");
  const BatchManagement = await hre.ethers.getContractFactory("BatchManagement");
  const batchManagement = await BatchManagement.deploy(accessControlAddress);
  await batchManagement.waitForDeployment();
  const batchManagementAddress = await batchManagement.getAddress();
  console.log("✅ BatchManagement deployed to:", batchManagementAddress);

  // Deploy TokenReward
  console.log("\n📦 Deploying TokenReward...");
  const TokenReward = await hre.ethers.getContractFactory("TokenReward");
  const tokenReward = await TokenReward.deploy(
    "EduChain Token",
    "EDU",
    accessControlAddress
  );
  await tokenReward.waitForDeployment();
  const tokenRewardAddress = await tokenReward.getAddress();
  console.log("✅ TokenReward deployed to:", tokenRewardAddress);

  // Deploy AssignmentSubmission
  console.log("\n📦 Deploying AssignmentSubmission...");
  const AssignmentSubmission = await hre.ethers.getContractFactory("AssignmentSubmission");
  const assignmentSubmission = await AssignmentSubmission.deploy(
    accessControlAddress,
    batchManagementAddress,
    tokenRewardAddress
  );
  await assignmentSubmission.waitForDeployment();
  const assignmentSubmissionAddress = await assignmentSubmission.getAddress();
  console.log("✅ AssignmentSubmission deployed to:", assignmentSubmissionAddress);

  // Grant roles
  console.log("\n🔐 Setting up roles...");
  
  // Grant teacher role to deployer
  const teacherAddress = "0xc39d22dC2d0A3Ca341CE8F69EFA563D113607688";
  console.log("👨‍🏫 Granting teacher role to:", teacherAddress);
  await accessControl.grantTeacherRole(teacherAddress);
  
  // Grant student role
  const studentAddress = "0x31d05d7a6130f3e8b149008ec70090022f9c9330";
  console.log("👨‍🎓 Granting student role to:", studentAddress);
  await accessControl.grantStudentRole(studentAddress);

  // Grant GRADER_ROLE to AssignmentSubmission contract
  console.log("⚙️  Granting GRADER_ROLE to AssignmentSubmission contract...");
  await tokenReward.grantGraderRole(assignmentSubmissionAddress);

  console.log("\n✅ All roles granted!");

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
    admin: deployer.address,
    teacher: teacherAddress,
    student: studentAddress
  };

  fs.writeFileSync(
    'contract-addresses-deployed.json',
    JSON.stringify(addresses, null, 2)
  );

  console.log("\n📋 Deployment Summary:");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log("🔐 AccessControl:        ", accessControlAddress);
  console.log("👥 BatchManagement:      ", batchManagementAddress);
  console.log("📚 AssignmentSubmission: ", assignmentSubmissionAddress);
  console.log("🪙 TokenReward:          ", tokenRewardAddress);
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  
  console.log("\n🔗 Update .env with these addresses:");
  console.log(`VITE_ACCESS_CONTROL_CONTRACT=${accessControlAddress}`);
  console.log(`VITE_BATCH_MANAGEMENT_CONTRACT=${batchManagementAddress}`);
  console.log(`VITE_ASSIGNMENT_SUBMISSION_CONTRACT=${assignmentSubmissionAddress}`);
  console.log(`VITE_TOKEN_REWARD_CONTRACT=${tokenRewardAddress}`);
  
  console.log("\n🎉 Deployment completed successfully!");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("\n❌ Deployment failed:", error);
    process.exit(1);
  });

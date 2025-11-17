const hre = require("hardhat");
const fs = require("fs");

async function main() {
  console.log("🚀 Starting Manual EduChain Smart Contract Deployment...\n");

  // Get the deployer account
  const [deployer] = await hre.ethers.getSigners();
  console.log("📝 Deploying contracts with account:", deployer.address);
  
  const balance = await deployer.provider.getBalance(deployer.address);
  console.log("💰 Account balance:", hre.ethers.formatEther(balance), "ETH\n");

  try {
    // 1. Deploy Access Control Contract
    console.log("🔐 Deploying Access Control Contract...");
    const AccessControl = await hre.ethers.getContractFactory("EduChainAccessControl");
    const accessControl = await AccessControl.deploy(deployer.address);
    await accessControl.waitForDeployment();
    const accessControlAddress = await accessControl.getAddress();
    console.log("✅ Access Control deployed to:", accessControlAddress);

    // 2. Deploy Batch Management Contract
    console.log("\n👥 Deploying Batch Management Contract...");
    const BatchManagement = await hre.ethers.getContractFactory("BatchManagement");
    const batchManagement = await BatchManagement.deploy(accessControlAddress);
    await batchManagement.waitForDeployment();
    const batchManagementAddress = await batchManagement.getAddress();
    console.log("✅ Batch Management deployed to:", batchManagementAddress);

    // 3. Deploy Assignment Submission Contract
    console.log("\n📚 Deploying Assignment Submission Contract...");
    const AssignmentSubmission = await hre.ethers.getContractFactory("AssignmentSubmission");
    const assignmentSubmission = await AssignmentSubmission.deploy(accessControlAddress, batchManagementAddress);
    await assignmentSubmission.waitForDeployment();
    const assignmentSubmissionAddress = await assignmentSubmission.getAddress();
    console.log("✅ Assignment Submission deployed to:", assignmentSubmissionAddress);

    // 4. Deploy Token Reward Contract
    console.log("\n🪙 Deploying Token Reward Contract...");
    const TokenReward = await hre.ethers.getContractFactory("EduChainToken");
    const tokenReward = await TokenReward.deploy(accessControlAddress, batchManagementAddress, deployer.address);
    await tokenReward.waitForDeployment();
    const tokenRewardAddress = await tokenReward.getAddress();
    console.log("✅ Token Reward deployed to:", tokenRewardAddress);

    console.log("\n📋 Deployed Contract Addresses:");
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log("🔐 Access Control:       ", accessControlAddress);
    console.log("👥 Batch Management:     ", batchManagementAddress);
    console.log("📚 Assignment Submission:", assignmentSubmissionAddress);
    console.log("🪙 Token Reward:         ", tokenRewardAddress);
    console.log("👑 Admin:                ", deployer.address);
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");

    // Save contract addresses to file
    const contractAddresses = {
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
      admin: deployer.address
    };

    // Save to JSON file
    fs.writeFileSync(
      'contract-addresses.json',
      JSON.stringify(contractAddresses, null, 2)
    );

    console.log("\n💾 Contract addresses saved to contract-addresses.json");

    // Verify deployment
    console.log("\n🔍 Verifying deployment...");
    
    // Test AccessControl
    const isAdmin = await accessControl.isAdmin(deployer.address);
    console.log("✅ Admin verification:", isAdmin ? "PASSED" : "FAILED");
    
    // Test Token Contract
    const tokenName = await tokenReward.name();
    const tokenSymbol = await tokenReward.symbol();
    console.log("✅ Token verification:", `${tokenName} (${tokenSymbol})`);

    // Register some test teachers
    console.log("\n👨‍🏫 Registering test teachers...");
    const testTeachers = [
      "0xc39d22dc2d0a3ca341ce8f69efa563d113607688",
      "0x742f5cB0d8D69b2B7A6B1234567890123456789a"
    ];

    for (const teacher of testTeachers) {
      try {
        const tx = await accessControl.registerTeacher(teacher);
        await tx.wait();
        console.log(`✅ Registered teacher: ${teacher}`);
      } catch (error) {
        console.log(`ℹ️  Teacher ${teacher} may already be registered`);
      }
    }

    console.log("\n🎉 EduChain deployment completed successfully!");
    console.log("\n🔧 Environment variables to add:");
    console.log(`VITE_ACCESS_CONTROL_CONTRACT=${accessControlAddress}`);
    console.log(`VITE_BATCH_MANAGEMENT_CONTRACT=${batchManagementAddress}`);
    console.log(`VITE_ASSIGNMENT_SUBMISSION_CONTRACT=${assignmentSubmissionAddress}`);
    console.log(`VITE_TOKEN_REWARD_CONTRACT=${tokenRewardAddress}`);

  } catch (error) {
    console.error("❌ Deployment failed:", error);
    process.exit(1);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Deployment script failed:", error);
    process.exit(1);
  });
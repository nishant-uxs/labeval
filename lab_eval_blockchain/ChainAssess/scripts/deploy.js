import { ethers } from "hardhat";
import fs from "fs";

async function main() {
  console.log("🚀 Starting EduChain Smart Contract Deployment...\n");

  // Get the deployer account
  const [deployer] = await ethers.getSigners();
  console.log("📝 Deploying contracts with account:", deployer.address);
  console.log("💰 Account balance:", ethers.formatEther(await deployer.provider.getBalance(deployer.address)), "ETH\n");

  try {
    // Deploy EduChain Deployer Factory
    console.log("🏗️  Deploying EduChain Deployer Factory...");
    const EduChainDeployer = await ethers.getContractFactory("EduChainDeployer");
    const deployerContract = await EduChainDeployer.deploy();
    await deployerContract.waitForDeployment();
    
    const deployerAddress = await deployerContract.getAddress();
    console.log("✅ EduChain Deployer deployed to:", deployerAddress);

    // Deploy all EduChain contracts through the factory
    console.log("\n🔗 Deploying EduChain ecosystem contracts...");
    const deployTx = await deployerContract.deployEduChain(deployer.address);
    const receipt = await deployTx.wait();
    
    console.log("✅ All contracts deployed successfully!");
    console.log("📊 Gas used:", receipt.gasUsed.toString());

    // Get deployed contract addresses
    const contracts = await deployerContract.getDeployedContracts();
    
    console.log("\n📋 Deployed Contract Addresses:");
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log("🔐 Access Control:       ", contracts.accessControl);
    console.log("📚 Assignment Submission:", contracts.assignmentSubmission);
    console.log("🪙 Token Reward:         ", contracts.tokenReward);
    console.log("👥 Batch Management:     ", contracts.batchManagement);
    console.log("🏭 Factory Deployer:     ", deployerAddress);
    console.log("👑 Admin:                ", contracts.admin);
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");

    // Save contract addresses to file
    const contractAddresses = {
      network: await deployer.provider.getNetwork().then(n => n.name),
      chainId: await deployer.provider.getNetwork().then(n => n.chainId.toString()),
      deployer: deployer.address,
      deployedAt: new Date().toISOString(),
      contracts: {
        EduChainDeployer: deployerAddress,
        AccessControl: contracts.accessControl,
        AssignmentSubmission: contracts.assignmentSubmission,
        TokenReward: contracts.tokenReward,
        BatchManagement: contracts.batchManagement
      },
      admin: contracts.admin
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
    const AccessControl = await ethers.getContractFactory("EduChainAccessControl");
    const accessControl = AccessControl.attach(contracts.accessControl);
    
    const isAdmin = await accessControl.isAdmin(deployer.address);
    console.log("✅ Admin verification:", isAdmin ? "PASSED" : "FAILED");
    
    // Test Token Contract
    const TokenReward = await ethers.getContractFactory("EduChainToken");
    const tokenReward = TokenReward.attach(contracts.tokenReward);
    
    const tokenName = await tokenReward.name();
    const tokenSymbol = await tokenReward.symbol();
    console.log("✅ Token verification:", `${tokenName} (${tokenSymbol})`);

    console.log("\n🎉 EduChain deployment completed successfully!");
    console.log("\n📝 Next Steps:");
    console.log("1. Update your frontend with the new contract addresses");
    console.log("2. Register teachers using the Access Control contract");
    console.log("3. Students can register themselves or be registered by teachers");
    console.log("4. Start creating assignments and awarding tokens!");

    // Display environment setup
    console.log("\n🔧 Environment Setup for Frontend:");
    console.log("Add these to your .env file:");
    console.log(`VITE_ACCESS_CONTROL_CONTRACT=${contracts.accessControl}`);
    console.log(`VITE_ASSIGNMENT_SUBMISSION_CONTRACT=${contracts.assignmentSubmission}`);
    console.log(`VITE_TOKEN_REWARD_CONTRACT=${contracts.tokenReward}`);
    console.log(`VITE_BATCH_MANAGEMENT_CONTRACT=${contracts.batchManagement}`);
    console.log(`VITE_DEPLOYER_CONTRACT=${deployerAddress}`);

  } catch (error) {
    console.error("❌ Deployment failed:", error);
    process.exit(1);
  }
}

// Handle deployment errors
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Deployment script failed:", error);
    process.exit(1);
  });
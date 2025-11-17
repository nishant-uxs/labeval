const { ethers } = require("hardhat");
const fs = require('fs');

async function main() {
  console.log("🚀 Starting deployment to Sepolia testnet...");

  // Get the deployer account
  const [deployer] = await ethers.getSigners();
  console.log("📝 Deploying contracts with account:", deployer.address);

  // Check balance
  const balance = await deployer.provider.getBalance(deployer.address);
  console.log("💰 Account balance:", ethers.formatEther(balance), "ETH");

  if (balance < ethers.parseEther("0.01")) {
    console.warn("⚠️  Low balance! You might need more ETH for deployment");
  }

  // Deploy AssignmentSubmission contract
  console.log("\n📚 Deploying AssignmentSubmission contract...");
  const AssignmentSubmission = await ethers.getContractFactory("AssignmentSubmission");
  const assignmentSubmission = await AssignmentSubmission.deploy();
  await assignmentSubmission.waitForDeployment();
  const assignmentSubmissionAddress = await assignmentSubmission.getAddress();
  console.log("✅ AssignmentSubmission deployed to:", assignmentSubmissionAddress);

  // Deploy TokenReward contract
  console.log("\n🪙 Deploying TokenReward contract...");
  const TokenReward = await ethers.getContractFactory("TokenReward");
  const tokenReward = await TokenReward.deploy();
  await tokenReward.waitForDeployment();
  const tokenRewardAddress = await tokenReward.getAddress();
  console.log("✅ TokenReward deployed to:", tokenRewardAddress);

  // Deploy NFTReward contract
  console.log("\n🏆 Deploying NFTReward contract...");
  const NFTReward = await ethers.getContractFactory("NFTReward");
  const nftReward = await NFTReward.deploy();
  await nftReward.waitForDeployment();
  const nftRewardAddress = await nftReward.getAddress();
  console.log("✅ NFTReward deployed to:", nftRewardAddress);

  // Grant roles between contracts
  console.log("\n🔐 Setting up contract permissions...");
  
  // Grant TEACHER_ROLE to token and NFT contracts for automatic rewards
  const TEACHER_ROLE = ethers.keccak256(ethers.toUtf8Bytes("TEACHER_ROLE"));
  
  await assignmentSubmission.grantRole(TEACHER_ROLE, tokenRewardAddress);
  console.log("✅ Granted TEACHER_ROLE to TokenReward contract");
  
  await assignmentSubmission.grantRole(TEACHER_ROLE, nftRewardAddress);
  console.log("✅ Granted TEACHER_ROLE to NFTReward contract");

  // Save deployment info
  const deploymentInfo = {
    network: "sepolia",
    deployer: deployer.address,
    timestamp: new Date().toISOString(),
    contracts: {
      AssignmentSubmission: {
        address: assignmentSubmissionAddress,
        verified: false
      },
      TokenReward: {
        address: tokenRewardAddress,
        verified: false
      },
      NFTReward: {
        address: nftRewardAddress,
        verified: false
      }
    }
  };

  console.log("\n📋 Deployment Summary:");
  console.log("==========================================");
  console.log("Network:", deploymentInfo.network);
  console.log("Deployer:", deploymentInfo.deployer);
  console.log("Timestamp:", deploymentInfo.timestamp);
  console.log("\n📍 Contract Addresses:");
  console.log("AssignmentSubmission:", assignmentSubmissionAddress);
  console.log("TokenReward:", tokenRewardAddress);
  console.log("NFTReward:", nftRewardAddress);

  console.log("\n🔗 Etherscan URLs:");
  console.log(`AssignmentSubmission: https://sepolia.etherscan.io/address/${assignmentSubmissionAddress}`);
  console.log(`TokenReward: https://sepolia.etherscan.io/address/${tokenRewardAddress}`);
  console.log(`NFTReward: https://sepolia.etherscan.io/address/${nftRewardAddress}`);

  console.log("\n✨ Deployment completed successfully!");
  console.log("💡 Don't forget to:");
  console.log("   1. Update your frontend with these contract addresses");
  console.log("   2. Verify contracts on Etherscan");
  console.log("   3. Set up proper role permissions for teachers");

  // Save to file for frontend integration
  fs.writeFileSync(
    'contract-addresses.json',
    JSON.stringify(deploymentInfo, null, 2)
  );
  console.log("\n📄 Contract addresses saved to contract-addresses.json");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Deployment failed:", error);
    process.exit(1);
  });
import { ethers } from 'ethers';
import fs from 'fs';

const ALCHEMY_API_KEY = process.env.ALCHEMY_API_KEY;
const PRIVATE_KEY = process.env.PRIVATE_KEY;

if (!ALCHEMY_API_KEY || !PRIVATE_KEY) {
  console.error('❌ Missing ALCHEMY_API_KEY or PRIVATE_KEY');
  process.exit(1);
}

const provider = new ethers.JsonRpcProvider(`https://eth-sepolia.g.alchemy.com/v2/${ALCHEMY_API_KEY}`);
const wallet = new ethers.Wallet(PRIVATE_KEY, provider);

// Read compiled contract artifacts
const accessControlArtifact = JSON.parse(fs.readFileSync('./contracts/compiled/AccessControl.json', 'utf8'));
const batchManagementArtifact = JSON.parse(fs.readFileSync('./contracts/compiled/BatchManagement.json', 'utf8'));
const assignmentSubmissionArtifact = JSON.parse(fs.readFileSync('./contracts/compiled/AssignmentSubmission.json', 'utf8'));
const tokenRewardArtifact = JSON.parse(fs.readFileSync('./contracts/compiled/TokenReward.json', 'utf8'));

async function deploy() {
  console.log('🚀 Deploying EduChain Contracts to Sepolia...\n');
  console.log('📝 Deploying from:', wallet.address);
  
  const balance = await provider.getBalance(wallet.address);
  console.log('💰 Balance:', ethers.formatEther(balance), 'ETH\n');

  if (balance < ethers.parseEther('0.01')) {
    console.error('❌ Insufficient balance! Need at least 0.01 ETH');
    process.exit(1);
  }

  // Deploy AccessControl
  console.log('📦 Deploying AccessControl...');
  const AccessControl = new ethers.ContractFactory(
    accessControlArtifact.abi,
    accessControlArtifact.bytecode,
    wallet
  );
  const accessControl = await AccessControl.deploy();
  await accessControl.waitForDeployment();
  const accessControlAddress = await accessControl.getAddress();
  console.log('✅ AccessControl:', accessControlAddress);

  // Deploy BatchManagement
  console.log('\n📦 Deploying BatchManagement...');
  const BatchManagement = new ethers.ContractFactory(
    batchManagementArtifact.abi,
    batchManagementArtifact.bytecode,
    wallet
  );
  const batchManagement = await BatchManagement.deploy(accessControlAddress);
  await batchManagement.waitForDeployment();
  const batchManagementAddress = await batchManagement.getAddress();
  console.log('✅ BatchManagement:', batchManagementAddress);

  // Deploy TokenReward
  console.log('\n📦 Deploying TokenReward...');
  const TokenReward = new ethers.ContractFactory(
    tokenRewardArtifact.abi,
    tokenRewardArtifact.bytecode,
    wallet
  );
  const tokenReward = await TokenReward.deploy(
    'EduChain Token',
    'EDU',
    accessControlAddress
  );
  await tokenReward.waitForDeployment();
  const tokenRewardAddress = await tokenReward.getAddress();
  console.log('✅ TokenReward:', tokenRewardAddress);

  // Deploy AssignmentSubmission
  console.log('\n📦 Deploying AssignmentSubmission...');
  const AssignmentSubmission = new ethers.ContractFactory(
    assignmentSubmissionArtifact.abi,
    assignmentSubmissionArtifact.bytecode,
    wallet
  );
  const assignmentSubmission = await AssignmentSubmission.deploy(
    accessControlAddress,
    batchManagementAddress,
    tokenRewardAddress
  );
  await assignmentSubmission.waitForDeployment();
  const assignmentSubmissionAddress = await assignmentSubmission.getAddress();
  console.log('✅ AssignmentSubmission:', assignmentSubmissionAddress);

  // Grant roles
  console.log('\n🔐 Setting up roles...');
  const teacherAddress = '0xc39d22dC2d0A3Ca341CE8F69EFA563D113607688';
  const studentAddress = '0x31d05d7a6130f3e8b149008ec70090022f9c9330';
  
  console.log('👨‍🏫 Granting teacher role...');
  await (await accessControl.grantTeacherRole(teacherAddress)).wait();
  
  console.log('👨‍🎓 Granting student role...');
  await (await accessControl.grantStudentRole(studentAddress)).wait();
  
  console.log('⚙️  Granting GRADER_ROLE to AssignmentSubmission...');
  await (await tokenReward.grantGraderRole(assignmentSubmissionAddress)).wait();

  // Save addresses
  const addresses = {
    network: 'sepolia',
    chainId: '11155111',
    deployer: wallet.address,
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

  console.log('\n📋 Deployment Complete!');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('🔐 AccessControl:        ', accessControlAddress);
  console.log('👥 BatchManagement:      ', batchManagementAddress);
  console.log('📚 AssignmentSubmission: ', assignmentSubmissionAddress);
  console.log('🪙 TokenReward:          ', tokenRewardAddress);
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
}

deploy().catch((error) => {
  console.error('\n❌ Deployment failed:', error);
  process.exit(1);
});

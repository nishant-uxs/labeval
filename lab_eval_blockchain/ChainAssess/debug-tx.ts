import { ethers } from 'ethers';

const ALCHEMY_API_KEY = process.env.ALCHEMY_API_KEY;
const provider = new ethers.JsonRpcProvider(`https://eth-sepolia.g.alchemy.com/v2/${ALCHEMY_API_KEY}`);

const TX_HASH = '0x821b5cea62dbb77b0ce2d230f0e61531bcfa22b6fa4063bda6dc8fb4f9b8c5cb';
const CONTRACT_ADDRESS = '0x2279B7A0a67DB372996a5FaB50D91eAA73d2eBe6';

const ASSIGNMENT_SUBMISSION_ABI = [
  "event AssignmentCreated(uint256 indexed assignmentId, address indexed teacher, string title, uint256 deadline, uint256 tokenReward)",
];

async function debugTransaction() {
  console.log('🔍 Fetching transaction receipt...');
  const receipt = await provider.getTransactionReceipt(TX_HASH);
  
  if (!receipt) {
    console.log('❌ Transaction not found!');
    return;
  }

  console.log('\n📋 Transaction Receipt:');
  console.log('Status:', receipt.status === 1 ? '✅ Success' : '❌ Failed');
  console.log('Block:', receipt.blockNumber);
  console.log('Gas Used:', receipt.gasUsed.toString());
  console.log('Logs Count:', receipt.logs.length);
  
  console.log('\n📝 All Logs:');
  receipt.logs.forEach((log, index) => {
    console.log(`\nLog ${index}:`);
    console.log('  Address:', log.address);
    console.log('  Topics:', log.topics);
    console.log('  Data:', log.data);
  });

  const iface = new ethers.Interface(ASSIGNMENT_SUBMISSION_ABI);
  
  console.log('\n🎯 Parsing Events:');
  let found = false;
  for (const log of receipt.logs) {
    try {
      if (log.address.toLowerCase() === CONTRACT_ADDRESS.toLowerCase()) {
        const parsed = iface.parseLog(log);
        if (parsed) {
          console.log('\n✅ Found AssignmentCreated Event!');
          console.log('  Assignment ID:', parsed.args.assignmentId.toString());
          console.log('  Teacher:', parsed.args.teacher);
          console.log('  Title:', parsed.args.title);
          console.log('  Deadline:', new Date(Number(parsed.args.deadline) * 1000).toISOString());
          console.log('  Token Reward:', parsed.args.tokenReward.toString());
          found = true;
        }
      }
    } catch (error) {
      // Not this event
    }
  }
  
  if (!found) {
    console.log('\n❌ No AssignmentCreated event found!');
    console.log('\n🔍 Checking if contract address matches:');
    receipt.logs.forEach((log, index) => {
      console.log(`Log ${index} from:`, log.address, '(Expected:', CONTRACT_ADDRESS, ')');
    });
  }
}

debugTransaction().catch(console.error);

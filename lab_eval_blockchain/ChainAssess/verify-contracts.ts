import { ethers } from 'ethers';

const ALCHEMY_API_KEY = process.env.ALCHEMY_API_KEY;
const provider = new ethers.JsonRpcProvider(`https://eth-sepolia.g.alchemy.com/v2/${ALCHEMY_API_KEY}`);

const addresses = {
  AssignmentSubmission: '0x2279B7A0a67DB372996a5FaB50D91eAA73d2eBe6',
  BatchManagement: '0x7b79995e5f793A07Bc00c21412e50Ecae098E7f9',
  AccessControl: '0x6fC21092DA55B392b045eD78F4732bff3C580e2c',
  TokenReward: '0xBf447be6a0E79c061dbF9f6169d372a85a1Db16E'
};

async function verifyContracts() {
  console.log('🔍 Verifying Contract Addresses on Sepolia...\n');
  
  for (const [name, address] of Object.entries(addresses)) {
    const code = await provider.getCode(address);
    const hasCode = code !== '0x';
    
    console.log(`${hasCode ? '✅' : '❌'} ${name}:`);
    console.log(`   Address: ${address}`);
    console.log(`   Has Code: ${hasCode ? 'YES (Smart Contract)' : 'NO (EOA or not deployed)'}`);
    if (hasCode) {
      console.log(`   Bytecode Length: ${code.length - 2} bytes`);
    }
    console.log();
  }
}

verifyContracts().catch(console.error);

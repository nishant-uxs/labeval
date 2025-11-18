import { ethers } from 'ethers';
import { ContractAddresses } from '@/types/web3';

// Contract addresses for Sepolia testnet (using proper checksummed addresses)
export const CONTRACT_ADDRESSES: ContractAddresses = {
  assignmentSubmission: import.meta.env.VITE_ASSIGNMENT_SUBMISSION_CONTRACT || '0xf39A62a69222ad7F51217AFedd46178e7926039d',
  tokenReward: import.meta.env.VITE_TOKEN_REWARD_CONTRACT || '0xe319Df69e389fea0F76Ae1546112c2e3e2ED2592',
  nftReward: import.meta.env.VITE_NFT_REWARD_CONTRACT || '0x0000000000000000000000000000000000000000',
  deadlineManager: import.meta.env.VITE_DEADLINE_MANAGER_CONTRACT || '0x0000000000000000000000000000000000000000',
  accessControl: import.meta.env.VITE_ACCESS_CONTROL_CONTRACT || '0xFB7c09E0d25577401cB98C9b29B0465243A97E5F',
  batchManagement: import.meta.env.VITE_BATCH_MANAGEMENT_CONTRACT || '0xddD637Fd04a8b14470Bcf3b78c683c1a87C99aB8'
};

// Sepolia testnet chain ID
export const SEPOLIA_CHAIN_ID = '0xaa36a7';
export const SEPOLIA_RPC_URL = 'https://sepolia.infura.io/v3/' + (import.meta.env.VITE_INFURA_API_KEY || 'demo-key');

export interface GasEstimate {
  gasLimit: string;
  gasPrice: string;
  totalCost: string;
}

export class Web3Service {
  private provider: ethers.BrowserProvider | null = null;
  private signer: ethers.JsonRpcSigner | null = null;

  async initializeProvider() {
    if (typeof window !== 'undefined' && (window as any).ethereum) {
      this.provider = new ethers.BrowserProvider((window as any).ethereum);
      return this.provider;
    }
    throw new Error('MetaMask is not installed');
  }

  async getSigner() {
    if (!this.provider) {
      await this.initializeProvider();
    }
    this.signer = await this.provider!.getSigner();
    return this.signer;
  }

  async getBalance(address: string): Promise<string> {
    if (!this.provider) {
      await this.initializeProvider();
    }
    const balance = await this.provider!.getBalance(address);
    return ethers.formatEther(balance);
  }

  async switchToSepolia(): Promise<boolean> {
    try {
      await (window as any).ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: SEPOLIA_CHAIN_ID }],
      });
      return true;
    } catch (error: any) {
      if (error.code === 4902) {
        // Chain not added, add it
        await (window as any).ethereum.request({
          method: 'wallet_addEthereumChain',
          params: [{
            chainId: SEPOLIA_CHAIN_ID,
            chainName: 'Sepolia Testnet',
            nativeCurrency: {
              name: 'ETH',
              symbol: 'ETH',
              decimals: 18
            },
            rpcUrls: [SEPOLIA_RPC_URL],
            blockExplorerUrls: ['https://sepolia.etherscan.io/']
          }]
        });
        return true;
      }
      throw error;
    }
  }

  async estimateGas(
    contractAddress: string,
    abi: any[],
    methodName: string,
    params: any[]
  ): Promise<GasEstimate> {
    const signer = await this.getSigner();
    const contract = new ethers.Contract(contractAddress, abi, signer);
    
    const gasLimit = await contract[methodName].estimateGas(...params);
    const feeData = await this.provider!.getFeeData();
    const gasPrice = feeData.gasPrice || ethers.parseUnits('20', 'gwei');
    
    const totalCost = gasLimit * gasPrice;
    
    return {
      gasLimit: gasLimit.toString(),
      gasPrice: ethers.formatUnits(gasPrice, 'gwei'),
      totalCost: ethers.formatEther(totalCost)
    };
  }

  isValidAddress(address: string): boolean {
    return ethers.isAddress(address);
  }

  async getCurrentNetwork(): Promise<number> {
    if (!this.provider) {
      await this.initializeProvider();
    }
    const network = await this.provider!.getNetwork();
    return Number(network.chainId);
  }
}

export const web3Service = new Web3Service();

// DEPRECATED: Database storage replaced with blockchain smart contracts
// This file is kept for reference but is no longer used in the application
// All data operations now happen through blockchain-service.ts

export interface IStorage {
  // Interface kept for compatibility
}

export class BlockchainOnlyStorage implements IStorage {
  // Placeholder class - all operations moved to blockchain-service.ts
  constructor() {
    console.log('⚠️  BlockchainOnlyStorage: All operations moved to blockchain smart contracts');
  }
}

// Deprecated storage instance - no longer used
export const storage = new BlockchainOnlyStorage();
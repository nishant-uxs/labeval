import { useState, useEffect, useCallback } from 'react';
import { useSDK } from '@metamask/sdk-react';
import { WalletState, UserRole, TransactionStatus } from '@/types/web3';
import { web3Service } from '@/lib/web3';
import { contractService } from '@/lib/contracts';
import { roleVerificationService } from '@/lib/role-verification';
import { getOverrideRole } from '@/lib/role-override';
import { blockchainService } from '@/lib/blockchain-service';

export function useWeb3() {
  const { sdk, connected, connecting, provider, chainId, account } = useSDK();
  const [walletState, setWalletState] = useState<WalletState>({
    isConnected: false,
    account: null,
    chainId: null,
    balance: null,
    provider: null
  });
  const [userRole, setUserRole] = useState<UserRole>('student');
  const [transactionStatus, setTransactionStatus] = useState<TransactionStatus>({
    hash: null,
    status: 'idle',
    error: null
  });

  // Update wallet state when SDK state changes
  useEffect(() => {
    setWalletState({
      isConnected: connected,
      account: account || null,
      chainId: chainId || null,
      balance: null,
      provider: provider
    });
  }, [connected, account, chainId, provider]);

  // Fetch balance when account changes
  useEffect(() => {
    const fetchBalance = async () => {
      if (account && connected) {
        try {
          const balance = await web3Service.getBalance(account);
          setWalletState(prev => ({ ...prev, balance }));
        } catch (error) {
          console.error('Failed to fetch balance:', error);
        }
      }
    };

    fetchBalance();
  }, [account, connected]);

  // Initialize blockchain service and fetch user role when account changes
  useEffect(() => {
    const initializeAndFetchRole = async () => {
      if (account && connected) {
        try {
          // Initialize blockchain service for MetaMask transactions
          console.log('🔗 Initializing blockchain service...');
          await blockchainService.initialize();
          console.log('✅ Blockchain service initialized');
          
          console.log(`🔍 Checking role for account: ${account}`);
          
          // First check for override role (immediate fix for testing)
          const overrideRole = getOverrideRole(account);
          if (overrideRole) {
            console.log(`🔥 Using override role: ${overrideRole}`);
            setUserRole(overrideRole as UserRole);
            return;
          }
          
          // Try blockchain verification
          await roleVerificationService.initialize();
          const role = await roleVerificationService.getUserRole(account);
          console.log(`✅ Role determined: ${role}`);
          setUserRole(role as UserRole);
        } catch (error) {
          console.error('Failed to initialize or fetch user role:', error);
          // Even if blockchain fails, check override
          const overrideRole = getOverrideRole(account);
          if (overrideRole) {
            console.log(`🔥 Fallback to override role: ${overrideRole}`);
            setUserRole(overrideRole as UserRole);
          } else {
            setUserRole('student');
          }
        }
      } else {
        setUserRole('student');
      }
    };

    initializeAndFetchRole();
  }, [account, connected]);

  const connect = useCallback(async () => {
    if (connecting) {
      console.log('⏳ Connection already in progress, skipping...');
      return;
    }
    
    try {
      console.log('🔗 Attempting wallet connection...');
      const accounts = await sdk?.connect();
      if (accounts && accounts.length > 0) {
        console.log('✅ Wallet connected successfully');
        // Switch to Sepolia if not already on it
        const networkId = await web3Service.getCurrentNetwork();
        if (networkId !== 11155111) { // Sepolia chain ID
          await web3Service.switchToSepolia();
        }
      }
    } catch (error) {
      console.error('Failed to connect wallet:', error);
      // Don't throw immediately if it's a pending request error
      if (error instanceof Error && error.message.includes('already pending')) {
        console.log('⚠️ Connection request already pending, please wait...');
        return;
      }
      throw error;
    }
  }, [sdk, connecting]);

  const disconnect = useCallback(() => {
    try {
      console.log('🔌 Disconnecting wallet...');
      sdk?.terminate?.() || sdk?.disconnect();
      setWalletState({
        isConnected: false,
        account: null,
        chainId: null,
        balance: null,
        provider: null
      });
      setUserRole('student');
    } catch (error) {
      console.error('Disconnect error:', error);
    }
  }, [sdk]);

  const executeTransaction = useCallback(async (
    transactionFn: () => Promise<string>,
    description: string
  ) => {
    setTransactionStatus({
      hash: null,
      status: 'pending',
      error: null
    });

    try {
      const hash = await transactionFn();
      setTransactionStatus({
        hash,
        status: 'success',
        error: null
      });
      return hash;
    } catch (error) {
      console.error(`Transaction failed: ${description}`, error);
      setTransactionStatus({
        hash: null,
        status: 'error',
        error: error instanceof Error ? error.message : 'Transaction failed'
      });
      throw error;
    }
  }, []);

  const resetTransactionStatus = useCallback(() => {
    setTransactionStatus({
      hash: null,
      status: 'idle',
      error: null
    });
  }, []);

  const switchRole = useCallback((role: UserRole) => {
    setUserRole(role);
  }, []);

  const isCorrectNetwork = chainId === '0xaa36a7'; // Sepolia

  return {
    walletState,
    userRole,
    transactionStatus,
    isConnecting: connecting,
    isCorrectNetwork,
    connect,
    disconnect,
    executeTransaction,
    resetTransactionStatus,
    switchRole
  };
}

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { useSDK } from '@metamask/sdk-react';
import { BrowserProvider, Contract } from 'ethers';
import { CONTRACT_ADDRESSES } from '@/lib/contracts';
import { useToast } from '@/hooks/use-toast';

const ACCESS_CONTROL_ABI = [
  "function registerTeacher(address teacher) external",
  "function hasRole(bytes32 role, address account) external view returns (bool)",
  "function TEACHER_ROLE() external view returns (bytes32)"
];

export function RegisterTeacherButton({ walletAddress }: { walletAddress: string }) {
  const [isRegistering, setIsRegistering] = useState(false);
  const { provider } = useSDK();
  const { toast } = useToast();

  const handleRegisterTeacher = async () => {
    if (!provider || !walletAddress) {
      toast({ variant: "destructive", title: "Error", description: "Please connect wallet first" });
      return;
    }

    try {
      setIsRegistering(true);
      toast({ title: "Registering", description: "Registering as teacher..." });

      const ethersProvider = new BrowserProvider(provider);
      const signer = await ethersProvider.getSigner();
      
      const accessControl = new Contract(
        CONTRACT_ADDRESSES.accessControl,
        ACCESS_CONTROL_ABI,
        signer
      );

      const tx = await accessControl.registerTeacher(walletAddress);
      toast({ title: "Transaction Submitted", description: "Waiting for confirmation..." });
      
      await tx.wait();
      
      toast({ title: "Success!", description: "Successfully registered as teacher! Refreshing page..." });
      
      setTimeout(() => window.location.reload(), 2000);
    } catch (error: any) {
      console.error('Failed to register teacher:', error);
      
      if (error.message?.includes('already has teacher role')) {
        toast({ variant: "destructive", title: "Error", description: "Already registered as teacher" });
      } else if (error.message?.includes('user rejected')) {
        toast({ variant: "destructive", title: "Cancelled", description: "Transaction rejected" });
      } else {
        toast({ variant: "destructive", title: "Error", description: "Failed to register as teacher" });
      }
    } finally {
      setIsRegistering(false);
    }
  };

  return (
    <Button
      onClick={handleRegisterTeacher}
      disabled={isRegistering}
      className="bg-green-600 hover:bg-green-700"
    >
      <i className="fas fa-user-plus mr-2"></i>
      {isRegistering ? 'Registering...' : 'Register as Teacher'}
    </Button>
  );
}

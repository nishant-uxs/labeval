import { BatchManagement } from '@/components/teacher/BatchManagement';
import { RoleVerificationBanner } from '@/components/ui/role-verification-banner';
import { useWeb3 } from '@/hooks/useWeb3';
import { Button } from '@/components/ui/button';
import { LogOut } from 'lucide-react';

export default function BatchManagementPage() {
  const { walletState, disconnect } = useWeb3();

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header with Disconnect Button */}
        <div className="flex justify-between items-center mb-4">
          <h1 className="text-3xl font-bold text-gray-900">Batch Management</h1>
          {walletState.isConnected && (
            <Button
              onClick={disconnect}
              variant="outline"
              className="flex items-center gap-2"
            >
              <LogOut className="h-4 w-4" />
              Disconnect Wallet
            </Button>
          )}
        </div>

        {/* Role Verification Banner */}
        <RoleVerificationBanner 
          currentRole="teacher" 
          walletAddress={walletState.account} 
        />
        
        {/* Batch Management Component */}
        <BatchManagement />
      </div>
    </div>
  );
}
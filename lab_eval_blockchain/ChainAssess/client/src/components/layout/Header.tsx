import { Button } from '@/components/ui/button';
import { UserRole } from '@/types/web3';
import { RegisterTeacherButton } from '@/components/RegisterTeacherButton';

interface HeaderProps {
  currentRole: UserRole;
  walletAddress: string | null;
  ethBalance: string | null;
  onDisconnect: () => void;
  onConnect: () => void;
}

const roleInfo = {
  student: {
    title: 'Student Dashboard',
    description: 'Track your assignments and rewards'
  },
  teacher: {
    title: 'Teacher Dashboard',
    description: 'Review submissions and issue rewards'
  },
  admin: {
    title: 'Admin Dashboard',
    description: 'Manage contracts and assign teachers'
  },
  none: {
    title: 'Welcome to EduChain',
    description: 'Please register or contact admin for role assignment'
  }
};

export function Header({ currentRole, walletAddress, ethBalance, onDisconnect, onConnect }: HeaderProps) {
  const { title, description } = roleInfo[currentRole] || roleInfo.none;

  return (
    <header className="bg-white border-b border-gray-200 px-6 py-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900" data-testid="page-title">
            {title}
          </h2>
          <p className="text-gray-600 mt-1" data-testid="page-description">
            {description}
          </p>
        </div>
        
        {/* Wallet Actions */}
        <div className="flex items-center space-x-4">
          {/* Show Register Button for admins to register as teacher */}
          {walletAddress && currentRole === 'admin' && (
            <RegisterTeacherButton walletAddress={walletAddress} />
          )}
          
          {/* Balance Display */}
          <div className="text-right">
            <p className="text-sm text-gray-600">ETH Balance</p>
            <p className="font-mono font-semibold" data-testid="eth-balance">
              {ethBalance ? `${parseFloat(ethBalance).toFixed(4)} ETH` : '0.0000 ETH'}
            </p>
          </div>
          
          {/* Connect/Disconnect Button */}
          {walletAddress ? (
            <Button
              onClick={onDisconnect}
              variant="destructive"
              className="px-4 py-2"
              data-testid="button-disconnect"
            >
              <i className="fas fa-sign-out-alt mr-2"></i>
              Disconnect
            </Button>
          ) : (
            <Button
              onClick={onConnect}
              variant="default"
              className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold"
              data-testid="button-connect-wallet"
            >
              <i className="fas fa-wallet mr-2"></i>
              Connect Wallet
            </Button>
          )}
        </div>
      </div>
    </header>
  );
}

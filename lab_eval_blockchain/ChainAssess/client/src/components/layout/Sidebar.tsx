import { Link, useLocation } from 'wouter';
import { UserRole } from '@/types/web3';
import { cn } from '@/lib/utils';
import { NotificationSystem } from '@/components/NotificationSystem';

interface SidebarProps {
  currentRole: UserRole;
  onRoleChange: (role: UserRole) => void;
  walletAddress: string | null;
  isConnected: boolean;
}

const navigationItems = {
  student: [
    { path: '/dashboard', icon: 'fas fa-tachometer-alt', label: 'Dashboard' },
    { path: '/submit-assignment', icon: 'fas fa-file-upload', label: 'Submit Assignment' },
    { path: '/my-tokens', icon: 'fas fa-coins', label: 'My Tokens & Submissions' },
  ],
  teacher: [
    { path: '/teacher-dashboard', icon: 'fas fa-chalkboard-teacher', label: 'Teacher Dashboard' },
    { path: '/batch-operations', icon: 'fas fa-users', label: 'Manage Batches' },
    { path: '/review-submissions', icon: 'fas fa-clipboard-check', label: 'Review & Grade Submissions' },
    { path: '/grading', icon: 'fas fa-star', label: 'Advanced Grading' },
  ],
  admin: [
    { path: '/admin-dashboard', icon: 'fas fa-users-cog', label: 'Admin Dashboard' },
    { path: '/teacher-dashboard', icon: 'fas fa-chalkboard-teacher', label: 'Teacher Functions' },
    { path: '/manage-contracts', icon: 'fas fa-cogs', label: 'Manage Contracts' },
    { path: '/assign-teachers', icon: 'fas fa-user-plus', label: 'Assign Teachers' },
  ],
  none: [
    { path: '/', icon: 'fas fa-home', label: 'Home' },
  ],
};

export function Sidebar({ currentRole, onRoleChange, walletAddress, isConnected }: SidebarProps) {
  const [location] = useLocation();

  const formatAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  return (
    <div className="w-64 bg-white shadow-lg border-r border-gray-200 flex flex-col">
      {/* Logo Section */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
            <i className="fas fa-graduation-cap text-white text-lg"></i>
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900">EduChain</h1>
            <p className="text-sm text-gray-500">dApp Assessment</p>
          </div>
        </div>
      </div>

      {/* Wallet Connection Status */}
      <div className="p-4 border-b border-gray-200">
        {isConnected ? (
          <div className="bg-green-50 border border-green-200 rounded-lg p-3">
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span className="text-sm font-medium text-green-800">Connected</span>
            </div>
            <p className="text-xs text-green-600 mt-1 font-mono">
              {walletAddress ? formatAddress(walletAddress) : ''}
            </p>
            <div className="flex items-center space-x-2 mt-2">
              <i className="fab fa-ethereum text-primary w-4"></i>
              <span className="text-xs text-gray-600">Sepolia Testnet</span>
            </div>
          </div>
        ) : (
          <div className="bg-red-50 border border-red-200 rounded-lg p-3">
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-red-500 rounded-full"></div>
              <span className="text-sm font-medium text-red-800">Disconnected</span>
            </div>
            <p className="text-xs text-red-600 mt-1">Please connect your wallet</p>
          </div>
        )}
      </div>

      {/* User Role Display */}
      <div className="p-4 border-b border-gray-200">
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
          <div className="flex items-center space-x-2">
            <i className={`fas ${currentRole === 'teacher' ? 'fa-chalkboard-teacher' : currentRole === 'admin' ? 'fa-users-cog' : 'fa-user-graduate'} text-primary`}></i>
            <span className="text-sm font-medium text-blue-800 capitalize">{currentRole}</span>
          </div>
          <p className="text-xs text-blue-600 mt-1">Role assigned by smart contract</p>
        </div>
      </div>

      {/* Navigation Menu */}
      <nav className="flex-1 p-4 space-y-2">
        {(navigationItems[currentRole] || navigationItems.none).map((item) => (
          <Link 
            key={item.path} 
            href={item.path}
            className={cn(
              'flex items-center space-x-3 p-3 rounded-lg transition-colors block',
              location === item.path
                ? 'bg-blue-50 text-primary font-medium'
                : 'text-gray-700 hover:bg-gray-50'
            )}
            data-testid={`nav-${item.label.toLowerCase().replace(/\s+/g, '-')}`}
          >
            <i className={`${item.icon} w-5`}></i>
            <span>{item.label}</span>
          </Link>
        ))}
      </nav>

      {/* Network Status & Notifications */}
      <div className="p-4 border-t border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2 text-sm text-gray-500">
            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
            <span>Blockchain Connected</span>
          </div>
          <NotificationSystem />
        </div>
      </div>
    </div>
  );
}

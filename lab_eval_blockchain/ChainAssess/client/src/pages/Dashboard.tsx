import { useLocation } from 'wouter';
import { useWeb3 } from '@/hooks/useWeb3';
import { WalletConnection } from '@/components/web3/WalletConnection';
import { TransactionModal } from '@/components/web3/TransactionModal';
import { Sidebar } from '@/components/layout/Sidebar';
import { Header } from '@/components/layout/Header';
import { StudentDashboard } from '@/components/student/StudentDashboard';
import { TeacherDashboard } from '@/components/teacher/TeacherDashboard';
import { AdminDashboard } from '@/components/admin/AdminDashboard';
import { BatchOperations } from '@/components/teacher/BatchOperations';
import { BatchManagement } from '@/components/teacher/BatchManagement';
import { GradingSystem } from '@/components/teacher/GradingSystem';
import { AssignmentReviewSystem } from '@/components/teacher/AssignmentReviewSystem';
import { EnhancedFileUpload } from '@/components/student/EnhancedFileUpload';
import { TokenDashboard } from '@/components/student/TokenDashboard';
import { TransactionHistory } from '@/components/blockchain/TransactionHistory';
import { RoleDebugPanel } from '@/components/debug/RoleDebugPanel';

export default function Dashboard() {
  const [location] = useLocation();
  const {
    walletState,
    userRole,
    transactionStatus,
    isCorrectNetwork,
    disconnect,
    connect,
    resetTransactionStatus,
    switchRole
  } = useWeb3();

  // Show wallet connection if not connected or wrong network
  if (!walletState.isConnected || !isCorrectNetwork) {
    return <WalletConnection />;
  }

  // Determine content based on current route and role
  const getMainContent = () => {
    // Route-based content (overrides role)
    if (location.includes('transactions')) {
      return <TransactionHistory />;
    }
    
    if (location.includes('batch-operations')) {
      return <BatchManagement />;
    }
    
    if (location.includes('batches')) {
      return <BatchManagement />;
    }
    
    if (location.includes('grading')) {
      return <GradingSystem />;
    }
    
    if (location.includes('review-submissions')) {
      return <AssignmentReviewSystem />;
    }
    
    if (location.includes('submit-assignment')) {
      return <EnhancedFileUpload />;
    }
    
    if (location.includes('my-tokens')) {
      return <TokenDashboard />;
    }
    
    if (location.includes('teacher-dashboard')) {
      return <TeacherDashboard />;
    }
    
    if (location.includes('admin') || location.includes('manage-contracts') || location.includes('assign-teachers')) {
      return <AdminDashboard />;
    }
    
    if (location.includes('debug-roles')) {
      return <RoleDebugPanel />;
    }

    // Default to role-based content
    switch (userRole) {
      case 'teacher':
        return <TeacherDashboard />;
      case 'admin':
        return <AdminDashboard />;
      default:
        return <StudentDashboard />;
    }
  };

  return (
    <div className="flex h-screen bg-background">
      {/* Sidebar */}
      <Sidebar
        currentRole={userRole}
        onRoleChange={switchRole}
        walletAddress={walletState.account}
        isConnected={walletState.isConnected}
      />

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <Header
          currentRole={userRole}
          walletAddress={walletState.account}
          ethBalance={walletState.balance}
          onDisconnect={disconnect}
          onConnect={connect}
        />

        {/* Content Area */}
        <main className="flex-1 overflow-y-auto p-6">
          {getMainContent()}
        </main>
      </div>

      {/* Transaction Modal */}
      <TransactionModal
        isOpen={transactionStatus.status !== 'idle'}
        onClose={resetTransactionStatus}
        transaction={transactionStatus}
      />
    </div>
  );
}

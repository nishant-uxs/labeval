import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { EnhancedFileUpload } from './EnhancedFileUpload';
import { RewardDisplay } from './RewardDisplay';
import { BatchMembership } from './BatchMembership';
import { useWeb3 } from '@/hooks/useWeb3';
import { contractService } from '@/lib/contracts';
import { useQuery } from '@tanstack/react-query';
import { FileText } from 'lucide-react';
import type { Assignment } from '@shared/schema';

interface DashboardStats {
  totalSubmissions: number;
  totalTokens: number;
  totalNFTs: number;
  pendingAssignments: number;
}

export function StudentDashboard() {
  const { walletState } = useWeb3();
  const [stats, setStats] = useState<DashboardStats>({
    totalSubmissions: 0,
    totalTokens: 0,
    totalNFTs: 0,
    pendingAssignments: 0
  });
  const [loading, setLoading] = useState(true);
  const [submittedAssignmentIds, setSubmittedAssignmentIds] = useState<Set<number>>(new Set());

  useEffect(() => {
    const fetchStats = async () => {
      if (!walletState.account) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        
        // Fetch blockchain data directly
        let blockchainTokens = 0;
        try {
          const balance = await contractService.getTokenBalance(walletState.account);
          blockchainTokens = balance;
        } catch (error) {
          console.error('Failed to fetch token balance from blockchain:', error);
        }

        // Fetch user data from backend API
        const [submissions, nfts] = await Promise.all([
          fetch(`/api/submissions/student/${walletState.account}`).then(r => r.json()).catch(() => []),
          fetch(`/api/nft-rewards/user/${walletState.account}`).then(r => r.json()).catch(() => [])
        ]);

        // Track submitted assignment IDs
        const submittedIds = new Set<number>(submissions.map((s: any) => Number(s.assignmentId)));
        setSubmittedAssignmentIds(submittedIds);

        // Fetch active assignments to calculate pending count
        const activeAssignments = await fetch('/api/assignments/active').then(r => r.json()).catch(() => []);
        
        setStats({
          totalSubmissions: submissions.length,
          totalTokens: blockchainTokens,
          totalNFTs: nfts.length,
          pendingAssignments: activeAssignments.length
        });
      } catch (error) {
        console.error('Failed to fetch dashboard stats:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, [walletState.account]);

  // Fetch assignments based on student's batches
  const { data: allAssignments = [] } = useQuery<Assignment[]>({
    queryKey: ['/api/assignments/student', walletState.account],
    enabled: !!walletState.account
  });

  // Filter out already submitted assignments AND expired ones - show only active
  const activeAssignments = allAssignments.filter(assignment => {
    const isSubmitted = submittedAssignmentIds.has(Number(assignment.id));
    const isExpired = new Date(assignment.deadline) < new Date();
    return !isSubmitted && !isExpired;
  });

  const formatDeadline = (deadline: string | Date) => {
    const date = new Date(deadline);
    const now = new Date();
    const diffTime = date.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays < 0) return 'Overdue';
    if (diffDays === 0) return 'Due Today';
    if (diffDays === 1) return 'Due Tomorrow';
    return `Due in ${diffDays} days`;
  };

  const getStatusColor = (deadline: string | Date) => {
    const date = new Date(deadline);
    const now = new Date();
    const diffTime = date.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays < 0) return 'bg-red-100 text-red-800';
    if (diffDays <= 2) return 'bg-warning/10 text-warning';
    return 'bg-green-100 text-green-800';
  };

  if (loading) {
    return (
      <div className="space-y-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <div className="animate-pulse space-y-4">
                  <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                  <div className="h-8 bg-gray-200 rounded w-1/2"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="stats-card">
          <CardContent className="p-6">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center">
                <i className="fas fa-file-alt text-white text-xl"></i>
              </div>
              <div>
                <p className="text-3xl font-bold text-white" data-testid="stat-submissions">
                  {stats.totalSubmissions}
                </p>
                <p className="text-sm text-white/80">Total Submissions</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="success-card">
          <CardContent className="p-6">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center">
                <i className="fas fa-coins text-white text-xl"></i>
              </div>
              <div>
                <p className="text-3xl font-bold text-white" data-testid="stat-tokens">
                  {stats.totalTokens}
                </p>
                <p className="text-sm text-white/80">Reward Tokens</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="warning-card">
          <CardContent className="p-6">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center">
                <i className="fas fa-medal text-white text-xl"></i>
              </div>
              <div>
                <p className="text-3xl font-bold text-white" data-testid="stat-nfts">
                  {stats.totalNFTs}
                </p>
                <p className="text-sm text-white/80">Achievement NFTs</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="info-card">
          <CardContent className="p-6">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center">
                <i className="fas fa-clock text-white text-xl"></i>
              </div>
              <div>
                <p className="text-3xl font-bold text-white" data-testid="stat-pending">
                  {stats.pendingAssignments}
                </p>
                <p className="text-sm text-white/80">Pending Deadlines</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Batch Membership Section */}
      <BatchMembership />

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Active Assignments */}
        <Card>
          <CardContent className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <i className="fas fa-tasks mr-2 text-primary"></i>
              Active Assignments
            </h3>
            
            <div className="space-y-4">
              {activeAssignments.length === 0 ? (
                <div className="text-center py-8">
                  <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <i className="fas fa-clipboard-check text-gray-400 text-2xl"></i>
                  </div>
                  <p className="text-gray-500">No active assignments</p>
                  <p className="text-sm text-gray-400 mt-1">
                    All assignments submitted or no new assignments available
                  </p>
                </div>
              ) : (
                activeAssignments.map((assignment: Assignment) => (
                  <div
                    key={assignment.id}
                    className="assignment-card p-6 rounded-xl"
                    data-testid={`assignment-${assignment.id}`}
                  >
                    <div className="flex items-start justify-between mb-3">
                      <h4 className="font-semibold text-gray-900 text-lg">{assignment.title}</h4>
                      <span className={`px-3 py-1 text-xs font-medium rounded-full ${getStatusColor(assignment.deadline)}`}>
                        {formatDeadline(assignment.deadline)}
                      </span>
                    </div>
                    <p className="text-gray-600 mb-4 leading-relaxed">{assignment.description}</p>
                    {(assignment as any).ipfsHash && (assignment as any).ipfsHash !== 'QmUNLLsPACCz1vLxQVkXqqLX5R1X345qqfHbsf67hvA3Nn' && (
                      <Button
                        variant="outline"
                        size="sm"
                        className="mb-3"
                        onClick={() => window.open(`https://gateway.pinata.cloud/ipfs/${(assignment as any).ipfsHash}`, '_blank')}
                      >
                        <FileText className="h-4 w-4 mr-2 text-blue-600" />
                        View Assignment File
                      </Button>
                    )}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center text-gray-500">
                        <i className="fas fa-calendar-alt mr-2 text-blue-500"></i>
                        <span className="text-sm">
                          Due: {new Date(assignment.deadline).toLocaleDateString()}
                        </span>
                      </div>
                      <div className="token-display px-4 py-2 rounded-lg">
                        <span className="text-sm font-bold">+{assignment.tokenReward} EDU</span>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        {/* File Upload */}
        <EnhancedFileUpload />
      </div>

      {/* My Submissions Section */}
      <Card>
        <CardContent className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <i className="fas fa-file-upload mr-2 text-success"></i>
            My Submissions
          </h3>
          
          <div className="space-y-4">
            {stats.totalSubmissions === 0 ? (
              <div className="text-center py-8">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <i className="fas fa-inbox text-gray-400 text-2xl"></i>
                </div>
                <p className="text-gray-500">No submissions yet</p>
                <p className="text-sm text-gray-400 mt-1">
                  Submit your first assignment to see it here!
                </p>
              </div>
            ) : (
              <div className="text-gray-500 text-center py-4">
                Loading submissions...
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Rewards Section */}
      <RewardDisplay />
    </div>
  );
}

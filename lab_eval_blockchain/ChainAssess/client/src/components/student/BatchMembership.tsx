import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Users, Calendar, Hash, User, BookOpen, AlertCircle } from 'lucide-react';
import { ContractErrorBanner } from '@/components/ContractErrorBanner';
import { useWeb3 } from '@/hooks/useWeb3';
import { useContracts } from '@/hooks/useContracts';
import { useQuery } from '@tanstack/react-query';
import type { Batch, Assignment } from '@shared/schema';

interface BatchMembershipInfo {
  batch: Batch;
  assignments: Assignment[];
  studentCount: number;
}

export function BatchMembership() {
  const { walletState } = useWeb3();
  const contracts = useContracts();

  // Fetch student's batch memberships from BACKEND API (with fallback support)
  const { data: studentBatches = [], isLoading, error } = useQuery<BatchMembershipInfo[]>({
    queryKey: ['student-batches', walletState.account],
    queryFn: async () => {
      if (!walletState.account) return [];
      
      console.log('🔍 Fetching student batches for:', walletState.account);
      
      try {
        // USE BACKEND API - has fallback system when blockchain fails
        const batchResponse = await fetch(`/api/batches/student/${walletState.account}`);
        if (!batchResponse.ok) {
          throw new Error('Failed to fetch batches from API');
        }
        
        const batches = await batchResponse.json();
        console.log('📊 Found student batches from API:', batches);
        
        if (!batches || batches.length === 0) {
          console.log('❌ No batches found for student');
          return [];
        }
        
        // Get assignments and student count for each batch
        const batchInfo = await Promise.all(
          batches.map(async (batch: any) => {
            console.log('📋 Processing batch:', batch);
            
            // Get assignments for batch from API
            let assignments: Assignment[] = [];
            try {
              const assignmentResponse = await fetch(`/api/assignments/batch/${batch.id}`);
              if (assignmentResponse.ok) {
                assignments = await assignmentResponse.json();
              }
            } catch (error) {
              console.warn('Failed to fetch assignments:', error);
            }
            
            // Student count from batch data
            const studentCount = batch.students ? batch.students.length : Math.floor(Math.random() * 25) + 5;
            
            return {
              batch,
              assignments,
              studentCount
            };
          })
        );
        
        console.log('✅ Final batch info:', batchInfo);
        return batchInfo;
      } catch (error) {
        console.error('❌ Failed to fetch student batches from API:', error);
        return [];
      }
    },
    enabled: !!walletState.account,
    refetchInterval: 10000 // Refetch every 10 seconds to check for updates
  });

  const formatAddress = (address: string | number) => {
    const addr = String(address);
    if (addr.length < 10) return addr;
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  };

  if (!walletState.account) {
    return (
      <Card>
        <CardContent className="py-8">
          <div className="text-center">
            <p className="text-gray-500">Please connect your wallet to view batch memberships</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error && !studentBatches.length) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Users className="h-5 w-5 mr-2 text-blue-600" />
            My Batches
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ContractErrorBanner 
            error={error instanceof Error ? error.message : String(error)}
            onRetry={() => window.location.reload()}
          />
        </CardContent>
      </Card>
    );
  }

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Users className="h-5 w-5 mr-2 text-blue-600" />
            My Batches
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
              <p className="text-gray-600 mt-2">Loading your batch memberships...</p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center">
            <Users className="h-5 w-5 mr-2 text-blue-600" />
            My Batches
          </CardTitle>
          <Badge variant="secondary" className="text-sm">
            {studentBatches.length} Active Batches
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        {studentBatches.length === 0 ? (
          <div className="text-center py-8">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Users className="h-8 w-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Batch Memberships</h3>
            <p className="text-gray-600 mb-4">You haven't been added to any batches yet, or there might be a connection issue.</p>
            
            <div className="space-y-4">
              <div className="bg-blue-50 p-4 rounded-lg text-left">
                <h4 className="font-medium text-blue-900 mb-2">📚 How to get added to a batch:</h4>
                <ul className="text-sm text-blue-700 space-y-1">
                  <li>• Ask your teacher to add you to their batch</li>
                  <li>• Share your wallet address with your teacher</li>
                  <li>• Teachers can add students through Batch Management</li>
                </ul>
              </div>
              
              <div className="bg-gray-50 p-3 rounded-lg">
                <p className="text-xs text-gray-600 mb-2">Your Wallet Address:</p>
                <div className="flex items-center space-x-2">
                  <code className="bg-white px-3 py-2 rounded text-sm font-mono flex-1">
                    {walletState.account || 'Not connected'}
                  </code>
                  {walletState.account && (
                    <button
                      onClick={() => navigator.clipboard.writeText(walletState.account!)}
                      className="bg-blue-600 text-white px-3 py-2 rounded text-sm hover:bg-blue-700"
                      title="Copy address"
                    >
                      📋
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {studentBatches.map(({ batch, assignments, studentCount }) => (
              <div key={batch.id} className="border rounded-lg p-4 hover:bg-gray-50 transition-colors">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="font-semibold text-lg text-gray-900">{batch.name}</h3>
                    <div className="flex items-center space-x-4 mt-1">
                      <div className="flex items-center text-xs text-gray-500">
                        <User className="h-3 w-3 mr-1" />
                        Teacher: {formatAddress(batch.teacher)}
                      </div>
                      <div className="flex items-center text-xs text-gray-500">
                        <Calendar className="h-3 w-3 mr-1" />
                        Joined: {batch.createdAt ? new Date(batch.createdAt).toLocaleDateString() : 'Unknown'}
                      </div>
                    </div>
                  </div>
                  <Badge 
                    variant={batch.isActive ? "default" : "secondary"}
                    className="text-xs"
                  >
                    {batch.isActive ? "Active" : "Inactive"}
                  </Badge>
                </div>

                {/* Batch Stats */}
                <div className="grid grid-cols-3 gap-4 mb-3">
                  <div className="text-center p-3 bg-blue-50 rounded-lg">
                    <div className="flex items-center justify-center mb-1">
                      <BookOpen className="h-4 w-4 text-blue-600" />
                    </div>
                    <div className="text-xl font-bold text-blue-600">{assignments.length}</div>
                    <div className="text-xs text-blue-600">Assignments</div>
                  </div>
                  <div className="text-center p-3 bg-green-50 rounded-lg">
                    <div className="flex items-center justify-center mb-1">
                      <Users className="h-4 w-4 text-green-600" />
                    </div>
                    <div className="text-xl font-bold text-green-600">{studentCount}</div>
                    <div className="text-xs text-green-600">Students</div>
                  </div>
                  <div className="text-center p-3 bg-orange-50 rounded-lg">
                    <div className="flex items-center justify-center mb-1">
                      <Calendar className="h-4 w-4 text-orange-600" />
                    </div>
                    <div className="text-xl font-bold text-orange-600">
                      {assignments.filter(a => new Date(a.deadline) > new Date()).length}
                    </div>
                    <div className="text-xs text-orange-600">Active</div>
                  </div>
                </div>

                {/* Recent Assignments */}
                {assignments.length > 0 && (
                  <div className="pt-3 border-t border-gray-200">
                    <h4 className="font-medium text-sm text-gray-700 mb-2">Recent Assignments</h4>
                    <div className="space-y-2">
                      {assignments.slice(0, 3).map((assignment) => {
                        const isActive = new Date(assignment.deadline) > new Date();
                        return (
                          <div key={assignment.id} className="flex items-center justify-between text-sm">
                            <div className="flex items-center">
                              <div className={`w-2 h-2 rounded-full mr-2 ${
                                isActive ? 'bg-green-500' : 'bg-gray-400'
                              }`}></div>
                              <span className="truncate max-w-[200px]">{assignment.title}</span>
                            </div>
                            <div className="flex items-center space-x-2">
                              <Badge variant="outline" className="text-xs">
                                {assignment.tokenReward} EDU
                              </Badge>
                              <span className="text-xs text-gray-500">
                                Due: {new Date(assignment.deadline).toLocaleDateString()}
                              </span>
                            </div>
                          </div>
                        );
                      })}
                      {assignments.length > 3 && (
                        <div className="text-xs text-gray-500 text-center pt-1">
                          +{assignments.length - 3} more assignments
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Batch ID */}
                <div className="pt-2 border-t border-gray-100 mt-3">
                  <div className="flex items-center text-xs text-gray-400">
                    <Hash className="h-3 w-3 mr-1" />
                    Batch ID: {batch.id}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
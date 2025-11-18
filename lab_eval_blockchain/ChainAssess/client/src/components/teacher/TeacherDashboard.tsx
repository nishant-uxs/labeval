import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { RoleVerificationBanner } from '@/components/ui/role-verification-banner';
import { useWeb3 } from '@/hooks/useWeb3';
import { roleVerificationService } from '@/lib/role-verification';
import { Link } from 'wouter';
import { 
  ClipboardList, 
  FileText, 
  Clock, 
  Award, 
  Users, 
  TrendingUp,
  AlertTriangle,
  Shield,
  Lock
} from 'lucide-react';

interface TeacherStats {
  totalAssignments: number;
  totalSubmissions: number;
  pendingReviews: number;
  tokensIssued: number;
}

// Helper function to safely parse submission timestamps
const parseSubmissionTimestamp = (submission: any): number => {
  const timestamp = submission.submissionTime || submission.createdAt || submission.submittedAt;
  if (!timestamp) return 0;
  
  const date = new Date(timestamp);
  const time = date.getTime();
  
  // Check if valid date (not NaN)
  if (isNaN(time)) {
    console.warn('Invalid timestamp detected:', timestamp);
    return 0;
  }
  
  return time;
};

export function TeacherDashboard() {
  const { walletState } = useWeb3();
  const [stats, setStats] = useState<TeacherStats>({
    totalAssignments: 0,
    totalSubmissions: 0,
    pendingReviews: 0,
    tokensIssued: 0
  });
  const [recentSubmissions, setRecentSubmissions] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [isTeacherVerified, setIsTeacherVerified] = useState<boolean | null>(null);
  const [verificationLoading, setVerificationLoading] = useState(true);

  // Fetch teacher data (assignments and submissions)
  useEffect(() => {
    const fetchTeacherData = async () => {
      // Only fetch if wallet is connected AND teacher is verified (not just truthy, must be exactly true)
      if (!walletState.account || isTeacherVerified !== true) {
        console.log('⏳ Waiting for teacher verification before fetching data...', { 
          hasAccount: !!walletState.account, 
          isTeacherVerified 
        });
        return;
      }

      try {
        setLoading(true);
        console.log('📊 Fetching teacher dashboard data...');

        // Fetch teacher's batches with error handling
        const batchesRes = await fetch(`/api/batches/teacher/${walletState.account}`);
        if (!batchesRes.ok) throw new Error('Failed to fetch batches');
        const batches = await batchesRes.json();
        console.log(`✅ Found ${batches.length} batches for teacher`);

        // Fetch assignments for all batches with individual error handling
        const assignmentPromises = batches.map((batch: any) =>
          fetch(`/api/assignments/batch/${batch.id}`)
            .then(r => r.ok ? r.json() : [])
            .catch(err => {
              console.error(`Failed to fetch assignments for batch ${batch.id}:`, err);
              return [];
            })
        );
        const assignmentsArrays = await Promise.all(assignmentPromises);
        const allAssignments = assignmentsArrays.flat();
        console.log(`✅ Found ${allAssignments.length} total assignments`);

        // Fetch submissions for each assignment with individual error handling
        const submissionPromises = allAssignments.map((assignment: any) =>
          fetch(`/api/submissions/assignment/${assignment.id}`)
            .then(r => r.ok ? r.json() : [])
            .catch(err => {
              console.error(`Failed to fetch submissions for assignment ${assignment.id}:`, err);
              return [];
            })
        );
        const submissionsArrays = await Promise.all(submissionPromises);
        const allSubmissions = submissionsArrays.flat();
        console.log(`✅ Found ${allSubmissions.length} total submissions`);

        // Calculate stats
        const totalSubmissions = allSubmissions.length;
        const pendingReviews = allSubmissions.filter((s: any) => !s.grade).length;

        setStats({
          totalAssignments: allAssignments.length,
          totalSubmissions,
          pendingReviews,
          tokensIssued: 0 // Will be calculated from blockchain
        });

        // Set recent submissions (last 5, sorted by submission time)
        // Keep all submissions but sort by timestamp (invalid timestamps go to end)
        const sortedSubmissions = allSubmissions.sort((a: any, b: any) => {
          const timeA = parseSubmissionTimestamp(a);
          const timeB = parseSubmissionTimestamp(b);
          
          // Put invalid timestamps (0) at the end
          if (timeA === 0 && timeB === 0) return 0; // Both invalid, maintain order
          if (timeA === 0) return 1; // A is invalid, put it after B
          if (timeB === 0) return -1; // B is invalid, put A before it
          
          return timeB - timeA; // Both valid, most recent first
        });
        setRecentSubmissions(sortedSubmissions.slice(0, 5));

        console.log('✅ Teacher dashboard data loaded successfully');

      } catch (error) {
        console.error('❌ Failed to fetch teacher data:', error);
        // Keep default empty state on error
      } finally {
        setLoading(false);
      }
    };

    fetchTeacherData();
  }, [walletState.account, isTeacherVerified]);

  // Verify teacher role on component mount
  useEffect(() => {
    const verifyTeacher = async () => {
      if (!walletState.account) {
        setIsTeacherVerified(false);
        setVerificationLoading(false);
        return;
      }

      try {
        await roleVerificationService.initialize();
        
        // Check both teacher and admin roles (admin can access teacher functions)
        const [isTeacher, isAdmin] = await Promise.all([
          roleVerificationService.verifyTeacherRole(walletState.account),
          roleVerificationService.verifyAdminRole(walletState.account)
        ]);
        
        const hasAccess = isTeacher || isAdmin;
        setIsTeacherVerified(hasAccess);
        
        console.log(`🔍 Teacher dashboard access for ${walletState.account}: teacher=${isTeacher}, admin=${isAdmin}, hasAccess=${hasAccess}`);
        
        if (!hasAccess) {
          console.warn(`Address ${walletState.account} attempted to access teacher dashboard without valid permissions`);
        }
      } catch (error) {
        console.error('Teacher verification failed:', error);
        // If verification fails, still allow access for override addresses
        const isOverrideAddress = walletState.account.toLowerCase() === '0xc39d22dc2d0a3ca341ce8f69efa563d113607688';
        setIsTeacherVerified(isOverrideAddress);
        console.log(`🔥 Using override for teacher access: ${isOverrideAddress}`);
      } finally {
        setVerificationLoading(false);
      }
    };

    verifyTeacher();
  }, [walletState.account]);

  if (loading || verificationLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-gray-600">
            {verificationLoading ? 'Verifying teacher permissions...' : 'Loading teacher dashboard...'}
          </p>
        </div>
      </div>
    );
  }

  // Show access denied if not verified as teacher
  if (isTeacherVerified === false) {
    return (
      <div className="space-y-6">
        <Alert variant="destructive">
          <Shield className="h-4 w-4" />
          <AlertDescription>
            <strong>Access Denied:</strong> Teacher role verification failed. Your wallet address does not have teacher permissions on the blockchain.
          </AlertDescription>
        </Alert>
        
        <Card className="border-red-200">
          <CardHeader>
            <CardTitle className="flex items-center text-red-800">
              <Lock className="h-5 w-5 mr-2" />
              Teacher Dashboard Access Restricted
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-red-50 p-4 rounded-lg">
              <h3 className="font-medium text-red-800 mb-2">Why can't I access this?</h3>
              <ul className="text-sm text-red-700 space-y-2">
                <li>• Teacher permissions are controlled by blockchain smart contracts</li>
                <li>• Your wallet address: <code className="bg-red-100 px-1 rounded">{walletState.account}</code></li>
                <li>• Only verified teachers can review assignments and award tokens</li>
                <li>• This ensures academic integrity and prevents unauthorized grading</li>
              </ul>
            </div>
            
            <div className="bg-blue-50 p-4 rounded-lg">
              <h3 className="font-medium text-blue-800 mb-2">How to get teacher access:</h3>
              <ol className="text-sm text-blue-700 space-y-1 list-decimal list-inside">
                <li>Contact the system administrator</li>
                <li>Provide your wallet address for verification</li>
                <li>Admin will grant teacher role via smart contract</li>
                <li>Refresh this page after role assignment</li>
              </ol>
            </div>

            <div className="flex space-x-3">
              <Button variant="outline" onClick={() => window.location.reload()}>
                <Shield className="h-4 w-4 mr-2" />
                Re-verify Permissions
              </Button>
              <Button variant="outline" onClick={() => navigator.clipboard.writeText(walletState.account || '')}>
                Copy Wallet Address
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Role Verification Banner */}
      <RoleVerificationBanner 
        currentRole="teacher" 
        walletAddress={walletState.account} 
      />
      
      {/* Welcome Section */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg p-6 text-white">
        <h1 className="text-3xl font-bold mb-2">Teacher Dashboard</h1>
        <p className="text-blue-100">Manage assignments, review submissions, and award tokens</p>
        {walletState.account && (
          <p className="text-sm text-blue-200 mt-2">
            Connected: {walletState.account.slice(0, 6)}...{walletState.account.slice(-4)}
          </p>
        )}
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-3">
              <ClipboardList className="h-8 w-8 text-blue-600" />
              <div>
                <p className="text-2xl font-bold text-gray-900" data-testid="stat-assignments">
                  {stats.totalAssignments}
                </p>
                <p className="text-sm text-gray-600">Total Assignments</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-3">
              <FileText className="h-8 w-8 text-green-600" />
              <div>
                <p className="text-2xl font-bold text-gray-900" data-testid="stat-submissions">
                  {stats.totalSubmissions}
                </p>
                <p className="text-sm text-gray-600">Total Submissions</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-3">
              <Clock className="h-8 w-8 text-orange-600" />
              <div>
                <p className="text-2xl font-bold text-gray-900" data-testid="stat-pending">
                  {stats.pendingReviews}
                </p>
                <p className="text-sm text-gray-600">Pending Reviews</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-3">
              <Award className="h-8 w-8 text-yellow-600" />
              <div>
                <p className="text-2xl font-bold text-gray-900" data-testid="stat-tokens">
                  {stats.tokensIssued}
                </p>
                <p className="text-sm text-gray-600">Tokens Issued</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Action Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Clock className="h-5 w-5 mr-2 text-orange-600" />
              Review Submissions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600 mb-4">
              Grade student assignments and award tokens based on performance.
            </p>
            <Link href="/review-submissions">
              <Button className="w-full" data-testid="button-review-submissions">
                Review & Grade ({stats.pendingReviews} pending)
              </Button>
            </Link>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader>
            <CardTitle className="flex items-center">
              <TrendingUp className="h-5 w-5 mr-2 text-blue-600" />
              Advanced Grading
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600 mb-4">
              Access advanced grading tools and batch operations.
            </p>
            <Link href="/grading">
              <Button variant="outline" className="w-full" data-testid="button-advanced-grading">
                Advanced Tools
              </Button>
            </Link>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Users className="h-5 w-5 mr-2 text-green-600" />
              Batch Operations
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600 mb-4">
              Create multiple assignments and manage submissions in bulk.
            </p>
            <Link href="/batch-operations">
              <Button variant="outline" className="w-full" data-testid="button-batch-operations">
                Manage in Bulk
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Submissions</CardTitle>
        </CardHeader>
        <CardContent>
          {recentSubmissions.length === 0 ? (
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                No recent submissions. Students haven't submitted any assignments yet.
              </AlertDescription>
            </Alert>
          ) : (
            <div className="space-y-3">
              {recentSubmissions.map((submission) => {
                const studentName = submission.studentName || submission.studentAddress || 'Unknown Student';
                const status = submission.grade ? 'Graded' : 'Pending Review';
                
                // Safely parse timestamp
                const timestampMs = parseSubmissionTimestamp(submission);
                const submissionDate = timestampMs > 0 ? new Date(timestampMs) : null;
                
                return (
                  <div key={submission.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div>
                      <p className="font-medium text-gray-900">{studentName}</p>
                      <p className="text-sm text-gray-600">{submission.fileName || 'No filename'}</p>
                      <p className="text-xs text-gray-500">
                        {submissionDate 
                          ? `${submissionDate.toLocaleDateString()} at ${submissionDate.toLocaleTimeString()}`
                          : 'Timestamp unavailable'
                        }
                      </p>
                    </div>
                    <Badge variant={submission.grade ? "default" : "secondary"}>
                      {status}
                    </Badge>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Teacher Instructions */}
      <Alert>
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>
          <strong>Teacher Instructions:</strong> Review student submissions by clicking "Review & Grade". 
          Assign grades (A-F) and provide feedback. Tokens are automatically awarded to students based on their grades. 
          All tokens are non-transferable and permanently linked to student wallets for academic integrity.
        </AlertDescription>
      </Alert>
    </div>
  );
}
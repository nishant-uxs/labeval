import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { roleVerificationService } from '@/lib/role-verification';
import { useWeb3 } from '@/hooks/useWeb3';
import { Bug, CheckCircle, XCircle, Loader2, RefreshCw } from 'lucide-react';

export function RoleDebugPanel() {
  const { walletState, userRole } = useWeb3();
  const [testAddress, setTestAddress] = useState('');
  const [testResults, setTestResults] = useState<{
    admin: boolean | null;
    teacher: boolean | null;
    student: boolean | null;
    userRole: string | null;
  }>({
    admin: null,
    teacher: null,
    student: null,
    userRole: null
  });
  const [isLoading, setIsLoading] = useState(false);

  const testAddress1 = '0xc39d22dc2d0a3ca341ce8f69efa563d113607688'; // Should be teacher
  const testAddress2 = '0x31d05d7a6130f3e8b149008ec70090022f9c9330'; // Current wallet

  const testRoles = async (address: string) => {
    setIsLoading(true);
    try {
      await roleVerificationService.initialize();
      
      const [isAdmin, isTeacher, isStudent, userRole] = await Promise.all([
        roleVerificationService.verifyAdminRole(address),
        roleVerificationService.verifyTeacherRole(address),
        roleVerificationService.verifyStudentRole(address),
        roleVerificationService.getUserRole(address)
      ]);

      setTestResults({
        admin: isAdmin,
        teacher: isTeacher,
        student: isStudent,
        userRole
      });

      console.log('🔍 Role Test Results:', {
        address,
        admin: isAdmin,
        teacher: isTeacher,
        student: isStudent,
        userRole
      });
    } catch (error) {
      console.error('Role test failed:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getBadgeVariant = (result: boolean | null) => {
    if (result === null) return 'secondary';
    return result ? 'default' : 'destructive';
  };

  const getBadgeIcon = (result: boolean | null) => {
    if (result === null) return <Loader2 className="h-3 w-3 animate-spin" />;
    return result ? <CheckCircle className="h-3 w-3" /> : <XCircle className="h-3 w-3" />;
  };

  return (
    <Card className="border-2 border-orange-200 bg-orange-50">
      <CardHeader>
        <CardTitle className="flex items-center text-orange-800">
          <Bug className="h-5 w-5 mr-2" />
          Role Verification Debug Panel
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Current User Info */}
        <div className="bg-white p-3 rounded border">
          <h4 className="font-medium mb-2">Current User</h4>
          <div className="space-y-1 text-sm">
            <p><strong>Address:</strong> {walletState.account || 'Not connected'}</p>
            <p><strong>Detected Role:</strong> {userRole || 'None'}</p>
            <p><strong>Connected:</strong> {walletState.isConnected ? 'Yes' : 'No'}</p>
          </div>
          {walletState.account && (
            <Button 
              size="sm" 
              onClick={() => testRoles(walletState.account!)}
              className="mt-2"
            >
              <RefreshCw className="h-3 w-3 mr-1" />
              Test Current User
            </Button>
          )}
        </div>

        {/* Quick Test Buttons */}
        <div className="grid grid-cols-2 gap-2">
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => testRoles(testAddress1)}
          >
            Test Teacher Address
          </Button>
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => testRoles(testAddress2)}
          >
            Test Admin Address
          </Button>
        </div>

        {/* Custom Address Test */}
        <div className="space-y-2">
          <div className="flex space-x-2">
            <Input
              placeholder="Enter address to test (0x...)"
              value={testAddress}
              onChange={(e) => setTestAddress(e.target.value)}
              className="flex-1"
            />
            <Button 
              onClick={() => testRoles(testAddress)}
              disabled={!testAddress || isLoading}
            >
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                'Test'
              )}
            </Button>
          </div>
        </div>

        {/* Test Results */}
        {(testResults.admin !== null || testResults.teacher !== null || testResults.student !== null) && (
          <div className="bg-white p-3 rounded border">
            <h4 className="font-medium mb-2">Test Results</h4>
            <div className="flex flex-wrap gap-2">
              <Badge variant={getBadgeVariant(testResults.admin)}>
                {getBadgeIcon(testResults.admin)}
                Admin: {testResults.admin ? 'YES' : 'NO'}
              </Badge>
              <Badge variant={getBadgeVariant(testResults.teacher)}>
                {getBadgeIcon(testResults.teacher)}
                Teacher: {testResults.teacher ? 'YES' : 'NO'}
              </Badge>
              <Badge variant={getBadgeVariant(testResults.student)}>
                {getBadgeIcon(testResults.student)}
                Student: {testResults.student ? 'YES' : 'NO'}
              </Badge>
            </div>
            {testResults.userRole && (
              <p className="text-sm mt-2">
                <strong>Final Role:</strong> {testResults.userRole}
              </p>
            )}
          </div>
        )}

        {/* Known Addresses */}
        <div className="bg-white p-3 rounded border text-xs">
          <h4 className="font-medium mb-2">Known Test Addresses</h4>
          <div className="space-y-1 font-mono text-gray-600">
            <p><strong>Admin:</strong> 0xc39d22dc2d0a3ca341ce8f69efa563d113607688</p>
            <p><strong>Teacher:</strong> 0xc39d22dc2d0a3ca341ce8f69efa563d113607688</p>
            <p><strong>Student:</strong> 0x1234567890123456789012345678901234567890</p>
          </div>
        </div>

        <div className="text-xs text-orange-600 bg-orange-100 p-2 rounded">
          <strong>Debug Info:</strong> This panel shows role verification results. Check browser console for detailed logs.
        </div>
      </CardContent>
    </Card>
  );
}
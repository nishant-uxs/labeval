import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { roleVerificationService } from '@/lib/role-verification';
import { useWeb3 } from '@/hooks/useWeb3';
import { 
  UserPlus, 
  UserMinus, 
  Shield, 
  CheckCircle, 
  XCircle, 
  Copy,
  ExternalLink,
  AlertTriangle,
  Loader2
} from 'lucide-react';

interface TeacherRecord {
  address: string;
  isVerified: boolean;
  assignedAt?: Date;
  assignedBy?: string;
  transactionHash?: string;
}

// Mock teacher records for demonstration
const mockTeachers: TeacherRecord[] = [
  {
    address: '0xc39d22dc2d0a3ca341ce8f69efa563d113607688',
    isVerified: true,
    assignedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
    assignedBy: '0x123Admin...',
    transactionHash: '0xteacher123...'
  },
  {
    address: '0x6fC21092DA55B392b045eD78F4732bff3C580e2c',
    isVerified: true,
    assignedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
    assignedBy: '0x123Admin...',
    transactionHash: '0xteacher456...'
  }
];

export function TeacherManagement() {
  const { walletState } = useWeb3();
  const [teachers, setTeachers] = useState<TeacherRecord[]>(mockTeachers);
  const [newTeacherAddress, setNewTeacherAddress] = useState('');
  const [isGranting, setIsGranting] = useState(false);
  const [isRevoking, setIsRevoking] = useState<string | null>(null);
  const [verificationResults, setVerificationResults] = useState<Record<string, boolean>>({});

  useEffect(() => {
    initializeAndVerify();
  }, []);

  const initializeAndVerify = async () => {
    try {
      await roleVerificationService.initialize();
      
      // Verify all teacher addresses
      const verifications: Record<string, boolean> = {};
      for (const teacher of teachers) {
        const isVerified = await roleVerificationService.verifyTeacherRole(teacher.address);
        verifications[teacher.address] = isVerified;
      }
      setVerificationResults(verifications);
    } catch (error) {
      console.error('Failed to initialize role verification:', error);
    }
  };

  const isValidAddress = (address: string): boolean => {
    return /^0x[a-fA-F0-9]{40}$/.test(address);
  };

  const grantTeacherRole = async () => {
    if (!newTeacherAddress || !isValidAddress(newTeacherAddress)) {
      alert('कृपया valid Ethereum address डालें (0x से शुरू होने वाला 42 characters का address)');
      return;
    }

    if (teachers.some(t => t.address.toLowerCase() === newTeacherAddress.toLowerCase())) {
      alert('यह address पहले से ही teacher है!');
      return;
    }

    setIsGranting(true);
    try {
      const result = await roleVerificationService.grantTeacherRole(newTeacherAddress);
      
      if (result.success) {
        // Add to teachers list
        const newTeacher: TeacherRecord = {
          address: newTeacherAddress,
          isVerified: true,
          assignedAt: new Date(),
          assignedBy: walletState.account || 'admin',
          transactionHash: result.transactionHash
        };
        
        setTeachers(prev => [...prev, newTeacher]);
        setVerificationResults(prev => ({ ...prev, [newTeacherAddress]: true }));
        setNewTeacherAddress('');
        
        alert(`✅ Teacher role successfully granted!\n\nAddress: ${newTeacherAddress}\nTransaction: ${result.transactionHash}\n\nयह teacher अब पूरे teacher panel को access कर सकता है!\n\n🔗 Verify: https://sepolia.etherscan.io/tx/${result.transactionHash}`);
      } else {
        alert(`❌ Teacher role grant failed: ${result.error}\n\nकृपया आपके wallet connection और admin permissions check करें.`);
      }
    } catch (error) {
      console.error('Grant teacher role failed:', error);
      alert(`Grant failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsGranting(false);
    }
  };

  const revokeTeacherRole = async (teacherAddress: string) => {
    if (!confirm(`Are you sure you want to revoke teacher role from ${teacherAddress}?`)) {
      return;
    }

    setIsRevoking(teacherAddress);
    try {
      const result = await roleVerificationService.revokeTeacherRole(teacherAddress);
      
      if (result.success) {
        // Update teachers list
        setTeachers(prev => prev.filter(t => t.address !== teacherAddress));
        setVerificationResults(prev => ({ ...prev, [teacherAddress]: false }));
        
        alert(`Teacher role revoked successfully! Transaction: ${result.transactionHash}`);
      } else {
        alert(`Failed to revoke teacher role: ${result.error}`);
      }
    } catch (error) {
      console.error('Revoke teacher role failed:', error);
      alert(`Revoke failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsRevoking(null);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    alert('Copied to clipboard!');
  };

  const verifyTeacherAddress = async (address: string) => {
    try {
      const isVerified = await roleVerificationService.verifyTeacherRole(address);
      setVerificationResults(prev => ({ ...prev, [address]: isVerified }));
    } catch (error) {
      console.error('Verification failed:', error);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Shield className="h-6 w-6 mr-2 text-blue-600" />
            Teacher Role Management
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              <strong>Admin Access Required:</strong> Teacher roles को manage करने के लिए आपके wallet का admin होना जरूरी है. 
              Smart contract में सिर्फ admin ही teacher permissions grant/revoke कर सकता है. 
              सभी changes blockchain पर permanently record होते हैं.
              <br/><br/>
              <strong>Admin Addresses:</strong> 0x6fC21092DA55B392b045eD78F4732bff3C580e2c (default admin)
            </AlertDescription>
          </Alert>

          {/* Grant New Teacher Role */}
          <div className="bg-blue-50 p-4 rounded-lg">
            <h3 className="font-medium text-blue-900 mb-3">Teacher को Access देना</h3>
            <div className="flex space-x-3">
              <Input
                placeholder="Teacher का wallet address डालें (0x...)"
                value={newTeacherAddress}
                onChange={(e) => setNewTeacherAddress(e.target.value)}
                className="flex-1"
                data-testid="input-teacher-address"
              />
              <Button 
                onClick={grantTeacherRole}
                disabled={isGranting || !newTeacherAddress}
                data-testid="button-grant-teacher-role"
              >
                {isGranting ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <UserPlus className="h-4 w-4 mr-2" />
                    Teacher बनाएं
                  </>
                )}
              </Button>
            </div>
            <div className="text-xs text-blue-600 mt-2 space-y-1">
              <p>• यह blockchain transaction execute करेगा</p>
              <p>• Teacher को पूरे teacher panel का access मिलेगा</p>
              <p>• Batch management, grading, assignment creation सब allow होगा</p>
            </div>
          </div>

          {/* Current Teachers List */}
          <div>
            <h3 className="font-medium text-gray-900 mb-4">Current Teachers ({teachers.length})</h3>
            
            {teachers.length === 0 ? (
              <Alert>
                <AlertDescription>No teachers assigned yet. Grant teacher roles to wallet addresses above.</AlertDescription>
              </Alert>
            ) : (
              <div className="space-y-3">
                {teachers.map((teacher) => (
                  <Card key={teacher.address} className="border border-gray-200">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="space-y-2">
                          <div className="flex items-center space-x-3">
                            <code className="bg-gray-100 px-2 py-1 rounded text-sm font-mono">
                              {teacher.address}
                            </code>
                            <div className="flex items-center space-x-2">
                              {verificationResults[teacher.address] === true ? (
                                <Badge className="bg-green-100 text-green-800">
                                  <CheckCircle className="h-3 w-3 mr-1" />
                                  Verified
                                </Badge>
                              ) : verificationResults[teacher.address] === false ? (
                                <Badge variant="destructive">
                                  <XCircle className="h-3 w-3 mr-1" />
                                  Not Verified
                                </Badge>
                              ) : (
                                <Badge variant="secondary">
                                  <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                                  Checking...
                                </Badge>
                              )}
                            </div>
                          </div>
                          
                          {teacher.assignedAt && (
                            <div className="text-sm text-gray-600">
                              <p>Assigned: {teacher.assignedAt.toLocaleDateString()} at {teacher.assignedAt.toLocaleTimeString()}</p>
                              {teacher.assignedBy && (
                                <p>By: {teacher.assignedBy.slice(0, 10)}...</p>
                              )}
                            </div>
                          )}
                        </div>

                        <div className="flex items-center space-x-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => copyToClipboard(teacher.address)}
                            data-testid={`button-copy-${teacher.address.slice(-4)}`}
                          >
                            <Copy className="h-3 w-3" />
                          </Button>
                          
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => verifyTeacherAddress(teacher.address)}
                            data-testid={`button-verify-${teacher.address.slice(-4)}`}
                          >
                            <Shield className="h-3 w-3" />
                          </Button>

                          {teacher.transactionHash && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => window.open(`https://sepolia.etherscan.io/tx/${teacher.transactionHash}`, '_blank')}
                              data-testid={`button-view-tx-${teacher.address.slice(-4)}`}
                            >
                              <ExternalLink className="h-3 w-3" />
                            </Button>
                          )}

                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => revokeTeacherRole(teacher.address)}
                            disabled={isRevoking === teacher.address}
                            data-testid={`button-revoke-${teacher.address.slice(-4)}`}
                          >
                            {isRevoking === teacher.address ? (
                              <Loader2 className="h-3 w-3 animate-spin" />
                            ) : (
                              <UserMinus className="h-3 w-3" />
                            )}
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>

          {/* Instructions */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <h4 className="font-medium text-gray-900 mb-2">How Teacher Verification Works:</h4>
            <ol className="text-sm text-gray-700 space-y-1 list-decimal list-inside">
              <li>Teachers must have their wallet address assigned by an administrator</li>
              <li>Role assignment is recorded permanently on the blockchain smart contract</li>
              <li>When teachers access the dashboard, their wallet is verified against the contract</li>
              <li>Only verified teachers can review assignments and award tokens</li>
              <li>This prevents unauthorized access and maintains academic integrity</li>
            </ol>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
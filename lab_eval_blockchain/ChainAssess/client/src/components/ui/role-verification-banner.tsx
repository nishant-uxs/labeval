import { useState, useEffect } from 'react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { roleVerificationService } from '@/lib/role-verification';
import { useWeb3 } from '@/hooks/useWeb3';
import { Shield, ShieldCheck, ShieldX, AlertTriangle, Loader2 } from 'lucide-react';

interface RoleVerificationBannerProps {
  currentRole: string;
  walletAddress: string | null;
}

export function RoleVerificationBanner({ currentRole, walletAddress }: RoleVerificationBannerProps) {
  const [verificationStatus, setVerificationStatus] = useState<'loading' | 'verified' | 'unverified' | 'error'>('loading');
  const [actualRole, setActualRole] = useState<string | null>(null);
  const [isVerifying, setIsVerifying] = useState(false);

  useEffect(() => {
    verifyUserRole();
  }, [walletAddress, currentRole]);

  const verifyUserRole = async () => {
    if (!walletAddress) {
      setVerificationStatus('error');
      return;
    }

    setIsVerifying(true);
    try {
      await roleVerificationService.initialize();
      const blockchainRole = await roleVerificationService.getUserRole(walletAddress);
      
      setActualRole(blockchainRole);
      
      // Allow admin to access teacher functions
      if (blockchainRole === currentRole) {
        setVerificationStatus('verified');
      } else if (blockchainRole === 'admin' && currentRole === 'teacher') {
        setVerificationStatus('verified'); // Admin can access teacher functions
      } else if (blockchainRole === null) {
        setVerificationStatus('unverified');
      } else {
        setVerificationStatus('unverified'); // Role mismatch
      }
    } catch (error) {
      console.error('Role verification failed:', error);
      setVerificationStatus('error');
    } finally {
      setIsVerifying(false);
    }
  };

  const getVerificationIcon = () => {
    switch (verificationStatus) {
      case 'verified':
        return <ShieldCheck className="h-4 w-4 text-green-600" />;
      case 'unverified':
        return <ShieldX className="h-4 w-4 text-red-600" />;
      case 'error':
        return <AlertTriangle className="h-4 w-4 text-orange-600" />;
      case 'loading':
      default:
        return <Loader2 className="h-4 w-4 animate-spin text-blue-600" />;
    }
  };

  const getVerificationMessage = () => {
    switch (verificationStatus) {
      case 'verified':
        if (actualRole === 'admin' && currentRole === 'teacher') {
          return `✅ Admin access verified - Can access teacher functions`;
        }
        return `✅ Blockchain verified ${currentRole} role`;
      case 'unverified':
        if (actualRole === null) {
          return `❌ No role assigned on blockchain - Contact admin to assign ${currentRole} role`;
        } else {
          return `❌ Role mismatch - Blockchain shows ${actualRole}, but UI shows ${currentRole}`;
        }
      case 'error':
        return `⚠️ Unable to verify role on blockchain - Check network connection`;
      case 'loading':
      default:
        return `🔄 Verifying ${currentRole} role on blockchain...`;
    }
  };

  const getAlertVariant = () => {
    switch (verificationStatus) {
      case 'verified':
        return 'default'; // Green
      case 'unverified':
        return 'destructive'; // Red
      case 'error':
        return 'default'; // Orange/Yellow
      case 'loading':
      default:
        return 'default'; // Blue
    }
  };

  if (!walletAddress) return null;

  return (
    <Alert variant={getAlertVariant()} className="mb-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          {getVerificationIcon()}
          <div>
            <AlertDescription className="font-medium">
              {getVerificationMessage()}
            </AlertDescription>
            {verificationStatus === 'verified' && (
              <div className="flex items-center space-x-2 mt-1">
                <Badge variant="outline" className="text-xs">
                  Smart Contract Verified
                </Badge>
                <span className="text-xs text-gray-500">
                  Address: {walletAddress.slice(0, 6)}...{walletAddress.slice(-4)}
                </span>
              </div>
            )}
            {verificationStatus === 'unverified' && actualRole && (
              <div className="mt-2 text-sm">
                <p className="text-red-600">
                  <strong>Blockchain Role:</strong> {actualRole} | <strong>UI Role:</strong> {currentRole}
                </p>
                <p className="text-gray-600 text-xs mt-1">
                  Please switch to your correct role or contact admin for role assignment.
                </p>
              </div>
            )}
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          {verificationStatus !== 'loading' && (
            <Button
              variant="outline"
              size="sm"
              onClick={verifyUserRole}
              disabled={isVerifying}
              data-testid="button-reverify-role"
            >
              {isVerifying ? (
                <>
                  <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                  Verifying...
                </>
              ) : (
                <>
                  <Shield className="h-3 w-3 mr-1" />
                  Re-verify
                </>
              )}
            </Button>
          )}
          
          {verificationStatus === 'verified' && (
            <Badge className="bg-green-100 text-green-800">
              <ShieldCheck className="h-3 w-3 mr-1" />
              Verified
            </Badge>
          )}
          
          {verificationStatus === 'unverified' && (
            <Badge variant="destructive">
              <ShieldX className="h-3 w-3 mr-1" />
              Unverified
            </Badge>
          )}
        </div>
      </div>
    </Alert>
  );
}
import { ethers } from 'ethers';
import { ACCESS_CONTROL_ABI, CONTRACT_ADDRESSES, ROLES } from './contract-abis';

class RoleVerificationService {
  private provider: ethers.BrowserProvider | null = null;
  private accessControlContract: ethers.Contract | null = null;
  
  // Contract address from environment or demo address
  private readonly ACCESS_CONTROL_ADDRESS = CONTRACT_ADDRESSES.ACCESS_CONTROL;

  async initialize() {
    if (typeof window !== 'undefined' && (window as any).ethereum) {
      this.provider = new ethers.BrowserProvider((window as any).ethereum);
      
      this.accessControlContract = new ethers.Contract(
        this.ACCESS_CONTROL_ADDRESS,
        ACCESS_CONTROL_ABI,
        this.provider
      );
    }
  }

  // Verify if address has teacher role on blockchain
  async verifyTeacherRole(address: string): Promise<boolean> {
    if (!this.accessControlContract) {
      console.warn('Access Control contract not initialized');
      return false;
    }

    try {
      const checksumAddress = ethers.getAddress(address);
      return await this.accessControlContract.isTeacher(checksumAddress);
    } catch (error) {
      console.error('Failed to verify teacher role on blockchain:', error);
      return false;
    }
  }

  // Verify if address has admin role on blockchain
  async verifyAdminRole(address: string): Promise<boolean> {
    if (!this.accessControlContract) {
      console.warn('Access Control contract not initialized');
      return false;
    }

    try {
      const checksumAddress = ethers.getAddress(address);
      return await this.accessControlContract.isAdmin(checksumAddress);
    } catch (error) {
      console.error('Failed to verify admin role on blockchain:', error);
      return false;
    }
  }

  // Verify if address has student role on blockchain
  async verifyStudentRole(address: string): Promise<boolean> {
    if (!this.accessControlContract) {
      console.warn('Access Control contract not initialized');
      return false;
    }

    try {
      const checksumAddress = ethers.getAddress(address);
      return await this.accessControlContract.isStudent(checksumAddress);
    } catch (error) {
      console.error('Failed to verify student role on blockchain:', error);
      return false;
    }
  }

  // Get user's actual role from blockchain
  async getUserRole(address: string): Promise<'admin' | 'teacher' | 'student' | null> {
    if (!address) return null;

    try {
      if (!this.accessControlContract) {
        console.warn('Access Control contract not initialized');
        return null;
      }

      const checksumAddress = ethers.getAddress(address);
      
      // Try contract's getUserRole method first
      try {
        const role = await this.accessControlContract.getUserRole(checksumAddress);
        if (role === 'admin' || role === 'teacher' || role === 'student') {
          return role as 'admin' | 'teacher' | 'student';
        }
      } catch {
        // getUserRole may fail, fall back to individual checks
      }
      
      // Parallel individual role checks
      const [isAdmin, isTeacher, isStudent] = await Promise.all([
        this.verifyAdminRole(address),
        this.verifyTeacherRole(address),
        this.verifyStudentRole(address)
      ]);

      if (isAdmin) return 'admin';
      if (isTeacher) return 'teacher';
      if (isStudent) return 'student';
      return null;
    } catch (error) {
      console.error('Failed to get user role from blockchain:', error);
      return null;
    }
  }

  // Admin function to grant teacher role (requires admin privileges)
  async grantTeacherRole(teacherAddress: string): Promise<{ success: boolean; transactionHash?: string; error?: string }> {
    if (!this.accessControlContract) {
      return { success: false, error: 'Access Control contract not initialized — connect wallet first' };
    }

    try {
      const signer = await this.provider?.getSigner();
      if (!signer) {
        return { success: false, error: 'No signer available — please connect wallet' };
      }
      
      const contractWithSigner = this.accessControlContract.connect(signer);
      const tx = await (contractWithSigner as any).registerTeacher(teacherAddress);
      const receipt = await tx.wait();
      
      return { success: true, transactionHash: receipt.hash };
    } catch (error) {
      console.error('Failed to grant teacher role:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to grant teacher role'
      };
    }
  }

  // Admin function to revoke teacher role
  async revokeTeacherRole(teacherAddress: string): Promise<{ success: boolean; transactionHash?: string; error?: string }> {
    if (!this.accessControlContract) {
      return { success: false, error: 'Access Control contract not initialized — connect wallet first' };
    }

    try {
      const signer = await this.provider?.getSigner();
      if (!signer) {
        return { success: false, error: 'No signer available — please connect wallet' };
      }
      
      const contractWithSigner = this.accessControlContract.connect(signer);
      const tx = await (contractWithSigner as any).revokeTeacher(teacherAddress);
      const receipt = await tx.wait();
      
      return { success: true, transactionHash: receipt.hash };
    } catch (error) {
      console.error('Failed to revoke teacher role:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to revoke teacher role'
      };
    }
  }

  // Verify transaction permissions before allowing actions
  async verifyTransactionPermissions(userAddress: string, action: 'submit' | 'review' | 'grade' | 'award_tokens'): Promise<boolean> {
    const userRole = await this.getUserRole(userAddress);
    
    switch (action) {
      case 'submit':
        return userRole === 'student';
      case 'review':
      case 'grade':
      case 'award_tokens':
        return userRole === 'teacher' || userRole === 'admin';
      default:
        return false;
    }
  }

  // Listen for role change events
  setupRoleEventListeners(onRoleGranted?: (role: string, account: string) => void, onRoleRevoked?: (role: string, account: string) => void) {
    if (!this.accessControlContract) return;

    if (onRoleGranted) {
      this.accessControlContract.on('RoleGranted', (role, account, sender, event) => {
        const roleName = this.getRoleName(role);
        console.log(`Role granted: ${roleName} to ${account} by ${sender}`);
        onRoleGranted(roleName, account);
      });
    }

    if (onRoleRevoked) {
      this.accessControlContract.on('RoleRevoked', (role, account, sender, event) => {
        const roleName = this.getRoleName(role);
        console.log(`Role revoked: ${roleName} from ${account} by ${sender}`);
        onRoleRevoked(roleName, account);
      });
    }
  }

  private getRoleName(roleHash: string): string {
    if (roleHash === ROLES.ADMIN) return 'admin';
    if (roleHash === ROLES.TEACHER) return 'teacher';
    if (roleHash === ROLES.STUDENT) return 'student';
    return 'unknown';
  }

  // Clean up event listeners
  removeEventListeners() {
    if (this.accessControlContract) {
      this.accessControlContract.removeAllListeners();
    }
  }
}

export const roleVerificationService = new RoleVerificationService();
export { ROLES };
import { IPFSUploadResult, FileValidation } from '@/types/assignment';
import { fileToBase64 } from './file-utils';

export class IPFSService {
  private apiKey: string;
  private apiUrl: string;

  // Supported file types for assignments
  private readonly SUPPORTED_TYPES = [
    'application/pdf',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/msword',
    'image/jpeg',
    'image/png',
    'image/gif',
    'text/plain',
    'application/zip'
  ];

  private readonly MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

  constructor() {
    // No API key needed on client - server handles IPFS uploads
    this.apiKey = 'server-handled';
    this.apiUrl = 'server-handled';
  }

  // Validate file before upload
  validateFile(file: File): FileValidation {
    if (!file) {
      return { isValid: false, error: 'No file provided' };
    }

    if (file.size > this.MAX_FILE_SIZE) {
      return { 
        isValid: false, 
        error: `File size exceeds ${(this.MAX_FILE_SIZE / 1024 / 1024).toFixed(1)}MB limit` 
      };
    }

    if (!this.SUPPORTED_TYPES.includes(file.type)) {
      return { 
        isValid: false, 
        error: `File type ${file.type} is not supported. Allowed types: PDF, DOCX, DOC, Images (JPG, PNG, GIF), TXT, ZIP` 
      };
    }

    return { 
      isValid: true, 
      fileType: file.type, 
      size: file.size 
    };
  }

  async uploadFile(file: File): Promise<IPFSUploadResult> {
    try {
      console.log('🌐 Uploading file to real IPFS via server:', file.name);

      // Convert file to base64 for server upload
      const fileBase64 = await this.fileToBase64(file);
      
      // Upload to real IPFS via server endpoint
      const response = await fetch('/api/upload/ipfs', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          fileBase64,
          fileName: file.name,
          assignmentId: null, // Will be set during submission
          studentAddress: null // Will be set during submission
        })
      });

      if (!response.ok) {
        throw new Error(`Server upload failed: ${response.statusText}`);
      }

      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.error || 'Upload failed');
      }

      console.log('✅ File uploaded to real IPFS:', result);
      
      return {
        hash: result.ipfsHash,
        url: result.gatewayUrl,
        size: result.fileSize,
        gateway: 'gateway.pinata.cloud'
      };
    } catch (error) {
      console.error('❌ Real IPFS upload failed:', error);
      throw error; // Don't fallback to mock - force real uploads
    }
  }

  // Helper function to convert file to base64
  private fileToBase64 = fileToBase64;

  async getFile(hash: string): Promise<Blob> {
    const url = `https://ipfs.io/ipfs/${hash}`;
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`Failed to fetch file from IPFS: ${response.statusText}`);
    }
    
    return await response.blob();
  }

  getGatewayUrl(hash: string): string {
    return `https://ipfs.io/ipfs/${hash}`;
  }

  isValidIPFSHash(hash: string): boolean {
    // Basic IPFS hash validation (CIDv0 or CIDv1)
    return /^(Qm[1-9A-HJ-NP-Za-km-z]{44}|b[A-Za-z2-7]{58}|z[1-9A-HJ-NP-Za-km-z]{48})$/.test(hash);
  }
}

export const ipfsService = new IPFSService();

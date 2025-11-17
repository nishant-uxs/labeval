// Server-side IPFS service using built-in fetch

interface PinataResponse {
  IpfsHash: string;
  PinSize: number;
  Timestamp: string;
}

interface IPFSUploadResult {
  hash: string;
  name: string;
  size: number;
}

export class IPFSService {
  private readonly pinataApiKey: string;
  private readonly pinataSecretKey: string;
  private readonly pinataBaseUrl = 'https://api.pinata.cloud';
  private readonly useMockMode: boolean;

  constructor() {
    this.pinataApiKey = process.env.PINATA_API_KEY || '';
    this.pinataSecretKey = process.env.PINATA_SECRET_KEY || '';
    this.useMockMode = !this.pinataApiKey || !this.pinataSecretKey;
    
    if (this.useMockMode) {
      console.warn('⚠️  IPFS Service running in MOCK MODE - Pinata keys not configured');
      console.warn('📌 For production, set PINATA_API_KEY and PINATA_SECRET_KEY environment variables');
    } else {
      console.log('✅ IPFS Service initialized with Pinata');
    }
  }

  /**
   * Upload file buffer to IPFS via Pinata
   */
  async uploadFile(fileBuffer: Buffer, fileName: string, metadata?: Record<string, any>): Promise<IPFSUploadResult> {
    // Mock mode for development
    if (this.useMockMode) {
      console.log('🔧 MOCK MODE: Simulating IPFS upload for:', fileName);
      const mockHash = `QmMock${Date.now()}${fileName.replace(/\s+/g, '')}`.substring(0, 46);
      return {
        hash: mockHash,
        name: fileName,
        size: fileBuffer.length
      };
    }

    try {
      // Server-side file upload to Pinata using JSON API
      const base64Data = fileBuffer.toString('base64');
      
      const response = await fetch(`${this.pinataBaseUrl}/pinning/pinJSONToIPFS`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'pinata_api_key': this.pinataApiKey,
          'pinata_secret_api_key': this.pinataSecretKey
        },
        body: JSON.stringify({
          pinataContent: {
            fileName: fileName,
            fileData: base64Data,
            contentType: this.getContentType(fileName),
            ...metadata
          },
          pinataMetadata: {
            name: fileName,
            keyvalues: {
              uploadedAt: new Date().toISOString(),
              fileName: fileName,
              ...metadata
            }
          }
        })
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(`Pinata upload failed: ${response.status} ${error}`);
      }

      const result: PinataResponse = await response.json() as PinataResponse;
      
      console.log('✅ File uploaded to IPFS via Pinata:', {
        hash: result.IpfsHash,
        name: fileName,
        size: result.PinSize
      });

      return {
        hash: result.IpfsHash,
        name: fileName,
        size: result.PinSize
      };
    } catch (error) {
      console.error('❌ IPFS upload failed:', error);
      throw new Error(`Failed to upload file to IPFS: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Upload JSON data to IPFS
   */
  async uploadJSON(data: any, name: string): Promise<IPFSUploadResult> {
    try {
      const jsonString = JSON.stringify(data, null, 2);
      const buffer = Buffer.from(jsonString, 'utf-8');
      
      return await this.uploadFile(buffer, `${name}.json`, {
        type: 'application/json',
        uploadedAt: new Date().toISOString()
      });
    } catch (error) {
      console.error('❌ JSON upload to IPFS failed:', error);
      throw new Error(`Failed to upload JSON to IPFS: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Pin existing IPFS hash to Pinata
   */
  async pinHash(ipfsHash: string, name?: string): Promise<void> {
    try {
      const pinData = {
        hashToPin: ipfsHash,
        pinataMetadata: {
          name: name || `Pinned hash ${ipfsHash}`,
          keyvalues: {
            pinnedAt: new Date().toISOString()
          }
        }
      };

      const response = await fetch(`${this.pinataBaseUrl}/pinning/pinByHash`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'pinata_api_key': this.pinataApiKey,
          'pinata_secret_api_key': this.pinataSecretKey
        },
        body: JSON.stringify(pinData)
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(`Pinata pin failed: ${response.status} ${error}`);
      }

      console.log('✅ Hash pinned to Pinata:', ipfsHash);
    } catch (error) {
      console.error('❌ IPFS pin failed:', error);
      throw new Error(`Failed to pin hash to IPFS: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get file content from IPFS
   */
  async getFile(ipfsHash: string): Promise<Buffer> {
    try {
      const response = await fetch(`https://gateway.pinata.cloud/ipfs/${ipfsHash}`);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch file: ${response.status} ${response.statusText}`);
      }

      const arrayBuffer = await response.arrayBuffer();
      return Buffer.from(arrayBuffer);
    } catch (error) {
      console.error('❌ IPFS file fetch failed:', error);
      throw new Error(`Failed to fetch file from IPFS: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get IPFS gateway URL
   */
  getGatewayUrl(ipfsHash: string): string {
    return `https://gateway.pinata.cloud/ipfs/${ipfsHash}`;
  }

  /**
   * Test Pinata connection
   */
  async testConnection(): Promise<boolean> {
    try {
      const response = await fetch(`${this.pinataBaseUrl}/data/testAuthentication`, {
        method: 'GET',
        headers: {
          'pinata_api_key': this.pinataApiKey,
          'pinata_secret_api_key': this.pinataSecretKey
        }
      });

      const result = await response.json();
      console.log('🔍 Pinata connection test:', result);
      
      return response.ok && result.message === 'Congratulations! You are communicating with the Pinata API!';
    } catch (error) {
      console.error('❌ Pinata connection test failed:', error);
      return false;
    }
  }

  /**
   * Get content type based on file extension
   */
  private getContentType(fileName: string): string {
    const ext = fileName.toLowerCase().split('.').pop();
    
    const contentTypes: Record<string, string> = {
      'pdf': 'application/pdf',
      'doc': 'application/msword',
      'docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'txt': 'text/plain',
      'jpg': 'image/jpeg',
      'jpeg': 'image/jpeg',
      'png': 'image/png',
      'gif': 'image/gif',
      'svg': 'image/svg+xml',
      'zip': 'application/zip',
      'json': 'application/json'
    };

    return contentTypes[ext || ''] || 'application/octet-stream';
  }
}

// Export singleton instance
export const ipfsService = new IPFSService();
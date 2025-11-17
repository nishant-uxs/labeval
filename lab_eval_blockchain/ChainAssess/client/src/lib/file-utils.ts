// File utility functions for real IPFS uploads

export function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        // Remove the data URL prefix (e.g., "data:application/pdf;base64,")
        const base64 = reader.result.split(',')[1];
        resolve(base64);
      } else {
        reject(new Error('Failed to convert file to base64'));
      }
    };
    reader.onerror = (error) => reject(error);
  });
}

export function validateFileForUpload(file: File): { isValid: boolean; error?: string } {
  // Supported file types for assignments
  const SUPPORTED_TYPES = [
    'application/pdf',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/msword',
    'image/jpeg',
    'image/png',
    'image/gif',
    'text/plain',
    'application/zip'
  ];

  const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB

  if (!file) {
    return { isValid: false, error: 'No file provided' };
  }

  if (file.size > MAX_FILE_SIZE) {
    return { 
      isValid: false, 
      error: `File size exceeds ${(MAX_FILE_SIZE / 1024 / 1024).toFixed(1)}MB limit` 
    };
  }

  if (!SUPPORTED_TYPES.includes(file.type)) {
    return { 
      isValid: false, 
      error: `File type ${file.type} is not supported. Allowed types: PDF, DOCX, DOC, Images (JPG, PNG, GIF), TXT, ZIP` 
    };
  }

  return { isValid: true };
}
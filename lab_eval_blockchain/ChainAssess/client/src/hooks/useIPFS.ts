import { useState, useCallback } from 'react';
import { ipfsService } from '@/lib/ipfs';
import { IPFSUploadResult } from '@/types/blockchain';

interface UploadState {
  isUploading: boolean;
  progress: number;
  error: string | null;
  result: IPFSUploadResult | null;
}

export function useIPFS() {
  const [uploadState, setUploadState] = useState<UploadState>({
    isUploading: false,
    progress: 0,
    error: null,
    result: null
  });

  const uploadFile = useCallback(async (file: File): Promise<IPFSUploadResult> => {
    setUploadState({
      isUploading: true,
      progress: 0,
      error: null,
      result: null
    });

    try {
      // Simulate progress updates
      const progressInterval = setInterval(() => {
        setUploadState(prev => ({
          ...prev,
          progress: Math.min(prev.progress + 10, 90)
        }));
      }, 200);

      const result = await ipfsService.uploadFile(file);
      
      clearInterval(progressInterval);
      
      setUploadState({
        isUploading: false,
        progress: 100,
        error: null,
        result
      });

      return result;
    } catch (error) {
      setUploadState({
        isUploading: false,
        progress: 0,
        error: error instanceof Error ? error.message : 'Upload failed',
        result: null
      });
      throw error;
    }
  }, []);

  const resetUpload = useCallback(() => {
    setUploadState({
      isUploading: false,
      progress: 0,
      error: null,
      result: null
    });
  }, []);

  const validateFile = useCallback((file: File): { isValid: boolean; error?: string } => {
    const maxSize = 10 * 1024 * 1024; // 10MB
    const allowedTypes = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/zip',
      'application/x-zip-compressed',
      'text/plain'
    ];

    if (file.size > maxSize) {
      return {
        isValid: false,
        error: 'File size must be less than 10MB'
      };
    }

    if (!allowedTypes.includes(file.type)) {
      return {
        isValid: false,
        error: 'File type not supported. Please upload PDF, DOC, DOCX, ZIP, or TXT files.'
      };
    }

    return { isValid: true };
  }, []);

  return {
    uploadState,
    uploadFile,
    resetUpload,
    validateFile
  };
}

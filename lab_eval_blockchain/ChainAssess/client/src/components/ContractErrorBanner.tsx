import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertTriangle } from 'lucide-react';

interface ContractErrorBannerProps {
  error?: string;
  onRetry?: () => void;
}

export function ContractErrorBanner({ error, onRetry }: ContractErrorBannerProps) {
  return (
    <Alert className="border-orange-200 bg-orange-50">
      <AlertTriangle className="h-4 w-4 text-orange-600" />
      <AlertDescription className="text-orange-700">
        <div className="space-y-3">
          <p className="font-medium">Contract Connection Issue</p>
          <p className="text-sm">
            Some smart contracts are not responding properly. This could be due to network issues, 
            contract deployment status, or connectivity problems.
          </p>
          
          <div className="bg-blue-50 p-3 rounded-lg">
            <p className="font-medium text-blue-800 text-sm">💡 Good News!</p>
            <p className="text-blue-700 text-sm">
              The app is using development fallback data, so you can still test all features. 
              Your real blockchain data will appear when contracts are fully connected.
            </p>
          </div>
          
          <div className="flex items-center space-x-2">
            {onRetry && (
              <button
                onClick={onRetry}
                className="bg-orange-600 text-white px-3 py-1 rounded text-sm hover:bg-orange-700 transition-colors"
              >
                🔄 Retry Connection
              </button>
            )}
            <button
              onClick={() => window.location.reload()}
              className="bg-gray-600 text-white px-3 py-1 rounded text-sm hover:bg-gray-700 transition-colors"
            >
              🔄 Refresh Page
            </button>
          </div>
          
          {error && (
            <details className="mt-2">
              <summary className="text-xs cursor-pointer text-gray-600">Technical Details</summary>
              <pre className="text-xs text-gray-500 mt-1 bg-gray-50 p-2 rounded overflow-auto max-h-20">
                {error}
              </pre>
            </details>
          )}
        </div>
      </AlertDescription>
    </Alert>
  );
}
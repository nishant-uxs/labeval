import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Copy, ExternalLink, CheckCircle } from 'lucide-react';
import { useState } from 'react';

interface TransactionPopupProps {
  isOpen: boolean;
  onClose: () => void;
  transactionHash?: string;
  ipfsHash: string;
  fileName: string;
  assignmentTitle: string;
}

export function TransactionPopup({
  isOpen,
  onClose,
  transactionHash,
  ipfsHash,
  fileName,
  assignmentTitle
}: TransactionPopupProps) {
  const [copied, setCopied] = useState<string | null>(null);

  const copyToClipboard = async (text: string, type: string) => {
    await navigator.clipboard.writeText(text);
    setCopied(type);
    setTimeout(() => setCopied(null), 2000);
  };

  const openEtherscan = () => {
    if (transactionHash) {
      window.open(`https://sepolia.etherscan.io/tx/${transactionHash}`, '_blank');
    }
  };

  const openIPFS = () => {
    window.open(`https://ipfs.io/ipfs/${ipfsHash}`, '_blank');
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center space-x-2">
            <CheckCircle className="h-6 w-6 text-green-600" />
            <DialogTitle>Assignment Submitted Successfully!</DialogTitle>
          </div>
          <DialogDescription>
            Your assignment "{assignmentTitle}" has been uploaded to IPFS and recorded on the blockchain.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="flex items-start space-x-3">
              <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-green-800">
                  Submission Complete
                </p>
                <p className="text-sm text-green-700">
                  File: {fileName}
                </p>
                <p className="text-xs text-green-600 mt-1">
                  Your assignment is now waiting for teacher review. Tokens will be awarded after grading.
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <div>
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium text-gray-700">IPFS Hash</label>
                <Badge variant="secondary" className="text-xs">
                  Decentralized Storage
                </Badge>
              </div>
              <div className="flex items-center space-x-2 mt-1">
                <code className="flex-1 text-xs bg-gray-100 p-2 rounded border break-all">
                  {ipfsHash}
                </code>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => copyToClipboard(ipfsHash, 'ipfs')}
                  data-testid="button-copy-ipfs"
                >
                  <Copy className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={openIPFS}
                  data-testid="button-view-ipfs"
                >
                  <ExternalLink className="h-4 w-4" />
                </Button>
              </div>
              {copied === 'ipfs' && (
                <p className="text-xs text-green-600 mt-1">IPFS hash copied!</p>
              )}
            </div>

            {transactionHash && (
              <div>
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium text-gray-700">Transaction Hash</label>
                  <Badge variant="secondary" className="text-xs">
                    Blockchain Record
                  </Badge>
                </div>
                <div className="flex items-center space-x-2 mt-1">
                  <code className="flex-1 text-xs bg-gray-100 p-2 rounded border break-all">
                    {transactionHash}
                  </code>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => copyToClipboard(transactionHash, 'tx')}
                    data-testid="button-copy-transaction"
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={openEtherscan}
                    data-testid="button-view-etherscan-popup"
                  >
                    <ExternalLink className="h-4 w-4" />
                  </Button>
                </div>
                {copied === 'tx' && (
                  <p className="text-xs text-green-600 mt-1">Transaction hash copied!</p>
                )}
              </div>
            )}
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h4 className="font-medium text-blue-800 text-sm mb-2">How to Verify Your Submission:</h4>
            <ol className="text-sm text-blue-700 space-y-1">
              <li>1. Go to <strong>Transaction History</strong> in the sidebar</li>
              <li>2. Click on the <strong>"Verify Hash"</strong> tab</li>
              <li>3. Paste your transaction hash to verify on Etherscan</li>
              <li>4. View your file directly using the IPFS hash</li>
            </ol>
          </div>

          <div className="flex justify-between space-x-3">
            <Button
              variant="outline"
              onClick={() => window.location.hash = '/dashboard/transaction-history'}
              className="flex-1"
              data-testid="button-view-transaction-history"
            >
              View Transaction History
            </Button>
            <Button onClick={onClose} className="flex-1" data-testid="button-close-popup">
              Done
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
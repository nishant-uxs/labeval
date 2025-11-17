import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { TransactionStatus } from '@/types/web3';

interface TransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  transaction: TransactionStatus;
  title?: string;
  description?: string;
}

export function TransactionModal({
  isOpen,
  onClose,
  transaction,
  title = 'Transaction Status',
  description = 'Please wait while your transaction is processed'
}: TransactionModalProps) {
  const getStatusIcon = () => {
    switch (transaction.status) {
      case 'pending':
        return <i className="fas fa-spinner fa-spin text-blue-600 text-2xl"></i>;
      case 'success':
        return <i className="fas fa-check text-green-600 text-2xl"></i>;
      case 'error':
        return <i className="fas fa-times text-red-600 text-2xl"></i>;
      default:
        return <i className="fas fa-clock text-gray-600 text-2xl"></i>;
    }
  };

  const getStatusTitle = () => {
    switch (transaction.status) {
      case 'pending':
        return 'Processing Transaction';
      case 'success':
        return 'Transaction Successful';
      case 'error':
        return 'Transaction Failed';
      default:
        return title;
    }
  };

  const getStatusMessage = () => {
    switch (transaction.status) {
      case 'pending':
        return 'Please confirm the transaction in MetaMask and wait for confirmation';
      case 'success':
        return 'Your transaction has been successfully processed on the blockchain';
      case 'error':
        return transaction.error || 'An error occurred while processing the transaction';
      default:
        return description;
    }
  };

  const getEtherscanUrl = (hash: string) => {
    return `https://sepolia.etherscan.io/tx/${hash}`;
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md" data-testid="transaction-modal">
        <DialogHeader>
          <div className="text-center">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              {getStatusIcon()}
            </div>
            <DialogTitle className="text-lg font-semibold" data-testid="modal-title">
              {getStatusTitle()}
            </DialogTitle>
            <DialogDescription className="mt-2" data-testid="modal-description">
              {getStatusMessage()}
            </DialogDescription>
          </div>
        </DialogHeader>

        <div className="space-y-4">
          {transaction.hash && (
            <div className="text-center">
              <p className="text-sm text-gray-600 mb-2">Transaction Hash:</p>
              <div className="font-mono text-xs text-gray-500 break-all bg-gray-50 p-2 rounded">
                {transaction.hash}
              </div>
              <Button
                variant="outline"
                size="sm"
                className="mt-2"
                asChild
                data-testid="link-view-transaction"
              >
                <a
                  href={getEtherscanUrl(transaction.hash)}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <i className="fas fa-external-link-alt mr-2"></i>
                  View on Etherscan
                </a>
              </Button>
            </div>
          )}

          <div className="flex justify-center">
            <Button
              onClick={onClose}
              className="min-w-[100px]"
              disabled={transaction.status === 'pending'}
              data-testid="button-close-modal"
            >
              {transaction.status === 'pending' ? 'Processing...' : 'Close'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

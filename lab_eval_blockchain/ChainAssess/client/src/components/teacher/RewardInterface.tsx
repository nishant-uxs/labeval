import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useWeb3 } from '@/hooks/useWeb3';
import { contractService } from '@/lib/contracts';
import { web3Service } from '@/lib/web3';

export function RewardInterface() {
  const { executeTransaction, walletState } = useWeb3();
  
  // Token reward form state
  const [tokenForm, setTokenForm] = useState({
    recipient: '',
    amount: '',
    reason: ''
  });
  
  // NFT reward form state
  const [nftForm, setNftForm] = useState({
    recipient: '',
    achievementType: '',
    description: ''
  });
  
  const [errors, setErrors] = useState<{[key: string]: string}>({});

  const validateAddress = (address: string): boolean => {
    return web3Service.isValidAddress(address);
  };

  const handleIssueTokens = async () => {
    const newErrors: {[key: string]: string} = {};
    
    if (!tokenForm.recipient) {
      newErrors.tokenRecipient = 'Recipient address is required';
    } else if (!validateAddress(tokenForm.recipient)) {
      newErrors.tokenRecipient = 'Invalid Ethereum address';
    }
    
    if (!tokenForm.amount || isNaN(Number(tokenForm.amount)) || Number(tokenForm.amount) <= 0) {
      newErrors.tokenAmount = 'Please enter a valid token amount';
    }
    
    if (!tokenForm.reason) {
      newErrors.tokenReason = 'Please select a reason';
    }

    setErrors(newErrors);
    
    if (Object.keys(newErrors).length > 0) {
      return;
    }

    try {
      await executeTransaction(
        () => contractService.mintTokens(
          tokenForm.recipient,
          Number(tokenForm.amount),
          tokenForm.reason
        ),
        'Issue token reward'
      );
      
      // Reset form
      setTokenForm({ recipient: '', amount: '', reason: '' });
      alert(`Successfully issued ${tokenForm.amount} tokens!`);
    } catch (error) {
      console.error('Failed to issue tokens:', error);
      alert('Failed to issue token reward');
    }
  };

  const handleIssueNFT = async () => {
    const newErrors: {[key: string]: string} = {};
    
    if (!nftForm.recipient) {
      newErrors.nftRecipient = 'Recipient address is required';
    } else if (!validateAddress(nftForm.recipient)) {
      newErrors.nftRecipient = 'Invalid Ethereum address';
    }
    
    if (!nftForm.achievementType) {
      newErrors.achievementType = 'Please select an achievement type';
    }
    
    if (!nftForm.description.trim()) {
      newErrors.nftDescription = 'Please provide a description';
    }

    setErrors(newErrors);
    
    if (Object.keys(newErrors).length > 0) {
      return;
    }

    try {
      const achievementNames: {[key: string]: string} = {
        'perfect-score': 'Perfect Score Achievement',
        'innovation': 'Innovation Award',
        'leadership': 'Leadership Excellence',
        'collaboration': 'Best Collaboration',
        'improvement': 'Most Improved Student'
      };

      const name = achievementNames[nftForm.achievementType] || 'Achievement';
      const imageUri = `https://ipfs.io/ipfs/Qm${nftForm.achievementType}Image`; // Mock image

      await executeTransaction(
        () => contractService.mintNFT(
          nftForm.recipient,
          name,
          nftForm.description,
          imageUri
        ),
        'Issue NFT achievement'
      );
      
      // Reset form
      setNftForm({ recipient: '', achievementType: '', description: '' });
      alert('Successfully issued NFT achievement!');
    } catch (error) {
      console.error('Failed to issue NFT:', error);
      alert('Failed to issue NFT achievement');
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
      {/* Token Rewards */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <i className="fas fa-coins mr-2 text-accent"></i>
            Issue Token Rewards
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="token-recipient">Student Address</Label>
            <Input
              id="token-recipient"
              type="text"
              placeholder="0x..."
              value={tokenForm.recipient}
              onChange={(e) => setTokenForm(prev => ({ ...prev, recipient: e.target.value }))}
              className="font-mono"
              data-testid="input-token-recipient"
            />
            {errors.tokenRecipient && (
              <Alert variant="destructive" className="mt-2">
                <AlertDescription>{errors.tokenRecipient}</AlertDescription>
              </Alert>
            )}
          </div>
          
          <div>
            <Label htmlFor="token-amount">Token Amount</Label>
            <Input
              id="token-amount"
              type="number"
              placeholder="100"
              value={tokenForm.amount}
              onChange={(e) => setTokenForm(prev => ({ ...prev, amount: e.target.value }))}
              data-testid="input-token-amount"
            />
            {errors.tokenAmount && (
              <Alert variant="destructive" className="mt-2">
                <AlertDescription>{errors.tokenAmount}</AlertDescription>
              </Alert>
            )}
          </div>
          
          <div>
            <Label htmlFor="token-reason">Reason</Label>
            <Select 
              value={tokenForm.reason} 
              onValueChange={(value) => setTokenForm(prev => ({ ...prev, reason: value }))}
            >
              <SelectTrigger data-testid="select-token-reason">
                <SelectValue placeholder="Select reason..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="timely">Timely Submission</SelectItem>
                <SelectItem value="quality">High Quality Work</SelectItem>
                <SelectItem value="early">Early Submission</SelectItem>
                <SelectItem value="participation">Class Participation</SelectItem>
              </SelectContent>
            </Select>
            {errors.tokenReason && (
              <Alert variant="destructive" className="mt-2">
                <AlertDescription>{errors.tokenReason}</AlertDescription>
              </Alert>
            )}
          </div>
          
          <Button
            onClick={handleIssueTokens}
            className="w-full"
            data-testid="button-issue-tokens"
          >
            <i className="fas fa-paper-plane mr-2"></i>
            Issue Tokens
          </Button>
        </CardContent>
      </Card>

      {/* NFT Rewards */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <i className="fas fa-medal mr-2 text-yellow-600"></i>
            Issue NFT Achievement
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="nft-recipient">Student Address</Label>
            <Input
              id="nft-recipient"
              type="text"
              placeholder="0x..."
              value={nftForm.recipient}
              onChange={(e) => setNftForm(prev => ({ ...prev, recipient: e.target.value }))}
              className="font-mono"
              data-testid="input-nft-recipient"
            />
            {errors.nftRecipient && (
              <Alert variant="destructive" className="mt-2">
                <AlertDescription>{errors.nftRecipient}</AlertDescription>
              </Alert>
            )}
          </div>
          
          <div>
            <Label htmlFor="achievement-type">Achievement Type</Label>
            <Select
              value={nftForm.achievementType}
              onValueChange={(value) => setNftForm(prev => ({ ...prev, achievementType: value }))}
            >
              <SelectTrigger data-testid="select-achievement-type">
                <SelectValue placeholder="Select achievement..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="perfect-score">Perfect Score</SelectItem>
                <SelectItem value="innovation">Innovation Award</SelectItem>
                <SelectItem value="leadership">Leadership</SelectItem>
                <SelectItem value="collaboration">Best Collaboration</SelectItem>
                <SelectItem value="improvement">Most Improved</SelectItem>
              </SelectContent>
            </Select>
            {errors.achievementType && (
              <Alert variant="destructive" className="mt-2">
                <AlertDescription>{errors.achievementType}</AlertDescription>
              </Alert>
            )}
          </div>
          
          <div>
            <Label htmlFor="nft-description">Description</Label>
            <Textarea
              id="nft-description"
              placeholder="Achievement description..."
              value={nftForm.description}
              onChange={(e) => setNftForm(prev => ({ ...prev, description: e.target.value }))}
              rows={3}
              data-testid="textarea-nft-description"
            />
            {errors.nftDescription && (
              <Alert variant="destructive" className="mt-2">
                <AlertDescription>{errors.nftDescription}</AlertDescription>
              </Alert>
            )}
          </div>
          
          <Button
            onClick={handleIssueNFT}
            className="w-full bg-yellow-500 hover:bg-yellow-600"
            data-testid="button-issue-nft"
          >
            <i className="fas fa-award mr-2"></i>
            Issue NFT
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

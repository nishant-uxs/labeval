# EduChain Teacher Access Setup Guide

## Admin Setup (Required First)

### 1. Admin Wallet Setup
- Default admin wallet: `0x742f5cB0d8D69b2B7A6B1234567890123456789a`
- Admin है जो teachers को access देता है
- Smart contract में admin role automatically assigned होता है

### 2. Admin Responsibilities
- Teachers को role grant करना
- Teacher permissions revoke करना
- Contract deployment और management
- System-wide permissions control

## Teacher Access Process

### Step 1: Admin logs in
1. Admin wallet से MetaMask connect करें
2. Admin Dashboard में जाएं
3. "Assign Teachers" section में जाएं

### Step 2: Grant Teacher Role
1. Teacher का wallet address डालें
2. "Teacher बनाएं" button click करें
3. MetaMask में transaction confirm करें
4. Blockchain पर teacher role permanent हो जाएगा

### Step 3: Teacher Access
1. Teacher अपना wallet connect करे
2. Automatic role verification होगा
3. Teacher dashboard unlock हो जाएगा
4. Batch management, grading सब accessible होगा

## Default Addresses for Testing

### Admin Addresses
- `0x742f5cB0d8D69b2B7A6B1234567890123456789a` (Primary Admin)

### Pre-configured Teachers
- `0xc39d22dc2d0a3ca341ce8f69efa563d113607688` (Test Teacher 1)
- `0x742f5cB0d8D69b2B7A6B1234567890123456789a` (Test Teacher 2)

## Access Flow Diagram

```
Admin Wallet → Connect → Admin Dashboard → Assign Teachers → Teacher Access
```

## Important Notes

1. **Admin Required**: Teacher role assign करने के लिए admin access जरूरी है
2. **Blockchain Verification**: सभी roles blockchain पर verify होते हैं
3. **Permanent Changes**: Role changes permanent होते हैं
4. **Real Contracts**: यह actual smart contracts के साथ काम करता है

## Troubleshooting

### Teacher Access Denied?
1. Check admin ने teacher role grant किया है या नहीं
2. Wallet address सही है या नहीं
3. MetaMask सही network (Sepolia) पर है या नहीं

### Admin Functions Not Working?
1. Admin wallet से connected हैं या नहीं
2. Smart contract addresses correct हैं या नहीं
3. Sufficient ETH for gas fees है या नहीं
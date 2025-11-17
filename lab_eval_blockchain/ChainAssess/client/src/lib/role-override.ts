// Temporary role override for immediate testing
// This will force the correct role recognition while we fix the blockchain integration

export function getOverrideRole(address: string): string | null {
  if (!address) return null;
  
  const normalizedAddress = address.toLowerCase();
  
  // Force teacher role for the test address (this should be primary role)
  if (normalizedAddress === '0xc39d22dc2d0a3ca341ce8f69efa563d113607688') {
    console.log(`🔥 FORCING TEACHER ROLE for ${address}`);
    return 'teacher';
  }
  
  // Force admin role for admin address  
  if (normalizedAddress === '0x742f5cb0d8d69b2b7a6b1234567890123456789a') {
    console.log(`🔥 FORCING ADMIN ROLE for ${address}`);
    return 'admin';
  }
  
  return null;
}
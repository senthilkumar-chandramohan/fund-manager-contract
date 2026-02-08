# Quick Start Guide - FundManager Deployment API

## Overview

This Express API server allows you to deploy FundManager contracts on demand. Simply make a POST request with your deployment parameters and get back a deployed contract address.

## Quick Setup (3 minutes)

### 1. Install Dependencies
```bash
npm install
```

### 2. Setup Environment
```bash
# Copy the example env file
cp .env.example .env

# Edit .env with your configuration
# - RPC_URL: Your Ethereum RPC endpoint (e.g., https://sepolia.infura.io/v3/YOUR_KEY)
# - PRIVATE_KEY: The private key of the deployer account
```

### 3. Start the Server
```bash
# Development mode (with hot reload)
npm run server

# Or production mode
npm run build
npm start
```

You should see:
```
🚀 FundManager Deployment API server running on port 3000
📚 API documentation available at http://localhost:3000
```

## Simple Example Usage

### Using cURL
```bash
curl -X POST http://localhost:3000/deploy \
  -H "Content-Type: application/json" \
  -d '{
    "beneficiaryAddresses": ["0xbDA5747bFD65F08deb54cb465eB87D40e51B197E", "0xdD2FD4581271e230360230F9337D5c0430Bf44C0"],
    "sharePercentages": [5000, 5000],
    "tokenAddress": "0xCaC524BcA292aaade2DF8A05cC58F0a65B1B3bB9",
    "releaseAmount": "1000000",
    "releaseInterval": "2592000",
    "fundMaturityDate": "1769904000",
    "causeName": "Test Fund",
    "causeDescription": "A test fund",
    "governors": ["0x1234567890123456789012345678901234567890", "0x0987654321098765432109876543210987654321"],
    "requiredNumberofApprovals": "2",
    "timesEmergencyWithdrawalAllowed": "5",
    "limitPerEmergencyWithdrawal": "1000000000",
    "totalLimitForEmergencyWithdrawal": "5000000000"
  }'
```

### Using JavaScript/Node.js
```javascript
const response = await fetch('http://localhost:3000/deploy', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    beneficiaryAddresses: ['0xbDA5747bFD65F08deb54cb465eB87D40e51B197E'],
    sharePercentages: [10000],
    tokenAddress: '0xCaC524BcA292aaade2DF8A05cC58F0a65B1B3bB9',
    releaseAmount: '1000000',
    releaseInterval: '2592000',
    fundMaturityDate: Math.floor(Date.now() / 1000) + 31536000,
    causeName: 'My Fund',
    causeDescription: 'My fund description',
    governors: ['0x1234567890123456789012345678901234567890'],
    requiredNumberofApprovals: '1',
    timesEmergencyWithdrawalAllowed: '5',
    limitPerEmergencyWithdrawal: '1000000000',
    totalLimitForEmergencyWithdrawal: '5000000000'
  })
});

const result = await response.json();
console.log('Contract Address:', result.contractAddress);
```

## API Endpoints

### Documentation
```
GET http://localhost:3000/
```
Returns all available endpoints and their parameters.

### Health Check
```
GET http://localhost:3000/health
```

### Deploy Contract
```
POST http://localhost:3000/deploy
```

**Required Parameters:**
- `beneficiaryAddresses`: Array of wallet addresses (must match sharePercentages length)
- `sharePercentages`: Array of basis points (must sum to 10000)
- `tokenAddress`: ERC20 token address
- `releaseAmount`: Initial release amount (string)
- `releaseInterval`: Interval between releases in seconds (string)
- `fundMaturityDate`: Unix timestamp when fund matures (string)
- `causeName`: Name of the fund
- `causeDescription`: Description of the fund
- `governors`: Array of governor addresses
- `requiredNumberofApprovals`: Approvals needed for emergency withdrawals (string)
- `timesEmergencyWithdrawalAllowed`: Max emergency withdrawals allowed (string)
- `limitPerEmergencyWithdrawal`: Max amount per withdrawal (string)
- `totalLimitForEmergencyWithdrawal`: Total withdrawal limit (string)

**Optional Parameters:**
- `rpcUrl`: Override RPC URL from environment
- `privateKey`: Override private key from environment

**Response:**
```json
{
  "success": true,
  "contractAddress": "0x1234567890123456789012345678901234567890",
  "transactionHash": "0xabcdef..."
}
```

## Common Issues

### "RPC URL must be provided"
Make sure you've set `RPC_URL` in your `.env` file or pass `rpcUrl` in the request.

### "Private key must be provided"
Make sure you've set `PRIVATE_KEY` in your `.env` file or pass `privateKey` in the request.

### "Total share percentages must equal 10000"
Ensure your sharePercentages array adds up to exactly 10000 (100%). For example:
- Two beneficiaries: [5000, 5000]
- Three beneficiaries: [5000, 3000, 2000]

### "Fund maturity date must be in the future"
Set fundMaturityDate to a Unix timestamp in the future. For 1 year from now:
```javascript
Math.floor(Date.now() / 1000) + (365 * 24 * 60 * 60)
```

## Testing

Run the example client:
```bash
npx ts-node src/example.ts
```

This will:
1. Check server health
2. Fetch API documentation
3. Deploy a test FundManager contract

## See Also

- [API_SERVER_GUIDE.md](./API_SERVER_GUIDE.md) - Detailed API documentation
- [contracts/FundManager.sol](./contracts/FundManager.sol) - Smart contract source code
- [ignition/modules/FundManager.ts](./ignition/modules/FundManager.ts) - Deployment module

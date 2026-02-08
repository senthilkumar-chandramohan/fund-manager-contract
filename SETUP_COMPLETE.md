# FundManager Deployment API - Complete Setup

Your Express.js REST API server for deploying FundManager contracts has been successfully created! 🎉

## What Was Created

### 📁 Project Structure
```
fund-manager-contract/
├── src/
│   ├── server.ts          # Main Express server
│   ├── example.ts         # Example client for testing
│   └── tests.ts           # Test case examples
├── dist/                  # Compiled JavaScript output
├── contracts/
│   └── FundManager.sol    # Smart contract (already existed)
├── package.json           # Updated with new dependencies
├── tsconfig.json          # Updated TypeScript config
├── .env.example           # Environment variables template
├── API_SERVER_GUIDE.md    # Detailed API documentation
├── QUICK_START.md         # Quick start guide
└── README.md              # Server setup instructions
```

### 📦 New Dependencies Added
- **express**: Web framework for REST API
- **ethers**: Library for Ethereum interactions
- **dotenv**: Environment variable management
- **typescript**: Type-safe JavaScript
- **ts-node**: Run TypeScript directly
- **@types/node & @types/express**: Type definitions

## 🚀 Getting Started

### 1. Configure Environment
```bash
# Copy the template
cp .env.example .env

# Edit with your configuration
# RPC_URL=https://sepolia.infura.io/v3/YOUR_KEY
# PRIVATE_KEY=your_private_key_here
# PORT=3000
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Start the Server
```bash
# Development (with hot reload)
npm run server

# Production
npm run build
npm start
```

### 4. Test the API
```bash
# In another terminal, test a deployment
curl -X POST http://localhost:3000/deploy \
  -H "Content-Type: application/json" \
  -d '{
    "beneficiaryAddresses": ["0xbDA5747bFD65F08deb54cb465eB87D40e51B197E"],
    "sharePercentages": [10000],
    "tokenAddress": "0xCaC524BcA292aaade2DF8A05cC58F0a65B1B3bB9",
    "releaseAmount": "1000000",
    "releaseInterval": "2592000",
    "fundMaturityDate": "1769904000",
    "causeName": "Test Fund",
    "causeDescription": "Test",
    "governors": ["0x1234567890123456789012345678901234567890"],
    "requiredNumberofApprovals": "1",
    "timesEmergencyWithdrawalAllowed": "5",
    "limitPerEmergencyWithdrawal": "1000000000",
    "totalLimitForEmergencyWithdrawal": "5000000000"
  }'
```

## 🔌 API Endpoints

### POST /deploy
Deploy a new FundManager contract with your parameters.

**Parameters:**
- `beneficiaryAddresses`: Wallet addresses to receive funds
- `sharePercentages`: Distribution percentages (basis points, must sum to 10000)
- `tokenAddress`: ERC20 token contract address
- `releaseAmount`: Amount to release initially
- `releaseInterval`: Time between releases (in seconds)
- `fundMaturityDate`: When fund can be accessed (Unix timestamp)
- `causeName`: Name of the fund/cause
- `causeDescription`: Description of the fund/cause
- `governors`: Multi-sig signers for emergency withdrawals
- `requiredNumberofApprovals`: Signatures needed for withdrawal
- `timesEmergencyWithdrawalAllowed`: Maximum emergency withdrawals
- `limitPerEmergencyWithdrawal`: Max amount per withdrawal
- `totalLimitForEmergencyWithdrawal`: Total emergency withdrawal limit

**Response:**
```json
{
  "success": true,
  "contractAddress": "0x1234567890123456789012345678901234567890",
  "transactionHash": "0xabcdef..."
}
```

### GET /
API documentation and available endpoints.

### GET /health
Health check - returns `{"status":"OK","timestamp":"..."}`

## 📝 Key Features

✅ **On-Demand Deployment**: Deploy contracts with custom parameters via API  
✅ **Parameter Validation**: Comprehensive validation of all inputs  
✅ **Multi-Sig Support**: Configure governance requirements  
✅ **Error Handling**: Clear error messages for validation failures  
✅ **TypeScript**: Full type safety throughout  
✅ **Environment Config**: Secure private key management via `.env`  
✅ **Ready for Production**: Production-ready build and deployment scripts  

## 🛠️ Usage Examples

### JavaScript/Node.js
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
console.log('Deployed at:', result.contractAddress);
```

### Python
```python
import requests
import time

url = 'http://localhost:3000/deploy'
payload = {
    'beneficiaryAddresses': ['0xbDA5747bFD65F08deb54cb465eB87D40e51B197E'],
    'sharePercentages': [10000],
    'tokenAddress': '0xCaC524BcA292aaade2DF8A05cC58F0a65B1B3bB9',
    'releaseAmount': '1000000',
    'releaseInterval': '2592000',
    'fundMaturityDate': str(int(time.time()) + 31536000),
    'causeName': 'My Fund',
    'causeDescription': 'My fund description',
    'governors': ['0x1234567890123456789012345678901234567890'],
    'requiredNumberofApprovals': '1',
    'timesEmergencyWithdrawalAllowed': '5',
    'limitPerEmergencyWithdrawal': '1000000000',
    'totalLimitForEmergencyWithdrawal': '5000000000'
}

response = requests.post(url, json=payload)
result = response.json()
print(f"Deployed at: {result['contractAddress']}")
```

## ⚙️ Environment Variables

Create a `.env` file with:
```
RPC_URL=https://sepolia.infura.io/v3/YOUR_API_KEY
PRIVATE_KEY=your_wallet_private_key
PORT=3000
```

**Security Note**: Never commit `.env` to version control!

## 📚 Validation Rules

✓ Beneficiary count must match share percentages count  
✓ Share percentages must sum to exactly 10000 (100%)  
✓ All Ethereum addresses must be valid checksummed addresses  
✓ Fund maturity date must be in the future  
✓ Required approvals must be ≤ number of governors  
✓ At least one governor is required  

## 🔒 Security Considerations

1. **Environment Variables**: Store sensitive data in `.env` (never in code)
2. **Private Keys**: Use environment variables, never hardcode
3. **HTTPS Only**: Use HTTPS in production
4. **Rate Limiting**: Consider adding rate limiting for production
5. **Access Control**: Implement authentication/authorization in production
6. **Input Validation**: All inputs are validated server-side

## 📖 Additional Documentation

- [QUICK_START.md](./QUICK_START.md) - Fast setup guide
- [API_SERVER_GUIDE.md](./API_SERVER_GUIDE.md) - Detailed API reference

## 🧪 Testing

Run the example test client:
```bash
npx ts-node src/example.ts
```

## 📋 npm Scripts

```bash
npm run server      # Start dev server with hot reload
npm run build       # Compile TypeScript
npm start           # Run compiled server
npm test            # Run tests (configure as needed)
```

## 🎯 Next Steps

1. ✅ Set up `.env` file with your RPC and private key
2. ✅ Run `npm install`
3. ✅ Run `npm run server` to start the API
4. ✅ Test with a POST request to `/deploy`
5. ✅ Deploy to your server (Heroku, AWS, etc.)

## 📞 Troubleshooting

### "RPC URL must be provided"
→ Set `RPC_URL` in `.env` or pass `rpcUrl` in request

### "Private key must be provided"
→ Set `PRIVATE_KEY` in `.env` or pass `privateKey` in request

### "Share percentages must equal 10000"
→ Ensure sharePercentages array sums to exactly 10000

### "Fund maturity date must be in the future"
→ Use a Unix timestamp greater than current time

### Compilation errors
→ Run `npm install` and `npm run build` again

## 🎉 Summary

Your FundManager Deployment API is ready to use! You now have:

- ✅ Express.js REST API server
- ✅ Ethers.js contract deployment integration
- ✅ Comprehensive parameter validation
- ✅ TypeScript for type safety
- ✅ Environment configuration support
- ✅ Detailed API documentation
- ✅ Example client code
- ✅ Test case examples
- ✅ Production-ready build setup

Start deploying FundManager contracts on demand! 🚀

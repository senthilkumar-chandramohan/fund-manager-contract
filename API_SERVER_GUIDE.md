# FundManager Deployment API

A REST API server for deploying FundManager contracts on-demand with specified parameters.

## Setup

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure Environment Variables

Create a `.env` file based on `.env.example`:

```bash
cp .env.example .env
```

Update `.env` with your:
- `RPC_URL`: Your Ethereum RPC endpoint (e.g., Infura, Alchemy, or local node)
- `PRIVATE_KEY`: Private key of the account that will deploy contracts
- `PORT`: Server port (optional, defaults to 3000)

### 3. Run the Server

#### Development Mode (with hot reload):
```bash
npm run server
```

#### Production Mode:
```bash
npm run build
npm start
```

## API Endpoints

### GET / - API Documentation
Returns information about all available endpoints and their parameters.

```bash
curl http://localhost:3000/
```

### GET /health - Health Check
Check if the server is running.

```bash
curl http://localhost:3000/health
```

### POST /deploy - Deploy FundManager Contract

Deploy a new FundManager contract with the specified parameters.

**Request Headers:**
```
Content-Type: application/json
```

**Request Body:**
```json
{
  "beneficiaryAddresses": ["0xbDA5747bFD65F08deb54cb465eB87D40e51B197E", "0xdD2FD4581271e230360230F9337D5c0430Bf44C0"],
  "sharePercentages": [5000, 5000],
  "tokenAddress": "0xCaC524BcA292aaade2DF8A05cC58F0a65B1B3bB9",
  "releaseAmount": "1000000",
  "releaseInterval": "2592000",
  "fundMaturityDate": "1769904000",
  "causeName": "Test Fund",
  "causeDescription": "This is a test fund",
  "governors": ["0x1234567890123456789012345678901234567890", "0x0987654321098765432109876543210987654321"],
  "requiredNumberofApprovals": "2",
  "timesEmergencyWithdrawalAllowed": "5",
  "limitPerEmergencyWithdrawal": "1000000000",
  "totalLimitForEmergencyWithdrawal": "5000000000"
}
```

**Optional Parameters** (can override environment variables):
- `rpcUrl`: RPC endpoint URL
- `privateKey`: Private key for signing

**Response (Success - 201):**
```json
{
  "success": true,
  "contractAddress": "0x1234567890123456789012345678901234567890",
  "transactionHash": "0xabcdef..."
}
```

**Response (Error - 400/500):**
```json
{
  "success": false,
  "error": "Error message describing what went wrong"
}
```

## Example Curl Request

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
    "causeName": "Education Fund",
    "causeDescription": "Fund for educational initiatives",
    "governors": ["0x1234567890123456789012345678901234567890", "0x0987654321098765432109876543210987654321"],
    "requiredNumberofApprovals": "2",
    "timesEmergencyWithdrawalAllowed": "5",
    "limitPerEmergencyWithdrawal": "1000000000",
    "totalLimitForEmergencyWithdrawal": "5000000000"
  }'
```

## Parameter Details

| Parameter | Type | Description |
|-----------|------|-------------|
| `beneficiaryAddresses` | string[] | Array of beneficiary wallet addresses |
| `sharePercentages` | number[] | Share percentages in basis points (10000 = 100%). Must sum to 10000. |
| `tokenAddress` | string | ERC20 token contract address |
| `releaseAmount` | string | Initial release amount (with 6 decimals, e.g., 1000000 = 1 token) |
| `releaseInterval` | string | Release interval in seconds (e.g., 2592000 = 30 days) |
| `fundMaturityDate` | string | Unix timestamp when the fund becomes mature |
| `causeName` | string | Name of the cause/fund |
| `causeDescription` | string | Description of the cause/fund |
| `governors` | string[] | Array of governor addresses (for multi-sig approvals) |
| `requiredNumberofApprovals` | string | Number of approvals required for emergency withdrawals |
| `timesEmergencyWithdrawalAllowed` | string | Maximum number of emergency withdrawals allowed |
| `limitPerEmergencyWithdrawal` | string | Maximum amount per single emergency withdrawal |
| `totalLimitForEmergencyWithdrawal` | string | Total limit across all emergency withdrawals |

## Validation Rules

- Beneficiary addresses and share percentages must have the same length
- Total share percentages must equal 10000 (100%)
- Fund maturity date must be in the future
- All Ethereum addresses must be valid
- Required approvals must be between 1 and the number of governors
- Number of governors must be at least 1

## Error Codes

| Code | Reason |
|------|--------|
| 201 | Contract deployed successfully |
| 400 | Invalid request parameters or validation failed |
| 500 | Server error during deployment |

## Development Notes

- The server uses TypeScript for type safety
- Contract deployment is performed asynchronously
- All numeric values for blockchain parameters should be passed as strings to avoid precision issues
- Private keys should never be exposed in logs or error messages

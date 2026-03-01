import express, { Request, Response } from 'express';
import { ethers } from 'ethers';
import dotenv from 'dotenv';
import FundManagerABI from '../artifacts/contracts/FundManager.sol/FundManager.json';

dotenv.config();

const app = express();
app.use(express.json());

// Types
interface DeploymentRequest {
  beneficiaryAddresses: string[];
  sharePercentages: number[];
  tokenAddress: string;
  releaseAmount: string;
  fundMaturityDate: string;
  causeName: string;
  causeDescription: string;
  governors: string[];
  requiredNumberofApprovals: string;
  timesEmergencyWithdrawalAllowed: string;
  limitPerEmergencyWithdrawal: string;
  totalLimitForEmergencyWithdrawal: string;
  rpcUrl?: string;
  privateKey?: string;
}

interface DeploymentResponse {
  success: boolean;
  contractAddress?: string;
  transactionHash?: string;
  error?: string;
}

// Validate deployment parameters
function validateDeploymentParams(params: DeploymentRequest): string | null {
  if (!params.beneficiaryAddresses || params.beneficiaryAddresses.length === 0) {
    return 'Beneficiary addresses are required';
  }

  if (!params.sharePercentages || params.sharePercentages.length === 0) {
    return 'Share percentages are required';
  }

  if (params.beneficiaryAddresses.length !== params.sharePercentages.length) {
    return 'Beneficiary addresses and share percentages must have the same length';
  }

  const totalShares = params.sharePercentages.reduce((a, b) => a + b, 0);
  if (totalShares !== 10000) {
    return `Total share percentages must equal 10000 (100%), got ${totalShares}`;
  }

  if (!ethers.isAddress(params.tokenAddress)) {
    return 'Invalid token address';
  }

  params.beneficiaryAddresses.forEach((addr) => {
    if (!ethers.isAddress(addr)) {
      throw new Error(`Invalid beneficiary address: ${addr}`);
    }
  });

  if (!params.governors || params.governors.length === 0) {
    return 'Governors are required';
  }

  params.governors.forEach((addr) => {
    if (!ethers.isAddress(addr)) {
      throw new Error(`Invalid governor address: ${addr}`);
    }
  });

  const requiredApprovals = parseInt(params.requiredNumberofApprovals);
  if (requiredApprovals <= 0 || requiredApprovals > params.governors.length) {
    return `Required approvals must be between 1 and ${params.governors.length}`;
  }

  const fundMaturityDate = parseInt(params.fundMaturityDate);
  if (fundMaturityDate <= Math.floor(Date.now() / 1000)) {
    return 'Fund maturity date must be in the future';
  }

  return null;
}

/**
 * POST /deploy
 * Deploy a new FundManager contract
 *
 * Request body:
 * {
 *   beneficiaryAddresses: string[]
 *   sharePercentages: number[]
 *   tokenAddress: string
 *   releaseAmount: string
 *   fundMaturityDate: string (unix timestamp)
 *   causeName: string
 *   causeDescription: string
 *   governors: string[]
 *   requiredNumberofApprovals: string
 *   timesEmergencyWithdrawalAllowed: string
 *   limitPerEmergencyWithdrawal: string
 *   totalLimitForEmergencyWithdrawal: string
 *   rpcUrl?: string (defaults to env RPC_URL)
 *   privateKey?: string (defaults to env PRIVATE_KEY)
 * }
 */
app.post('/deploy', async (req: Request, res: Response): Promise<void> => {
  try {
    const params = req.body as DeploymentRequest;

    // Validate parameters
    const validationError = validateDeploymentParams(params);
    if (validationError) {
      res.status(400).json({
        success: false,
        error: validationError,
      } as DeploymentResponse);
      return;
    }

    console.log("Validation completed");
    console.log("RPC URL", process.env.RPC_URL);
    console.log("Private Key", process.env.PRIVATE_KEY);

    // Get RPC URL and private key from request or environment
    const rpcUrl = params.rpcUrl || process.env.RPC_URL;
    const privateKey = params.privateKey || process.env.PRIVATE_KEY;

    if (!rpcUrl) {
      res.status(400).json({
        success: false,
        error: 'RPC URL must be provided in request or RPC_URL environment variable',
      } as DeploymentResponse);
      return;
    }

    if (!privateKey) {
      res.status(400).json({
        success: false,
        error: 'Private key must be provided in request or PRIVATE_KEY environment variable',
      } as DeploymentResponse);
      return;
    }

    // Setup provider and signer
    const provider = new ethers.JsonRpcProvider(rpcUrl);
    const signer = new ethers.Wallet(privateKey, provider);

    // Create contract factory
    const contractFactory = new ethers.ContractFactory(
      FundManagerABI.abi,
      FundManagerABI.bytecode,
      signer
    );

    // Convert parameters to appropriate BigInt values
    const deploymentArgs = [
      params.beneficiaryAddresses,
      params.sharePercentages.map((p) => BigInt(p)),
      params.tokenAddress,
      BigInt(params.releaseAmount),
      BigInt(params.fundMaturityDate),
      params.causeName,
      params.causeDescription,
      params.governors,
      BigInt(params.requiredNumberofApprovals),
      BigInt(params.timesEmergencyWithdrawalAllowed),
      BigInt(params.limitPerEmergencyWithdrawal),
      BigInt(params.totalLimitForEmergencyWithdrawal),
    ];

    console.log('Deploying FundManager contract...');
    const contract = await contractFactory.deploy(...deploymentArgs);
    const deploymentTx = contract.deploymentTransaction();

    if (!deploymentTx) {
      throw new Error('Failed to get deployment transaction');
    }

    console.log(`Contract deployment initiated. Tx hash: ${deploymentTx.hash}`);

    // Wait for contract deployment to complete
    const deployedContract = await contract.waitForDeployment();
    const contractAddress = await deployedContract.getAddress();

    console.log(`Contract deployed successfully at: ${contractAddress}`);

    res.status(201).json({
      success: true,
      contractAddress,
      transactionHash: deploymentTx.hash,
    } as DeploymentResponse);
  } catch (error: unknown) {
    console.error('Deployment error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    res.status(500).json({
      success: false,
      error: errorMessage,
    } as DeploymentResponse);
  }
});

/**
 * GET /health
 * Health check endpoint
 */
app.get('/health', (req: Request, res: Response): void => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

/**
 * GET /
 * API documentation
 */
app.get('/', (req: Request, res: Response): void => {
  res.json({
    name: 'FundManager Deployment API',
    version: '1.0.0',
    endpoints: {
      'POST /deploy': {
        description: 'Deploy a new FundManager contract',
        parameters: {
          beneficiaryAddresses: 'string[] - Array of beneficiary wallet addresses',
          sharePercentages: 'number[] - Array of share percentages in basis points (10000 = 100%)',
          tokenAddress: 'string - ERC20 token contract address',
          releaseAmount: 'string - Initial release amount in fiat currency with 6 decimals',
          fundMaturityDate: 'string - Fund maturity date as unix timestamp',
          causeName: 'string - Name of the cause/fund',
          causeDescription: 'string - Description of the cause/fund',
          governors: 'string[] - Array of governor addresses for multi-sig',
          requiredNumberofApprovals: 'string - Number of approvals required for withdrawals',
          timesEmergencyWithdrawalAllowed: 'string - Number of emergency withdrawals allowed',
          limitPerEmergencyWithdrawal: 'string - Maximum amount per emergency withdrawal',
          totalLimitForEmergencyWithdrawal: 'string - Total limit for all emergency withdrawals',
          rpcUrl: 'string (optional) - RPC endpoint URL',
          privateKey: 'string (optional) - Private key for signing transactions',
        },
        example: {
          beneficiaryAddresses: [
            '0xbDA5747bFD65F08deb54cb465eB87D40e51B197E',
            '0xdD2FD4581271e230360230F9337D5c0430Bf44C0',
          ],
          sharePercentages: [5000, 5000],
          tokenAddress: '0xCaC524BcA292aaade2DF8A05cC58F0a65B1B3bB9',
          releaseAmount: '1000000',
          fundMaturityDate: '1769904000',
          causeName: 'Test Fund',
          causeDescription: 'This is a test fund',
          governors: [
            '0x1234567890123456789012345678901234567890',
            '0x0987654321098765432109876543210987654321',
          ],
          requiredNumberofApprovals: '2',
          timesEmergencyWithdrawalAllowed: '5',
          limitPerEmergencyWithdrawal: '1000000000',
          totalLimitForEmergencyWithdrawal: '5000000000',
        },
      },
      'GET /health': {
        description: 'Health check endpoint',
      },
      'GET /': {
        description: 'API documentation',
      },
    },
  });
});

const PORT = process.env.PORT || 4000;

app.listen(PORT, () => {
  console.log(`🚀 FundManager Deployment API server running on port ${PORT}`);
  console.log(`📚 API documentation available at http://localhost:${PORT}`);
});

export default app;

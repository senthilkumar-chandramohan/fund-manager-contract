"use strict";
/**
 * Example client for testing the FundManager Deployment API
 *
 * Run with: npx ts-node src/example.ts
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const node_fetch_1 = __importDefault(require("node-fetch"));
const API_BASE_URL = process.env.API_URL || 'http://localhost:3000';
async function deployFundManager() {
    try {
        const deploymentRequest = {
            beneficiaryAddresses: [
                '0xbDA5747bFD65F08deb54cb465eB87D40e51B197E',
                '0xdD2FD4581271e230360230F9337D5c0430Bf44C0',
                '0x8626f6940E2eb28930eFb4CeF49B2d1F2C9C1199',
            ],
            sharePercentages: [5000, 3000, 2000], // 50%, 30%, 20%
            tokenAddress: '0xCaC524BcA292aaade2DF8A05cC58F0a65B1B3bB9',
            releaseAmount: '1000000', // 1 token (with 6 decimals)
            releaseInterval: String(30 * 24 * 60 * 60), // 30 days in seconds
            fundMaturityDate: String(Math.floor(Date.now() / 1000) + 365 * 24 * 60 * 60), // 1 year from now
            causeName: 'Education Initiative Fund',
            causeDescription: 'A fund dedicated to supporting educational programs and scholarships',
            governors: [
                '0x1234567890123456789012345678901234567890',
                '0x0987654321098765432109876543210987654321',
                '0xabcdefabcdefabcdefabcdefabcdefabcdefabcd',
            ],
            requiredNumberofApprovals: '2', // 2 out of 3 governors must approve
            timesEmergencyWithdrawalAllowed: '5',
            limitPerEmergencyWithdrawal: '1000000000', // 1000 tokens
            totalLimitForEmergencyWithdrawal: '5000000000', // 5000 tokens total
        };
        console.log('🚀 Deploying FundManager contract...');
        console.log('Request parameters:', JSON.stringify(deploymentRequest, null, 2));
        const response = await (0, node_fetch_1.default)(`${API_BASE_URL}/deploy`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(deploymentRequest),
        });
        const data = (await response.json());
        if (response.ok && data.success) {
            console.log('\n✅ Contract deployed successfully!');
            console.log(`📍 Contract Address: ${data.contractAddress}`);
            console.log(`📜 Transaction Hash: ${data.transactionHash}`);
        }
        else {
            console.error('\n❌ Deployment failed!');
            console.error(`Error: ${data.error}`);
        }
    }
    catch (error) {
        console.error('Error:', error);
    }
}
async function checkHealth() {
    try {
        const response = await (0, node_fetch_1.default)(`${API_BASE_URL}/health`);
        const data = await response.json();
        console.log('✅ Server is healthy:', data);
    }
    catch (error) {
        console.error('❌ Server is not responding:', error);
    }
}
async function getDocumentation() {
    try {
        const response = await (0, node_fetch_1.default)(`${API_BASE_URL}/`);
        const data = await response.json();
        console.log('📚 API Documentation:');
        console.log(JSON.stringify(data, null, 2));
    }
    catch (error) {
        console.error('Error fetching documentation:', error);
    }
}
// Main execution
async function main() {
    console.log('FundManager Deployment API - Example Client\n');
    // Check health first
    await checkHealth();
    console.log('\n');
    // Show documentation
    await getDocumentation();
    console.log('\n');
    // Deploy contract
    await deployFundManager();
}
main();
//# sourceMappingURL=example.js.map
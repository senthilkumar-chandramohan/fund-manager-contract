/**
 * Test suite examples for the FundManager Deployment API
 *
 * These are example test cases you can adapt to your testing framework
 * (Jest, Mocha, Vitest, etc.)
 */
export declare const testValidDeployment: {
    name: string;
    request: {
        beneficiaryAddresses: string[];
        sharePercentages: number[];
        tokenAddress: string;
        releaseAmount: string;
        releaseInterval: string;
        fundMaturityDate: string;
        causeName: string;
        causeDescription: string;
        governors: string[];
        requiredNumberofApprovals: string;
        timesEmergencyWithdrawalAllowed: string;
        limitPerEmergencyWithdrawal: string;
        totalLimitForEmergencyWithdrawal: string;
    };
    expectedStatus: number;
    expectedFields: string[];
};
export declare const testMismatchedLengths: {
    name: string;
    request: {
        beneficiaryAddresses: string[];
        sharePercentages: number[];
        tokenAddress: string;
        releaseAmount: string;
        releaseInterval: string;
        fundMaturityDate: string;
        causeName: string;
        causeDescription: string;
        governors: string[];
        requiredNumberofApprovals: string;
        timesEmergencyWithdrawalAllowed: string;
        limitPerEmergencyWithdrawal: string;
        totalLimitForEmergencyWithdrawal: string;
    };
    expectedStatus: number;
    expectedError: string;
};
export declare const testInvalidShares: {
    name: string;
    request: {
        beneficiaryAddresses: string[];
        sharePercentages: number[];
        tokenAddress: string;
        releaseAmount: string;
        releaseInterval: string;
        fundMaturityDate: string;
        causeName: string;
        causeDescription: string;
        governors: string[];
        requiredNumberofApprovals: string;
        timesEmergencyWithdrawalAllowed: string;
        limitPerEmergencyWithdrawal: string;
        totalLimitForEmergencyWithdrawal: string;
    };
    expectedStatus: number;
    expectedError: string;
};
export declare const testPastMaturityDate: {
    name: string;
    request: {
        beneficiaryAddresses: string[];
        sharePercentages: number[];
        tokenAddress: string;
        releaseAmount: string;
        releaseInterval: string;
        fundMaturityDate: string;
        causeName: string;
        causeDescription: string;
        governors: string[];
        requiredNumberofApprovals: string;
        timesEmergencyWithdrawalAllowed: string;
        limitPerEmergencyWithdrawal: string;
        totalLimitForEmergencyWithdrawal: string;
    };
    expectedStatus: number;
    expectedError: string;
};
export declare const testInvalidTokenAddress: {
    name: string;
    request: {
        beneficiaryAddresses: string[];
        sharePercentages: number[];
        tokenAddress: string;
        releaseAmount: string;
        releaseInterval: string;
        fundMaturityDate: string;
        causeName: string;
        causeDescription: string;
        governors: string[];
        requiredNumberofApprovals: string;
        timesEmergencyWithdrawalAllowed: string;
        limitPerEmergencyWithdrawal: string;
        totalLimitForEmergencyWithdrawal: string;
    };
    expectedStatus: number;
    expectedError: string;
};
export declare const testInvalidApprovals: {
    name: string;
    request: {
        beneficiaryAddresses: string[];
        sharePercentages: number[];
        tokenAddress: string;
        releaseAmount: string;
        releaseInterval: string;
        fundMaturityDate: string;
        causeName: string;
        causeDescription: string;
        governors: string[];
        requiredNumberofApprovals: string;
        timesEmergencyWithdrawalAllowed: string;
        limitPerEmergencyWithdrawal: string;
        totalLimitForEmergencyWithdrawal: string;
    };
    expectedStatus: number;
    expectedError: string;
};
export declare const testMultipleBeneficiaries: {
    name: string;
    request: {
        beneficiaryAddresses: string[];
        sharePercentages: number[];
        tokenAddress: string;
        releaseAmount: string;
        releaseInterval: string;
        fundMaturityDate: string;
        causeName: string;
        causeDescription: string;
        governors: string[];
        requiredNumberofApprovals: string;
        timesEmergencyWithdrawalAllowed: string;
        limitPerEmergencyWithdrawal: string;
        totalLimitForEmergencyWithdrawal: string;
    };
    expectedStatus: number;
    expectedFields: string[];
};
export declare const testHealthCheck: {
    name: string;
    endpoint: string;
    method: string;
    expectedStatus: number;
    expectedFields: string[];
};
export declare const testDocumentation: {
    name: string;
    endpoint: string;
    method: string;
    expectedStatus: number;
    expectedFields: string[];
};
/**
 * Example test runner using fetch
 */
export declare function runApiTests(baseUrl?: string): Promise<void>;
//# sourceMappingURL=tests.d.ts.map
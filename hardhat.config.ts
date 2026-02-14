import "dotenv/config";
import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";

const ETHERSCAN_API_KEY = process.env.ETHERSCAN_API_KEY ?? "";
const INFURA_API_KEY = process.env.INFURA_API_KEY ?? "";
const SEPOLIA_WALLET_PRIVATE_KEY = process.env.SEPOLIA_WALLET_PRIVATE_KEY ?? "";

const config: HardhatUserConfig = {
  solidity: {
    version: "0.8.28",
    settings: {
      viaIR: true,
      optimizer: {
        enabled: true,
        runs: 200,
      },
    },
  },
  etherscan: {
    apiKey: ETHERSCAN_API_KEY,
  },
  networks: {
    sepolia: {
      url: `https://sepolia.infura.io/v3/${INFURA_API_KEY}`,
      accounts: SEPOLIA_WALLET_PRIVATE_KEY ? [SEPOLIA_WALLET_PRIVATE_KEY] : []
    }
  }
};

export default config;

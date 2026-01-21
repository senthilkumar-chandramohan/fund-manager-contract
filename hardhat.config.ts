import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";

const ETHERSCAN_API_KEY = "VVCPGMJQZ2IZ2FQUT7K79HS2K4SEA6AVB9";
const INFURA_API_KEY = "d0c6d0a0d17d41aa9967ad0a0f438570";
const SEPOLIA_WALLET_PRIVATE_KEY = "98aef9b63894fae74ac3818e3c987391e75114688644841e2c405fdc9d0ca2df";

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
      accounts: [SEPOLIA_WALLET_PRIVATE_KEY]
    }
  }
};

export default config;

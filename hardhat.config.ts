import "@nomicfoundation/hardhat-toolbox";
import * as dotenv from "dotenv";
import { HardhatUserConfig } from "hardhat/config";

dotenv.config();

// MAINNET
const MAINNET_PROVIDER_URL = process.env.MAINNET_PROVIDER_URL;
const MAINNET_PRIVATE_KEY = process.env.MAINNET_PRIVATE_KEY;

// MUMBAI
const TESTNET_PROVIDER_URL = process.env.TESTNET_PROVIDER_URL;
const TESTNET_PRIVATE_KEY = process.env.TESTNET_PRIVATE_KEY;

const config: HardhatUserConfig = {
	solidity: {
		version: "0.8.17",
		settings: {
			optimizer: {
				enabled: true,
				runs: 200,
			},
		},
	},
	defaultNetwork: process.env.DEFAULT_NETWORK || "hardhat",
	networks: {
		local: {
			url: "http://127.0.0.1:8545/",
			accounts: [process.env.LOCAL_PRIVATE_KEY!],
		},
		PolygonMumbai: {
			url: TESTNET_PROVIDER_URL,
			accounts: [TESTNET_PRIVATE_KEY!],
			chainId: 80001,
		},
		PolygonAmoy: {
			url: TESTNET_PROVIDER_URL,
			accounts: [TESTNET_PRIVATE_KEY!],
			chainId: 80002,
		},
		PolygonMainnet: {
			url: MAINNET_PROVIDER_URL,
			accounts: [MAINNET_PRIVATE_KEY!],
			chainId: 137,
		},
		hardhat: {
			allowUnlimitedContractSize: false,
		},
	},
	paths: {
		sources: "./contracts",
		cache: "./cache",
		artifacts: "./contracts/artifacts",
	},
};

export default config;

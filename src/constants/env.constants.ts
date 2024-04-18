import { Network } from "alchemy-sdk";
import dotenv from "dotenv";
import { ethers } from "hardhat";

dotenv.config();

export const ASSETS_PATH = "./constants/";
// export const DATABASE_URL = process.env.DATABASE_URL;

// export const ENV = process.env.ENV;
// export const VERSION = process.env.VERSION;
// export const TIMEZONE = process.env.TIMEZONE;
// export const ETHERSCAN_API_KEY = process.env.ETHERSCAN_API_KEY;
// export const POLYGONSCAN_URL = process.env.POLYGONSCAN_URL;
// export const POLYGON_API_KEY = process.env.POLYGON_API_KEY;
// export const CHAINXP_API_BASE_URL = process.env.CHAINXP_API_BASE_URL;
// export const OPENSEA_BASE_URL = process.env.OPENSEA_BASE_URL;
// export const BASE_URL = process.env.BASE_URL;

// export const localProvider = new ethers.providers.JsonRpcProvider(process.env.LOCAL_PROVIDER_URL);
// export const localSigner = ethers.getSigner(process.env.SIGNER_ADDRESS);

// export const mumbaiProvider = new ethers.providers.AlchemyProvider(
// 	process.env.MUMBAI_PROVIDER_URL,
// 	process.env.MUMBAI_API_KEY
// );
// export const mumbaiSigner = mumbaiProvider.getSigner(process.env.MUMBAI_SIGNER_ADDRESS);

let provider;
// const signer = ethers.getSigners();
let apiKey;
let network;

if ((process.env.ENV = "alpha")) {
	// export const POLYGON_PROVIDER = new ethers.providers.AlchemyProvider(
	// 	process.env.POLYGON_NETWORK,
	// 	process.env.POLYGON_API_KEY
	// );
	// export const SIGNER_ADDRESS = ethers.getSigners();

	// privateKey = process.env.POLYGON_PRIVATE_KEY;
	// network = Network.MATIC_MUMBAI;
	network = Network.MATIC_AMOY;
	apiKey = process.env.POLYGON_API_KEY;
	// export const POLYGON_SIGNER = new ethers.Wallet(POLYGON_PRIVATE_KEY as string, POLYGON_PROVIDER);
} else {
	provider = new ethers.providers.JsonRpcProvider(process.env.LOCAL_PROVIDER_URL);
	apiKey = process.env.LOCAL_API_KEY;
	// export const LOCAL_SIGNER = LOCAL_PROVIDER.getSigner(process.env.LOCAL_SIGNER_ADDRESS);
	// privateKey = process.env.LOCAL_PRIVATE_KEY;
}

// used by hardhat config
export const TESTNET_PROVIDER_URL = process.env.TESTNET_PROVIDER_URL;
export const TESTNET_PRIVATE_KEY = process.env.TESTNET_PRIVATE_KEY;

export const MAINNET_PROVIDER_URL = process.env.MAINNET_PROVIDER_URL;
export const MAINNET_PRIVATE_KEY = process.env.MAINNET_PRIVATE_KEY;

export const LOCAL_PROVIDER_URL = process.env.LOCAL_PROVIDER_URL;
export const LOCAL_PRIVATE_KEY = process.env.LOCAL_PRIVATE_KEY;

// used in config
export const PROVIDER_URL = provider;
// export const SIGNER_ADDRESS = signer;
export const PROVIDER_API_KEY = apiKey;
export const ETH_NETWORK = network;
import { ethers } from "ethers";
import dotenv from "dotenv";

dotenv.config();

export const ASSETS_PATH = "./constants/";
export const DATABASE_URL = process.env.DATABASE_URL;

export const ENV = process.env.ENV;
export const VERSION = process.env.VERSION;
export const TIMEZONE = process.env.TIMEZONE;
export const PROVIDER_URL = process.env.PROVIDER_URL;
export const PROVIDER_API_KEY = process.env.PROVIDER_API_KEY;
export const SIGNER_ADDRESS = process.env.SIGNER_ADDRESS;
export const PRIVATE_KEY = process.env.PRIVATE_KEY;
export const ETHERSCAN_API_KEY = process.env.ETHERSCAN_API_KEY;
export const POLYGON_BASE_URL = process.env.POLYGON_BASE_URL;
export const POLYGON_API_KEY = process.env.POLYGON_API_KEY;
export const CHAINXP_API_BASE_URL = process.env.CHAINXP_API_BASE_URL;
export const OPENSEA_BASE_URL = process.env.OPENSEA_BASE_URL;
export const BASE_URL = process.env.BASE_URL;

export const provider = new ethers.providers.JsonRpcProvider(process.env.PROVIDER_URL);
export const signer = provider.getSigner(process.env.SIGNER_ADDRESS);

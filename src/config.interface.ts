// import { string } from "hardhat/internal/core/params/argumentTypes";

export default interface Config {
	env: string;
	version: string;
	timezone: string;
	// debug: boolean;
	apiKey: string;
	baseUrl: string;
	database: {
		uri: string;
	};
	// redis: {
	// 	host: string;
	// 	port: number;
	// 	password?: string;
	// };
	polygon: {
		baseUrl: string;
		apiKey: string;
	};
	alchemy: {
		apiKey: string;
		network: string;
	};
	artifacts: {
		tokenAbi: any;
		tokenBytecode: string;
		tokenContractName: string;
		tokenSourceName: string;
		factoryAbi: any;
		factoryBytecode: string;
		factoryContractName: string;
		factorySourceName: string;
		delegateAbi: any;
		delegateBytecode: string;
		delegateContractName: string;
		delegateSourceName: string;
		templateAbi: any;
		templateBytecode: string;
		templateContractName: string;
		templateSourceName: string;
	};
}

import fp from "fastify-plugin";
// import * as ms from '@lukeed/ms';
import Config from "../config.interface";
import * as constants from "../constants/env.constants";
// import { templateArtifacts, delegateArtifacts, factoryArtifacts, tokenArtifacts } from "../constants/abi.constants";

/**
 * @fastify/env Fastify plugin to check environment variables.
 *
 * @see https://github.com/fastify/fastify-env
 */
export default fp(
	async (fastify: any) => {
		// console.log("in plugins/config.ts");

		try {
			// const [tokenAbiStr, tokenBytecode, tokenContractName, tokenSourceName] = await tokenArtifacts();
			// const [factoryAbiStr, factoryBytecode, factoryContractName, factorySourceName] = await factoryArtifacts();
			// const [delegateAbiStr, delegateBytecode, delegateContractName, delegateSourceName] = await delegateArtifacts();
			// const [templateAbiStr, templateBytecode, templateContractName, templateSourceName] = await templateArtifacts();

			// console.log("tokenContractName: ", tokenContractName);
			// console.log("tokenSourceName: ", tokenSourceName);

			// Convert the ABI strings to arrays of JSON objects
			// const tokenAbi = tokenAbiStr ? JSON.parse(tokenAbiStr) : [];
			// const factoryAbi = factoryAbiStr ? JSON.parse(factoryAbiStr) : [];
			// const delegateAbi = delegateAbiStr ? JSON.parse(delegateAbiStr) : [];
			// const templateAbi = templateAbiStr ? JSON.parse(templateAbiStr) : [];

			// console.log("tokenAbi: ", JSON.stringify(tokenAbi));

			const config: Config = {
				// artifacts: {
				// 	tokenAbi,
				// 	tokenBytecode: tokenBytecode || "",
				// 	tokenContractName: tokenContractName || "",
				// 	tokenSourceName: tokenSourceName || "",
				// 	factoryAbi,
				// 	factoryBytecode: factoryBytecode || "",
				// 	factoryContractName: factoryContractName || "",
				// 	factorySourceName: factorySourceName || "",
				// 	delegateAbi,
				// 	delegateBytecode: delegateBytecode || "",
				// 	delegateContractName: delegateContractName || "",
				// 	delegateSourceName: delegateSourceName || "",
				// 	templateAbi,
				// 	templateBytecode: templateBytecode || "",
				// 	templateContractName: templateContractName || "",
				// 	templateSourceName: templateSourceName || "",
				// },
				env: process.env.ENV || "",
				version: process.env.VERSION || "",
				timezone: process.env.TIMEZONE || "",
				// debug: getIntEnv('debug', 0) === 1,
				apiKey: process.env.LOCAL_APIKEY || "",
				baseUrl: process.env.BASE_URL || "",
				database: {
					uri: process.env.DATABASE_URL || "",
				},
				// redis: {
				//   host: getStringEnv('redis_host'),
				//   port: getIntEnv('redis_port'),
				//   password: getStringEnv('redis_password', '') || undefined,
				// },
				polygon: {
					baseUrl: process.env.POLYGONSCAN_URL || "",
					apiKey: process.env.POLYGONSCAN_API_KEY || "",
					maxGasPrice: Number(process.env.POLYGONSCAN_MAX_GAS_PRICE) || 300,
				},
				alchemy: {
					apiKey: constants.PROVIDER_API_KEY || "",
					network: constants.ETH_NETWORK || "",
				},
				// scheduleServer: {
				// 	host: getStringEnv("schedule_server_host"),
				// 	apiKey: getStringEnv("schedule_server_api_key"),
				// },
			};
			fastify.decorate("config", config);
		} catch (error) {
			fastify.log.error(error);
			console.log("plugins/config.ts error: ", error);
		}
	},
	{
		fastify: "4.x",
		name: "chainxp-config",
	}
);

declare module "fastify" {
	interface FastifyInstance {
		config: Config;
	}
}

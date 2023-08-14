import fp from "fastify-plugin";
// import * as ms from '@lukeed/ms';
import Config from "../config.interface";
import * as constants from "../constants/env.constants";
import { templateArtifacts, delegateArtifacts, factoryArtifacts, tokenArtifacts } from "../constants/abi.constants";


/**
 * @fastify/env Fastify plugin to check environment variables.
 *
 * @see https://github.com/fastify/fastify-env
 */
export default fp(
	async (fastify) => {
		const [ tokenAbiStr, tokenBytecode, tokenContractName, tokenSourceName ] = await tokenArtifacts();
		const [ factoryAbiStr, factoryBytecode, factoryContractName, factorySourceName ] = await factoryArtifacts();
		const [ delegateAbiStr, delegateBytecode, delegateContractName, delegateSourceName ] = await delegateArtifacts();
		const [ templateAbiStr, templateBytecode, templateContractName, templateSourceName ] = await templateArtifacts();
		
		// Convert the ABI strings to arrays of JSON objects
		const tokenAbi = tokenAbiStr ? JSON.parse(tokenAbiStr) : [];
		const factoryAbi = factoryAbiStr ? JSON.parse(factoryAbiStr) : [];
		const delegateAbi = delegateAbiStr ? JSON.parse(delegateAbiStr) : [];
		const templateAbi = templateAbiStr ? JSON.parse(templateAbiStr) : [];

		const config: Config = {
			artifacts: {
				tokenAbi,
				tokenBytecode: tokenBytecode || '',
				tokenContractName: tokenContractName || '',
				tokenSourceName: tokenSourceName || '',
				factoryAbi,
				factoryBytecode: factoryBytecode || '',
				factoryContractName: factoryContractName || '',
				factorySourceName: factorySourceName || '',
				delegateAbi,
				delegateBytecode: delegateBytecode || '',
				delegateContractName: delegateContractName || '',
				delegateSourceName: delegateSourceName || '',
				templateAbi,
				templateBytecode: templateBytecode || '',
				templateContractName: templateContractName || '',
				templateSourceName: templateSourceName || '',
			},
			env: constants.ENV || '',
			version: constants.VERSION || '',
			timezone: constants.TIMEZONE || '',
			// debug: getIntEnv('debug', 0) === 1,
			apiKey: constants.PRIVATE_KEY || '',
			baseUrl: constants.BASE_URL || '',
			database: {
				uri: constants.DATABASE_URL || '',
			},
			// redis: {
			//   host: getStringEnv('redis_host'),
			//   port: getIntEnv('redis_port'),
			//   password: getStringEnv('redis_password', '') || undefined,
			// },
			polygon: {
				baseUrl: constants.POLYGON_BASE_URL || '',
				apiKey: constants.POLYGON_API_KEY || '',
			},
			alchemy: {
				apiKey: constants.PROVIDER_API_KEY || '',
				network: constants.PROVIDER_URL || '',
			},
		};
		fastify.decorate("config", config);
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

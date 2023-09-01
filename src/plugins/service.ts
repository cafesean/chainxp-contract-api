import { FastifyInstance } from "fastify";
import fp from "fastify-plugin";

// import { PrismaClient } from "@prisma/client";
import { BaseService, ContractService, SeriesService, TokenService, DeployService } from "../service/index";

export default fp(
	async (fastify: any, opts: any) => {
		fastify.decorate("service", new ServiceHolder(fastify));
	},
	{
		fastify: "4.x",
		name: "chainxp-service",
		dependencies: [
			"chainxp-config",
			"fastify-prisma-client",
			"fastify-polygon-client",
			"fastify-alchemy-client",
			"fastify-auth",
			// "fastify-jwt",
		],
	}
);
declare module "fastify" {
	interface FastifyInstance {
		service: ServiceHolder;
		// prisma: PrismaClient;
	}
}
class ServiceHolder {
	contract: ContractService;
	series: SeriesService;
	token: TokenService;
	deploy: DeployService;
	
	constructor(fastify: FastifyInstance) {
		this.contract = ServiceHolder.init(fastify, ContractService);
		this.series = ServiceHolder.init(fastify, SeriesService);
		this.token = ServiceHolder.init(fastify, TokenService);
		this.deploy = ServiceHolder.init(fastify, DeployService);
	}

	static init<T extends BaseService>(fastify: FastifyInstance, serviceType: { new (): T }): T {
		const svc = new serviceType();
		svc.config = fastify.config;
		svc.prisma = fastify.prisma;
		svc.polygon = fastify.polygon;
		svc.alchemy = fastify.alchemy;
		return svc;
	}
}

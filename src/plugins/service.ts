import { FastifyInstance } from "fastify";
import fp from "fastify-plugin";
import { PrismaClient } from "@prisma/client";
// import { ScheduleClient } from "../clients/index";
import { BaseService, ContractService } from "../service/index";

// interface BaseService {
// 	config?: any;
// 	log?: any;
// 	prisma?: PrismaClient;
// 	// redis?: any;
// 	// mailgun?: any;
// 	// web3?: any;
// 	// ... add other common properties
// }

export default fp(
	async (fastify, opts) => {
		// fastify.decorate("client", new ClientHolder(fastify));
		fastify.decorate("service", new ServiceHolder(fastify));
	},
	{
		fastify: "4.x",
		name: "chainxp-service",
		dependencies: [
			"chainxp-config",
			"fastify-prisma-client",
			"fastify-alchemy-client",
		],
	}
);

declare module "fastify" {
	interface FastifyInstance {
		service: ServiceHolder;
		prisma: PrismaClient;
	}
}
// class ClientHolder {
// 	schedule: ScheduleClient;

// 	constructor(fastify: FastifyInstance) {
// 		this.schedule = new ScheduleClient(fastify.config.scheduleServer.host, fastify.config.scheduleServer.apiKey);
// 	}
// }

class ServiceHolder {
	contract: ContractService;

	constructor(fastify: FastifyInstance) {
		this.contract = ServiceHolder.init(fastify, ContractService);
	}


//  static init<T extends BaseService>(
//     fastify: FastifyInstance,
//     serviceType: { new(): T; }
//   ): T {
//     const svc = new serviceType();
//     svc.config = fastify.config;
//     svc.log = fastify.log;
//     svc.prisma = fastify.prisma;
//     // svc.redis = fastify.redis;
//     // svc.polygon = fastify.polygon;
//     svc.alchemy = fastify.alchemy;
//     return svc;
  // }
	static init(fastify: FastifyInstance, serviceType: { new (): any }): any {
		const svc = new serviceType();
		this.assignProperties(svc, fastify);
		return svc;
	}

	static assignProperties(service: BaseService, fastify: FastifyInstance) {
		service.config = fastify.config;
		// service.log = fastify.log;
		service.prisma = fastify.prisma;
	}
}

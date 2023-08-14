import { FastifyInstance } from "fastify";
import fp from "fastify-plugin";
import { PrismaClient } from "@prisma/client";

import { ContractService } from "../service/index";

interface BaseService {
	config?: any;
	log?: any;
	prisma?: PrismaClient;
	redis?: any;
	mailgun?: any;
	web3?: any;
	// ... add other common properties
}

export default fp(
	async (fastify, opts) => {
		fastify.decorate("service", new ServiceHolder(fastify));
	},
	{
		fastify: "4.x",
		name: "member-nft-service",
	}
);

declare module "fastify" {
	interface FastifyInstance {
		service: ServiceHolder;
		prisma: PrismaClient;
	}
}

class ServiceHolder {
	contract: ContractService;

	constructor(fastify: FastifyInstance) {
		this.contract = ServiceHolder.init(fastify, ContractService);
	}

	static init (fastify: FastifyInstance, serviceType: { new (): any }): any {
		const svc = new serviceType();
		// svc.config = fastify.config;
		// svc.log = fastify.log;
		// this.svc.prisma = fastify.prisma;
		this.assignProperties(svc, fastify);
		// svc.redis = fastify.redis;
		// svc.mailgun = fastify.mailgun;
		// svc.web3 = fastify.web3;
		return svc;
	}

	static assignProperties(service: BaseService, fastify: FastifyInstance) {
		service.config = fastify.config;
		service.log = fastify.log;
		service.prisma = fastify.prisma;
		// service.redis = fastify.redis;
		// ... and so on for other properties
	}
}

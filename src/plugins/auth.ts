import fp from "fastify-plugin";

import * as errors from "../errors";

export default fp(
	(fastify: any, opts: any, done: any) => {
		fastify
			.decorate("authenticate", async (request: FastifyRequest, resp: FastifyReply) => {
				const apiKey = request.headers["x-api-key"];
				if (apiKey !== fastify.config.apiKey) {
					throw errors.create(errors.StatusCodes.BAD_REQUEST);
				}
			})
			.addHook("onRequest", (request: FastifyRequest, resp: FastifyReply, done: any) => {
				if (request.method === "PUT" || request.method === "POST") {
					return fastify.authenticate(request, resp);
				}
			});
		done();
	},
	{
		fastify: "4.x",
		name: "fastify-auth",
		dependencies: ["chainxp-config"],
	}
);

import { FastifyRequest, FastifyReply } from "fastify";

declare module "fastify" {
	export interface FastifyInstance {
		authenticate(request: FastifyRequest, reply: FastifyReply): Promise<void>;
	}
}

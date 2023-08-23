import fp from "fastify-plugin";
import Polygon from "../providers/polygon";

export default fp(
	(fastify: any, opts: any, done: any) => {
		const polygonClient = new Polygon(fastify.config.polygon.baseUrl, fastify.config.polygon.apiKey, fastify.config.polygon.maxGasPrice);
		fastify.decorate("polygon", polygonClient);
		done();
	},
	{
		fastify: "4.x",
		name: "fastify-polygon-client",
		dependencies: ["chainxp-config"],
	}
);

declare module "fastify" {
	interface FastifyInstance {
		polygon: Polygon;
	}
}

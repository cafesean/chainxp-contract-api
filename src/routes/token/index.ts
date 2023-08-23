import { FastifyInstance } from "fastify";

export default async function tokenRoute(fastify: FastifyInstance) {
	fastify.get("/", async function (request: any, resp: any): Promise<any> {
		resp
			.code(200)
			.header("Content-Type", "application/json; charset=utf-8")
			.send({ result: "Token API v" + process.env.VERSION });
	});

	// route for getting balance
	fastify.get("/:contract_address/:class_id/balance", async function (request: any, resp: any): Promise<any> {
		const { contract_address, wallet_address } = request.params;
		const balance = await fastify.service.contract.getBalance(contract_address, wallet_address);
		resp.code(200).header("Content-Type", "application/json; charset=utf-8").send({ result: balance });
	});


	// create a route that adds multiple wallet addresses to the allowlist table
	// post request must include an api key sent in the headers to access this route
	// fastify.post("/:contract_address/:class_id/allowlist", async function (request: any, resp: any): Promise<any> {
	// 	// authorize an api key to access this route

	// 	const { contract_address, wallet_addresses } = request.body;
	// 	const allowlist = await fastify.service.contract.addToAllowlist(contract_address, wallet_addresses);

	// 	resp.code(200).header("Content-Type", "application/json; charset=utf-8").send({ result: allowlist });
	// });
}

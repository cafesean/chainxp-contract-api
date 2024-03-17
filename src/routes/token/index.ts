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
		const balance = await fastify.service.token.getBalance(contract_address, wallet_address);
		resp.code(200).header("Content-Type", "application/json; charset=utf-8").send({ result: balance });
	});

	fastify.post("/:contract_id/mint/:class_id", async (request: any, resp: any) => {
		const { contract_id, class_id } = request.params;
		const { address } = request.query;
		const { signed_request, transaction_id } = typeof request.body === 'string' ? JSON.parse(request.body) : request.body;

		const response = await fastify.service.token.mint(contract_id, class_id, address, signed_request, transaction_id);

		const txn = response as any;
		// resp.header("Content-Type", "application/json");
		console.log("txn: ", txn);
		if (!txn) {
			resp.code(400).header("Content-Type", "application/json; charset=utf-8").send({ result: "Mint failed" });
			return;
		}

		const apiResponse = {
			code: 200,
			data: txn,
		};
		resp.code(200).header("Content-Type", "application/json; charset=utf-8").send(apiResponse);
	});

	fastify.get("/:contract_id/getUris/:id1/:id2", async (request: any, resp: any) => {
		//const { count } = request.query;
		const { contract_id, id1, id2 } = request.params;
		// const { abi } = request.body;

		try {
			const uriString = await fastify.service.token.getUris(contract_id, id1, id2);

			return { result: uriString };
		} catch (err) {
			resp.send(err);
		}
	});

	fastify.post("/:contract_address/transfer/:id", async (request: any, resp: any) => {
		const { contract_address, id } = request.params;
		const { from, to, amount } = request.body;

		const { txnHash } = await fastify.service.token.transfer(contract_address, id, from, to, amount);
		resp.code(200).header("Content-Type", "application/json; charset=utf-8").send({ result: txnHash });
	});

	fastify.post("/:contract_address/burn/:id", async (request: any, resp: any) => {
		const { contract_address, id } = request.params;
		const { from, amount } = request.body;

		const { txnHash } = await fastify.service.token.burn(contract_address, id, from, amount);

		const response = {
			code: 200,
			result: txnHash,
		};
		resp.code(200).header("Content-Type", "application/json; charset=utf-8").send(response);
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

import { FastifyInstance } from "fastify";
// import * as abi from "../../constants/abi.constants";

// import { genericSchema } from "../../schema/index";

export default async function contractRoute(fastify: FastifyInstance) {
	fastify.get("/", async function (request: any, resp: any): Promise<any> {
		resp
			.code(200)
			.header("Content-Type", "application/json; charset=utf-8")
			.send({ result: "Series API"});
	});

	fastify.post("/:contract_id/class", async (request: any, resp: any) => {
		const { contract_id } = request.params;
		// const { name, desc, image_url, slug } = request.body;
		console.log("In addClass route");
		const contractClass = await fastify.service.series.addClass(contract_id, request.body);

		resp.code(200).header("Content-Type", "application/json; charset=utf-8").send({ result: contractClass });
	});

	fastify.get("/:contract_address/users/:id1/:id2", async (request: any, resp: any) => {
		const { contract_address, id1, id2 } = request.params;

		try {
			const response = await fastify.service.series.getUsers(contract_address, id1, id2);
			return { result: response };
		} catch (err) {
			resp.send(err);
		}
	});

	fastify.get("/:contract_address/classes/:id1/:id2", async (request: any, resp: any) => {
		const { contract_address, id1, id2 } = request.params;

		try {
			// const contractNFT = new ethers.series(contract, abi, env.wallet);
			// const response = await fastify.service.collection.getClasses(contractNFT, id1, id2);
			const response = await fastify.service.series.getClasses(contract_address, id1, id2);
			return { result: response };
		} catch (err) {
			resp.send(err);
		}
	});


	fastify.post("/:contract_address/god", async (request: any, resp: any) => {
		const { contract_address } = request.params;
		const txnHash = await fastify.service.series.god(contract_address, request.body);

		resp.code(200).header("Content-Type", "application/json; charset=utf-8").send({ result: txnHash });
	});

	//   fastify.post(
	//     '/transaction/speedup',
	//     speedupTransactionSchema(fastify),
	//     async (req, resp) => {

	//       const newTxn = await fastify.service.series.speedupTransaction();
	//       resp.success(newTxn);
	//     }
	//   );

	//   fastify.post(
	//     '/transaction/:txnHash/confirm',
	//     confirmTransactionSchema(fastify),
	//     async (req, resp) => {
	//       const { txnHash } = req.params;

	//       await fastify.service.series.confirmTransaction(txnHash);
	//       resp.success();
	//     }
	//   );

	//   fastify.post(
	//     '/transaction/:txnHash/status',
	//     verifyTransactionSchema(fastify),
	//     async (req, resp) => {
	//       const { txnHash } = req.params;

	//       const status = await fastify.service.contract.verify(txnHash);
	//       resp.success({ status });
	//     }
	//   );
}

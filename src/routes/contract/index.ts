import { FastifyInstance } from "fastify";
// import * as abi from "../../constants/abi.constants";

// import { genericSchema } from "../../schema/index";

export default async function contractRoute(fastify: FastifyInstance) {
	fastify.get("/", async () => {
		var message = await fastify.service.contract.version();
		return { result: message };
	});

	fastify.get("/network", async () => {
		var message = await fastify.service.contract.network();
		return { result: message };
	});

	fastify.put("/create", async (request: any, resp: any) => {
		const { version, isDefault } = request.body;
		const response = await fastify.service.contract.createContracts(version, isDefault);
		resp.code(200).header("Content-Type", "application/json; charset=utf-8").send({ result: response });
	});

	fastify.post("/deploy", async (request: any, resp: any) => {
		const { name, baseUri, description, symbol } = request.body;
		const contract = (await fastify.service.deploy.deployAll(name, baseUri, description, symbol)) as any;

		resp.code(200).header("Content-Type", "application/json; charset=utf-8").send({ result: contract });
	});

	fastify.post("/clone", async (request: any, resp: any) => {
		// const { name,  } = request.body;

		const contract = await fastify.service.deploy.cloneProxy(request.body);

		resp.code(200).header("Content-Type", "application/json; charset=utf-8").send({ result: contract });
	});

	fastify.post("/deployFactory", async (request: any, resp: any) => {
		// const { name,  } = request.body;

		const contract = await fastify.service.deploy.deployFactory(request.body);

		resp.code(200).header("Content-Type", "application/json; charset=utf-8").send({ result: contract });
	});

	fastify.post("/:contract_id/class", async (request: any, resp: any) => {
		const { contract_id } = request.params;
		// const { name, desc, image_url, slug } = request.body;
		console.log("In addClass route");
		const contractClass = await fastify.service.contract.addClass(contract_id, request.body);

		resp.code(200).header("Content-Type", "application/json; charset=utf-8").send({ result: contractClass });
	});

	fastify.put("/:contract_id/mint/:class_id", async (request: any, resp: any) => {
		const { contract_id, class_id } = request.params;
		const { address } = request.query;

		const response = await fastify.service.contract.mintNFT(contract_id, class_id, address);

		const txn = response as any;
		console.log("fastify.put txn: ", txn);
		// resp.header("Content-Type", "application/json");
		resp.code(200).header("Content-Type", "application/json; charset=utf-8").send({ result: txn });
	});

	fastify.post("/:contract_id/updateBaseUri", async (request: any, resp: any) => {
		const { contract_id } = request.params;
		const { base_uri } = request.body;
		console.log("In update clone meta data route");
		const contractClass = await fastify.service.contract.updateBaseUri(contract_id, base_uri);

		resp.code(200).header("Content-Type", "application/json; charset=utf-8").send({ result: contractClass });
	});

	fastify.get("/:contract_id/getUris/:id1/:id2", async (request: any, resp: any) => {
		//const { count } = request.query;
		const { contract_id, id1, id2 } = request.params;
		// const { abi } = request.body;

		try {
			const uriString = await fastify.service.contract.getUris(contract_id, id1, id2);

			return { result: uriString };
		} catch (err) {
			resp.send(err);
		}
	});

	fastify.get("/:contract_id/details", async (request: any, resp: any) => {
		//const { count } = request.query;
		const { contract_id } = request.params;
		// const { abi } = request.body;

		try {
			const uriString = await fastify.service.contract.getContractDetails(contract_id);

			return { result: uriString };
		} catch (err) {
			resp.send(err);
		}
	});

	fastify.get("/:contract/users/:id1/:id2", async (request: any, resp: any) => {
		const { contract, id1, id2 } = request.params;

		try {
			const response = await fastify.service.contract.getUsers(contract, id1, id2);
			return { result: response };
		} catch (err) {
			resp.send(err);
		}
	});

	fastify.get("/:contract/classes/:id1/:id2", async (request: any, resp: any) => {
		const { contract, id1, id2 } = request.params;

		try {
			// const contractNFT = new ethers.Contract(contract, abi, env.wallet);
			// const response = await fastify.service.collection.getClasses(contractNFT, id1, id2);
			const response = await fastify.service.contract.getClasses(contract, id1, id2);
			return { result: response };
		} catch (err) {
			resp.send(err);
		}
	});

	fastify.post("/:contract_address/transfer/:id", async (request: any, resp: any) => {
		const { contract_address, id } = request.params;
		const { from, to, amount } = request.body;

		const { txnHash } = await fastify.service.contract.transfer(contract_address, id, from, to, amount);
		resp.code(200).header("Content-Type", "application/json; charset=utf-8").send({ result: txnHash });
	});

	fastify.post("/:contract_address/burn/:id", async (request: any, resp: any) => {
		const { contract_address, id } = request.params;
		const { from, amount } = request.body;

		const { txnHash } = await fastify.service.contract.burn(contract_address, id, from, amount);
		resp.code(200).header("Content-Type", "application/json; charset=utf-8").send({ result: txnHash });
	});

	fastify.post("/:contract_address/god", async (request: any, resp: any) => {
		const { contract_address } = request.params;
		const txnHash = await fastify.service.contract.god(contract_address, request.body);

		resp.code(200).header("Content-Type", "application/json; charset=utf-8").send({ result: txnHash });
	});

	//   fastify.post(
	//     '/transaction/speedup',
	//     speedupTransactionSchema(fastify),
	//     async (req, resp) => {

	//       const newTxn = await fastify.service.contract.speedupTransaction();
	//       resp.success(newTxn);
	//     }
	//   );

	//   fastify.post(
	//     '/transaction/:txnHash/confirm',
	//     confirmTransactionSchema(fastify),
	//     async (req, resp) => {
	//       const { txnHash } = req.params;

	//       await fastify.service.contract.confirmTransaction(txnHash);
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

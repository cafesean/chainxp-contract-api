import { FastifyInstance } from "fastify";
// import * as abi from "../../constants/abi.constants";

// import { genericSchema } from "../../schema/index";

export default async function contractRoute(fastify: FastifyInstance) {
	fastify.get("/", async () => {
		const message = await fastify.service.contract.version();
		return { result: message };
	});
	fastify.get("/version", async () => {
		const message = await fastify.service.contract.version();
		return { result: message };
	});
	fastify.get("/network", async () => {
		const message = await fastify.service.contract.network();
		return { result: message };
	});

	fastify.post("/:contract_address/grantAccess", async (request: any, resp: any) => {
		const { contract_address } = request.params;
		const { walletAddress } = request.body;
		// append response to the responseJSON object
		const response = await fastify.service.contract.grantCloneAccess(walletAddress, contract_address);

		resp.code(200).header("Content-Type", "application/json; charset=utf-8").send(response);
	});

	fastify.put("/create", async (request: any, resp: any) => {
		const { token, delegate, factory, template, version, isDefault } = request.body;
		// append response to the responseJSON object
		const response = await fastify.service.contract.createContracts(token, delegate, factory, template, version, isDefault);

		resp.code(200).header("Content-Type", "application/json; charset=utf-8").send(response);
	});

	fastify.post("/deploySingle", async (request: any, resp: any) => {
		const { contract_name, name, baseUri, description, symbol } = request.body;
		const options = [name, baseUri, description, symbol];

		console.log("contract_name: ", contract_name);
		console.log("options: ", options);
		const contract = (await fastify.service.contract.deploySingle(contract_name, options)) as any;

		resp.code(200).header("Content-Type", "application/json; charset=utf-8").send({ result: contract.address });
	});

	fastify.post("/deployAll", async (request: any, resp: any) => {
		const { name, baseUri, description, symbol } = request.body;
		const contract = (await fastify.service.contract.deployAll(name, baseUri, description, symbol)) as any;

		resp.code(200).header("Content-Type", "application/json; charset=utf-8").send({ result: contract });
	});

	fastify.post("/configure", async (request: any, resp: any) => {
		const { proxyAddress, delegateAddress, templateAddress } = request.body;
		const contract = (await fastify.service.contract.configureProxy(proxyAddress, delegateAddress, templateAddress)) as any;

		resp.code(200).header("Content-Type", "application/json; charset=utf-8").send({ result: contract });
	});

	fastify.post("/clone", async (request: any, resp: any) => {
		// const { name,  } = request.body;

		const contract = await fastify.service.contract.cloneProxy(request.body);

		resp.code(200).header("Content-Type", "application/json; charset=utf-8").send({ result: contract });
	});

	fastify.post("/deployFactory", async (request: any, resp: any) => {
		// const { name,  } = request.body;

		const contract = await fastify.service.contract.deployFactory(request.body);

		resp.code(200).header("Content-Type", "application/json; charset=utf-8").send({ result: contract });
	});

	fastify.post("/:contract_id/updateBaseUri", async (request: any, resp: any) => {
		const { contract_id } = request.params;
		const { base_uri } = request.body;
		console.log("In update clone meta data route");
		const contractClass = await fastify.service.contract.updateBaseUri(contract_id, base_uri);

		resp.code(200).header("Content-Type", "application/json; charset=utf-8").send({ result: contractClass });
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

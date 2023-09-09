import { FastifyInstance } from "fastify";
import { decryptPrivateKey } from "@root/src/utils/encryption";
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
		const { walletAddress, role } = request.body;
		// append response to the responseJSON object
		const response = await fastify.service.contract.grantAccess(walletAddress, contract_address, role);

		resp.code(200).header("Content-Type", "application/json; charset=utf-8").send(response);
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

	// get abi from contract address
	fastify.get("/:contract_address/getAbi", async (request: any, resp: any) => {
		const { contract_address } = request.params;
		// const { abi } = request.body;

		try {
			const abiString = await fastify.service.contract.getAbi(contract_address, true);

			return { result: abiString };
		} catch (err) {
			resp.send(err);
		}
	});

	fastify.post("/:contract_address/god", async (request: any, resp: any) => {
		const { contract_address } = request.params;
		const txnHash = await fastify.service.contract.god(contract_address, request.body);

		resp.code(200).header("Content-Type", "application/json; charset=utf-8").send({ result: txnHash });
	});


	// create route for decoding a privatekey using the decryptPrivateKey function in contract.ts
	fastify.post("/decryptPrivateKey", async (request: any, resp: any) => {
		const { encryptedPrivateKey, password, iv } = request.body;
		const decrypted = decryptPrivateKey(encryptedPrivateKey, password, iv);

		resp.code(200).header("Content-Type", "application/json; charset=utf-8").send({ result: decrypted });
	});

	// create route for encrypting a privatekey using the encryptPrivateKey function in encryption.ts
	fastify.post("/encryptPrivateKey", async (request: any, resp: any) => {
		const { address, privateKey, password } = request.body;
		const encrypted = await fastify.service.contract.encryptPrivateKey(address, privateKey, password);

		resp.code(200).header("Content-Type", "application/json; charset=utf-8").send({ result: encrypted });
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

import { FastifyInstance } from "fastify";
import { decryptPrivateKey } from "@root/src/utils/encryption";
// import { ethers } from "hardhat";
import { getForwarderWalletKeyFromClone, getSigner } from "@root/src/utils/contract.utils";
import * as type from "src/types";
// import * as abi from "../../constants/abi.constants";

// import { genericSchema } from "../../schema/index";

export default async function contractRoute(fastify: FastifyInstance) {
	fastify.get("/", async function (request: any, resp: any): Promise<any> {
		resp.code(200).header("Content-Type", "application/json; charset=utf-8").send({ result: "Series API" });
	});

	fastify.post("/:contract_id/class", async (request: any, resp: any) => {
		const { contract_id } = request.params;
		const body : type.PublishXPCloneAddressPayload = request.body;

		console.log("In addClass route");
		// get forwarder wallet using clone address
		const forwarderKey = await getForwarderWalletKeyFromClone(contract_id);
		const signer = getSigner(forwarderKey);
		const contractClass = await fastify.service.series.addClass(signer, contract_id, body);

		resp.code(200).header("Content-Type", "application/json; charset=utf-8").send(contractClass);
	});

	fastify.post("/:contract_id/attributes", async (request: any, resp: any) => {
		const { contract_id } = request.params;
		const { xpId } = request.body;

		console.log("In addAttribute route");
		// get forwarder wallet using clone address
		const forwarderKey = await getForwarderWalletKeyFromClone(contract_id);
		const signer = getSigner(forwarderKey);
		const contractAttribute = await fastify.service.series.addAttributes(signer, contract_id, xpId, request.body);

		resp.code(200).header("Content-Type", "application/json; charset=utf-8").send(contractAttribute);
	});

	fastify.get("/:contract_address/users/:id1/:id2", async (request: any, resp: any) => {
		const { contractAddress, id1, id2 } = request.params;

		try {
			const response = await fastify.service.series.getUsers(contractAddress, id1, id2);
			return { result: response };
		} catch (err) {
			resp.send(err);
		}
	});

	fastify.get("/:contract_address/classes/:id1/:id2", async (request: any, resp: any) => {
		const { contract_address, id1, id2 } = request.params;

		const forwarderKey = await getForwarderWalletKeyFromClone(contract_address);
		const signer = getSigner(forwarderKey);

		try {
			// const contractNFT = new ethers.series(contract, abi, env.wallet);
			// const response = await fastify.service.collection.getClasses(contractNFT, id1, id2);
			const response = await fastify.service.series.getClasses(signer, contract_address, id1, id2);
			return { result: response };
		} catch (err) {
			resp.send(err);
		}
	});

	fastify.post("/:contract_address/attributes/:id1/:id2", async (request: any, resp: any) => {
		const { contract_address, id1, id2 } = request.params;
		const { classId } = request.body;

		const forwarderKey = await getForwarderWalletKeyFromClone(contract_address);
		const signer = getSigner(forwarderKey);

		try {
			// const contractNFT = new ethers.series(contract, abi, env.wallet);
			// const response = await fastify.service.collection.getClasses(contractNFT, id1, id2);
			const response = await fastify.service.series.getAttributes(signer, contract_address, classId, id1, id2);
			return { result: response };
		} catch (err) {
			resp.send(err);
		}
	});

	fastify.post("/:contract_address/god", async (request: any, resp: any) => {
		const { contractAddress } = request.params;
		const { encryptedKey, password, iv } = request.body;
		const deployWalletKey = decryptPrivateKey(encryptedKey, password, iv);

		const signer = getSigner(deployWalletKey);
		const txnHash = await fastify.service.series.god(signer, contractAddress, request.body);

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

import { decryptPrivateKey } from "@root/src/utils/encryption";
import { FastifyInstance } from "fastify";
// import { ethers } from "ethers";
import { getForwarderWalletKey, getSigner } from "@root/src/utils/contract.utils";
import dotenv from "dotenv";
import * as type from "src/types";

dotenv.config();
// import * as abi from "../../constants/abi.constants";

// import { genericSchema } from "../../schema/index";

export default async function contractRoute(fastify: FastifyInstance) {
	fastify.get("/", async function (request: any, resp: any): Promise<any> {
		resp.code(200).header("Content-Type", "application/json; charset=utf-8").send({ result: "Deploy API" });
	});

	// fastify.get("/getSigner", async (request: any, resp: any) => {
	// 	const response = await fastify.service.deploy.getSigner();

	// 	resp.code(200).header("Content-Type", "application/json; charset=utf-8").send(response);
	// });

	fastify.put("/create", async (request: any, resp: any) => {
		const { token, delegate, factory, version, isDefault, tierId } = request.body;
		// append response to the responseJSON object
		const response = await fastify.service.deploy.createContracts(token, delegate, factory, version, isDefault, tierId);

		resp.code(200).header("Content-Type", "application/json; charset=utf-8").send(response);
	});

	fastify.post("/deploySingle/:deployment_id", async (request: any, resp: any) => {
		const { name, baseUri, description, symbol, fungible, encryptedKey, password, iv, salt } = request.body;
		const { deployment_id } = request.params;

		const options = [name, baseUri, description, symbol, fungible];

		const deployWalletAddressKey = decryptPrivateKey(encryptedKey, password, iv, salt);


		const signer = getSigner(deployWalletAddressKey);

		// console.log("contract_name: ", contractName);
		console.log("options: ", options);
		const contract = (await fastify.service.deploy.deploySingle(deployment_id, signer, name, options)) as any;

		resp
			.code(200)
			.header("Content-Type", "application/json; charset=utf-8")
			.send({ newContractAddress: contract.address });
	});

	fastify.post("/deployAll/:deployment_id", async (request: any, resp: any) => {
		const {
			name,
			baseUri,
			description,
			symbol = "",
			fungible,
			encryptedKey,
			password,
			iv,
			salt,
		}: type.DeployAllBlockchainContractRequest = request.body;
		const { deployment_id } = request.params;
		const deployWalletAddressKey = decryptPrivateKey(encryptedKey, password, iv, salt);


		const signer = getSigner(deployWalletAddressKey);


		const contract = (await fastify.service.deploy.deployAll(
			deployment_id,
			signer,
			name || "",
			baseUri || "",
			description || "",
			symbol || "",
			fungible,
		)) as any;

		resp.code(200).header("Content-Type", "application/json; charset=utf-8").send(contract);
	});

	fastify.post("/configure", async (request: any, resp: any) => {
		const { proxyAddress, delegateAddress, encryptedKey, password, iv, salt } = request.body;
		const deployWalletAddressKey = decryptPrivateKey(encryptedKey, password, iv, salt);

		const signer = getSigner(deployWalletAddressKey);
		const contract = (await fastify.service.deploy.configureProxy(signer, proxyAddress, delegateAddress)) as any;

		resp.code(200).header("Content-Type", "application/json; charset=utf-8").send({ contract });
	});

	fastify.post("/clone", async (request: any, resp: any) => {
		const { proxyAddress }: type.CloneProxyBlockchainRequest = request.body;
		console.log("proxyAddress: ", proxyAddress);
		// const { encryptedKey, iv, password } = request.body;
		// const deployWalletAddress = decryptPrivateKey(encryptedKey, password, iv);
		const forwarderKey = await getForwarderWalletKey(proxyAddress);

		const signer = getSigner(forwarderKey);
		const contract = await fastify.service.deploy.cloneProxy(signer, request.body);

		resp.code(200).header("Content-Type", "application/json; charset=utf-8").send(contract);
	});

	fastify.post("/deployFactory/:deployment_id", async (request: any, resp: any) => {
		const { encryptedKey, password, iv, salt } = request.body;
		const { deployment_id } = request.params;
		const deployWalletAddressKey = decryptPrivateKey(encryptedKey, password, iv, salt);
		// const wallet = new ethers.Wallet(deployWalletAddressKey);
		// const signer = wallet.connect(ethers.getDefaultProvider());

		const signer = getSigner(deployWalletAddressKey);
		const contract = await fastify.service.deploy.deployFactory(deployment_id, signer, request.body);

		resp.code(200).header("Content-Type", "application/json; charset=utf-8").send({ factoryAddress: contract });
	});
}

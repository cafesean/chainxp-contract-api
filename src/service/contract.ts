// @dev - contract deployment and configuration services
import { BaseService } from "./base";
import { attachContract, getGasPriceOverrides, getAbiByName } from "../utils";
import { ethers } from "hardhat";
import { getAbiByAddress } from "../utils";
import { encryptPrivateKey } from "@root/src/utils/encryption";
import dotenv from "dotenv";
import * as crypto from "crypto";
dotenv.config();

export class ContractService extends BaseService {
	async version() {
		// get version from db
		const version = await this.prisma.version.findFirst({
			select: {
				version: true,
				chain: true,
			},
			where: {
				id: 1,
			},
		});

		return "Blockchain API v" + version?.version + " on " + version?.chain;
	}
	async network() {
		return "Current network is " + process.env.DEFAULT_NETWORK;
	}

	async grantAccess(walletAddress: string, contractAddress: string, role: string) {
		const overrides = await getGasPriceOverrides(this, 2);
		console.log("	contractAddress: ", contractAddress);
		const proxyContract = await attachContract(contractAddress, true);
		await proxyContract.grantAccess(walletAddress, role, overrides);

		return { result: role + " access granted to " + walletAddress };
	}

	async getContractDetails(contract_address: any) {
		// var data: JSONObject = {};

		// const slot1 = await ethers.provider.getStorageAt(contract_address, 0);
		const [abi, , ,] = await getAbiByName("TokenContract");
		// const abi = this.config.artifacts.tokenAbi;
		if (abi?.toString() === undefined) {
			throw new Error("abi is undefined");
		}
		const contract = new ethers.Contract(contract_address, abi?.toString(), ethers.provider);

		const name = await contract.name();
		const description = await contract.description();
		const symbol = await contract.symbol();
		const baseUri = await contract.baseURI();
		const contractUri = await contract.contractURI();

		const contractJSON = {
			name: name,
			description: description,
			symbol: symbol,
			baseUri: baseUri,
			contractUri: contractUri,
		};

		return contractJSON;
	}

	async updateBaseUri(contract_address: string, base_uri: string) {
		const tokenContract = await attachContract(contract_address, true);

		let response;
		try {
			response = await tokenContract.setBaseURI(base_uri);
			await response.wait();

			return response;
		} catch (e) {
			console.log(e);
			throw e;
		}
	}
	async addAdminUser(contract_address: string, userAddress: string) {
		// const contract = await this.findContract(contract_address);

		const factoryContract = await attachContract(contract_address, true);
		const role = "ADMIN_ROLE";

		const response = await factoryContract.grantUserRole(userAddress, role);
		console.log(`Txn: ${response.hash}`);

		// const contractUser = await this.prisma.contractUser.create({
		//   data: {
		//     contract_address: contract_address,
		//     userId: userAddress,
		//     role: role,
		//   }
		// });
		// await response.wait();

		// return contractUser;
	}

	// async setClassMetadata(contract_address: string, class_id: string, metadata_url: string) {
	// 	await this.findContractClass(contract_address, class_id);

	// 	const factory = new ContractFactory(this.config.artifacts.factoryAbi, this.config.artifacts.factoryBytecode);
	// 	const attachedContract = factory.attach(contract_address);

	// 	const response = await attachedContract.setURI(class_id, metadata_url);
	// 	console.log(`Txn: ${response.hash}`);
	// 	console.log("NFT setURI: ", metadata_url);

	// 	const contract_classes = await this.prisma.xp.update({
	// 		where: {
	// 			contract_address_class_id: {
	// 				contract_address: contract_address,
	// 				class_id: class_id,
	// 			},
	// 		},
	// 		data: {
	// 			metadata_url,
	// 		},
	// 	});
	// 	await response.wait();
	// 	return contract_classes;
	// }

	// get contract Abi
	async getAbi(contract_address: string, isClone: boolean = false) {
		const [abi, , contractName, sourceName] = await getAbiByAddress(contract_address, isClone);

		return { abi: abi, contractName: contractName, sourceName: sourceName };
	}

	async god(contract_address: any, reqBody: any) {
		const classId = reqBody.class_id || "0";
		const name = reqBody.name || "";
		const desc = reqBody.desc || "";
		const baseUri = reqBody.base_uri || "";

		const [signer] = await ethers.getSigners();

		const functionSignature = ethers.utils.id("setClass(uint256,string,string,string)").slice(0, 10);
		const encodedParams = ethers.utils.defaultAbiCoder.encode(["uint256", "string", "string", "string"], [classId, name, desc, baseUri]);
		const data = functionSignature + encodedParams.slice(2); // remove the 0x from encodedParams

		// const tokenContract = await attachContract(this.config.artifacts.tokenAbi as any, this.config.artifacts.tokenBytecode, contract_address, this.config.artifacts.tokenContractName);
		const tx = {
			to: contract_address,
			value: ethers.utils.parseEther("0"), // Sending 0 Ether; change if needed
			data: data,
			gasLimit: 1000000, // Define an appropriate gas limit; adjust as required
		};

		const response = await signer.sendTransaction(tx);
		const receipt = await response.wait();

		console.log("Transaction hash:", response.hash);
		console.log("Transaction was mined in block:", receipt.blockNumber);

		return response;
	}

	// create a function that encrypts a private key using a password from params and an randomly generated IV.
	// Use the decrypt and encrypt functions from encryption.ts
	// Save encrypted key and IV as hex in the database using prisma
	async encryptPrivateKey(address: string, privateKey: string, password: string) {
		// const iv = ethers.utils.randomBytes(16);
		const iv = crypto.randomBytes(16).toString("hex");
		const encrypted = encryptPrivateKey(privateKey, password, iv);

		const encryptedPrivateKey = encrypted;

		// save to database
		const encryptedKey = await this.prisma.forwarder.create({
			data: {
				address: address.toLowerCase(),
				key: encryptedPrivateKey,
				iv: iv.toString(),
			},
		});

		if (encryptedKey) {
			return "Key encrypted";
		}
	}
}

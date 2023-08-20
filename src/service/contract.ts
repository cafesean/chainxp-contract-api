import { BaseService } from "./base";
import * as errors from "../errors";
import { attachContract, addContractAbi } from "../utils";
// import { PrismaClient } from "@prisma/client";
// import { ethers, ContractFactory } from "ethers";
import { ethers } from "hardhat";
// import crypto from "node:crypto";

// import { signer, POLYGON_PROVIDER } from "../constants/env.constants";

import dotenv from "dotenv";
// import { signer} from "@root/constants/env.constants";
dotenv.config();
interface JSONObject {
	[key: string]: any;
}
// const prisma = new PrismaClient();

const zeroAddress = "0x0000000000000000000000000000000000000000";

export class ContractService extends BaseService {
	async version() {
		return "Contract API v" + process.env.VERSION;
	}
	async network() {
		return "Current network is " + process.env.DEFAULT_NETWORK;
	}

	async createContracts(version: string, isDefault: boolean) {
		console.log("Adding delegate contract");


		
		await addContractAbi(
			this.prisma,
			JSON.stringify(this.config.artifacts.delegateAbi),
			this.config.artifacts.delegateBytecode,
			this.config.artifacts.delegateContractName,
			this.config.artifacts.delegateSourceName,
			version,
			isDefault
		);

		console.log("Adding token contract");
		await addContractAbi(
			this.prisma,
			JSON.stringify(this.config.artifacts.tokenAbi),
			this.config.artifacts.tokenBytecode,
			this.config.artifacts.tokenContractName,
			this.config.artifacts.tokenSourceName,
			version,
			isDefault
		);

		console.log("Adding factory contract");
		await addContractAbi(
			this.prisma,
			JSON.stringify(this.config.artifacts.factoryAbi),
			this.config.artifacts.factoryBytecode,
			this.config.artifacts.factoryContractName,
			this.config.artifacts.factorySourceName,
			version,
			isDefault
		);

		console.log("Adding template contract");
		await addContractAbi(
			this.prisma,
			JSON.stringify(this.config.artifacts.templateAbi),
			this.config.artifacts.templateBytecode,
			this.config.artifacts.templateContractName,
			this.config.artifacts.templateSourceName,
			version,
			isDefault
		);

		return "Contract v" + version + " created successfully";
	}

	async addClass(contract_address: string, reqBody: any) {
		const contractProxy = await attachContract(
			this.config.artifacts.tokenAbi as any,
			this.config.artifacts.tokenBytecode,
			contract_address,
			this.config.artifacts.tokenContractName
		);

		let class_id = reqBody.class_id || "0";
		const template_id = reqBody.template_id || zeroAddress;
		const lcaseContractAddress = contract_address.toLowerCase();

		// get series_id
		const series = await this.prisma.series.findFirst({
			select: {
				id: true,
			},
			where: {
				contract_address: contract_address,
			},
		});

		console.log("series?.id: ", series?.id);

		return new Promise(async (resolve, reject) => {
			try {
				const response = await contractProxy._setClass(Number(class_id), reqBody.name, reqBody.desc, "", template_id);
				const receipt = await response.wait();
				console.log("Receipt: ", receipt);

				for (const event of receipt.events) {
					if (event.eventSignature === "ClassUpdated(string,uint256)") {
						const arg = event.args[1]; // uint256 value is 2nd arg in array as hex value
						class_id = arg.toString();
					}
				}

				const newXp = await this.prisma.xp.upsert({
					where: {
						contract_address_class_id: {
							contract_address: lcaseContractAddress,
							class_id: class_id,
						},
					},
					create: {
						class_id: class_id,
						series_id: series?.id,
						contract_address: lcaseContractAddress,
						title: reqBody.name,
						description: reqBody.desc,
						requirements: reqBody.requirements,
						image_url: reqBody.image_url,
						slug: reqBody.slug,
						status: 1,
					},
					update: {
						title: reqBody.name,
						description: reqBody.desc,
						requirements: reqBody.requirements,
						image_url: reqBody.image_url,
						slug: reqBody.slug,
						status: 1,
					},
					include: {
						series: {
							select: {
								id: true,
							},
						},
					},
				});

				resolve({ xp_id: newXp.id, class_id: class_id });
			} catch (e) {
				console.log(e);
				reject(new Error("Error creating class:" + e));
			}
		});
	}

	async addAdminUser(contract_address: string, userAddress: string) {
		// const contract = await this.findContract(contract_address);

		const factoryContract = await attachContract(
			this.config.artifacts.factoryAbi as any,
			this.config.artifacts.factoryBytecode,
			contract_address,
			this.config.artifacts.factoryContractName
		);
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

	async mintNFT(contract_address: string, class_id: string, user_address: string) {
		// await this.findContractClass(contract_address, class_id);

		const tokenContract = await attachContract(
			this.config.artifacts.tokenAbi as any,
			this.config.artifacts.tokenBytecode,
			contract_address,
			this.config.artifacts.tokenContractName
		);

		// const factory = await ethers.getContractFactory(ProxySol);
		// const factoryContract = factory.attach(contract_address);

		const [signer] = await ethers.getSigners();
		let response;
		try {
			response = await tokenContract.mint(user_address, Number(class_id));
		} catch (e) {
			console.log(e);
			throw e;
		}

		let _returnedClassId;
		let _returnedClassTokenId;

		const receipt = await response.wait();
		console.log("Receipt: ", receipt);
		for (const event of receipt.events) {
			if (event.eventSignature === "TokenCreated(address,uint256,uint256)") {
				const argClassId = event.args[1]; // uint256 value is 2nd arg in array as hex value
				const argClassTokenId = event.args[2]; // uint256 value is 2nd arg in array as hex value
				_returnedClassId = argClassId.toString();
				_returnedClassTokenId = argClassTokenId.toString();
			}
		}

		console.log("_returnedClassId = ", _returnedClassTokenId);
		console.log("_returnedClassTokenId = ", _returnedClassTokenId);

		// const prisma = new PrismaClient();

		const txn = [
			{
				txn_hash: response.hash, // must be unique
				contract_address, // required
				class_id: _returnedClassId, // must be string
				token_id: _returnedClassTokenId + "", // must be string
				from: await signer.getAddress(), // required
				to: user_address, // required
				status: -1,
			},
		];

		for (const t of txn) {
			const transaction = await this.prisma.transaction.create({
				data: t,
			});
			console.log(`Created transaction with hash: ${transaction.txn_hash}`);
		}

		// const allowlist = await this.prisma.allowlist.updateMany({
		// 	data: {
		// 		// txn_hash: response.hash,
		// 		token_id,
		// 		is_owned: true,
		// 	},
		// 	where: {
		// 		contract_address,
		// 		class_id,
		// 		user_address,
		// 	},
		// });

		// console.log("before await");
		// await response.wait();
		// console.log("transaction: ", transaction);

		return txn;
	}

	async transferNFT(
		signerAddress: string,
		contract_address: string,
		class_id: string,
		from: string,
		to: string,
		amount: number
	) {
		await this.findContractClass(contract_address, class_id);

		// const [deployer] = await ethers.getSigners();

		// const [signer] = await ethers.getSigners();
		// const factory = await ethers.getContractFactory(this.config.artifacts.factoryContractName);

		// const factory = ethers.getContractFactory(this.config.artifacts.tokenAbi as any, signer as any);
		// const factoryContract = factory.attachContract(this.config.artifacts.tokenAbi, contract_address, this.config.artifacts.factoryContractName
		const factoryContract = await attachContract(
			this.config.artifacts.tokenAbi as any,
			this.config.artifacts.tokenBytecode,
			contract_address,
			this.config.artifacts.tokenContractName
		);
		const response = await factoryContract.safeTransferFrom(from, to, class_id, amount, 6);
		console.log(`transfer NFT from '${from}' to '${to}' Txn: ${response.hash}`);
		// await response.wait(2);

		const lcaseContractAddress = contract_address.toLowerCase();
		// note: add token_id
		const transaction = await this.prisma.transaction.create({
			data: {
				txn_hash: response.hash,
				contract_address: lcaseContractAddress,
				class_id: class_id,
				from: from,
				to: to,
				status: -1,
			},
		});
		// await response.wait();
		return transaction;
	}

	async burnNFT(
		signerAddress: string,
		contract_address: string,
		class_id: string,
		userAddress: string,
		amount: number
	) {
		await this.findContractClass(contract_address, class_id);

		const lcaseContractAddress = contract_address.toLowerCase();
		// const [signer] = await ethers.getSigners();
		// const [deployer] = await ethers.getSigners();r);
		// const factory = ethers.getContractFactory(this.config.artifacts.tokenAbi as any, signer as any);
		const factoryContract = await attachContract(
			this.artifacts.factoryAbi,
			this.artifacts.factoryBytecode,
			lcaseContractAddress,
			this.artifacts.factoryContractName
		);

		const response = await factoryContract.burn(userAddress, class_id, amount);
		console.log(`burn NFT from '${userAddress}' Txn: ${response.hash}`);

		// note: add token_id
		const transaction = await this.prisma.transaction.create({
			data: {
				txn_hash: response.hash,
				contract_address: lcaseContractAddress,
				class_id: class_id,
				from: signerAddress,
				to: userAddress,
				status: -1,
			},
		});
		await response.wait();
		return transaction;
	}

	async verify(txn_hash: string): Promise<number> {
		const transaction = await this.prisma.transaction.findUnique({
			where: {
				txn_hash,
			},
		});

		if (!transaction) {
			throw errors.create(errors.StatusCodes.NOT_FOUND);
		}

		const status = await this.polygon.scanTransaction(transaction.txn_hash);

		await this.prisma.transaction.update({
			where: {
				txn_hash,
			},
			data: {
				status,
			},
		});

		return status;
	}

	async findContract(contract_address: string) {
		const lcaseContractAddress = contract_address.toLowerCase();
		const data = await this.prisma.series.findFirst({
			where: {
				contract_address: {
					equals: lcaseContractAddress,
				},
			},
		});
		if (!data) {
			throw errors.create(errors.StatusCodes.NOT_FOUND);
		}
		return data.contract_address;
	}

	async findContractClass(contract_address: string, class_id: string) {
		const lcaseContractAddress = contract_address.toLowerCase();
		const contract_classes = await this.prisma.xp.findFirst({
			where: {
				contract_address: lcaseContractAddress,
				class_id: class_id,
			},
			select: {
				contract_address: true,
			},
		});
		if (!contract_classes) {
			throw errors.create(errors.StatusCodes.NOT_FOUND);
		}
		return contract_classes;
	}

	async updateBaseUri(contract_address: string, base_uri: string) {
		const tokenContract = await attachContract(
			this.config.artifacts.tokenAbi as any,
			this.config.artifacts.tokenBytecode,
			contract_address,
			this.config.artifacts.tokenContractName
		);

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

	async getUris(contract_address: any, from: number, to: number) {
		var i;
		var data: JSONObject = {};
		const tokenContract = await attachContract(
			this.config.artifacts.tokenAbi as any,
			this.config.artifacts.tokenBytecode,
			contract_address,
			this.config.artifacts.tokenContractName
		);

		try {
			for (i = from; i <= to; i++) {
				data["uri" + i] = await tokenContract.uri(i);

				// base64 decode the uri then encode to utf-8
				const uriString = Buffer.from(data["uri" + i].slice(29), "base64").toString("utf-8");
				data["uri" + i] = uriString;


			}
			return data;
		} catch (err) {
			return err;
		}
	}

	async getContractDetails(contract_address: any) {
		// var data: JSONObject = {};

		// const slot1 = await ethers.provider.getStorageAt(contract_address, 0);
		const abi = this.config.artifacts.tokenAbi;
		const contract = new ethers.Contract(contract_address, abi, ethers.provider);

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

	async setAttributes(contract_address: any, count: number) {
		const tokenContract = await attachContract(
			this.config.artifacts.tokenAbi as any,
			this.config.artifacts.tokenBytecode,
			contract_address,
			this.config.artifacts.tokenContractName
		);
		var i;
		try {
			for (i = 1; i <= count; i++) {
				await tokenContract.setAttributes(i, [i], [1], [], []);
				// await contractNFT.setAttributes(i, [1,2],[23,35],[1,2,3,4,5,6],["2020","Shanghai","Member","12","Jr. Backend Developer","No"]);
			}
			return "success";
		} catch (err) {
			return err;
		}
	}

	async getUsers(contract: any, from: number, to: number) {
		var i;
		var data: JSONObject = {};
		try {
			for (i = from; i <= to; i++) {
				data["user" + i] = await contract.users(i);
			}
			return data;
		} catch (err) {
			return err;
		}
	}

	async getClasses(contract_address: any, from: number, to: number) {
		const tokenContract = await attachContract(
			this.config.artifacts.tokenAbi as any,
			this.config.artifacts.tokenBytecode,
			contract_address,
			this.config.artifacts.tokenContractName
		);
		var i;
		var data: JSONObject = {};
		// const [owner] = await ethers.getSigners();
		try {
			for (i = from; i <= to; i++) {
				data["class" + i] = await tokenContract.classes(i);
			}
			return data;
		} catch (err) {
			return err;
		}
	}
	async getAttributes(contract_address: any, from: number, to: number) {
		const tokenContract = await attachContract(
			this.config.artifacts.tokenAbi as any,
			this.config.artifacts.tokenBytecode,
			contract_address,
			this.config.artifacts.tokenContractName
		);
		var i;
		var data: JSONObject = {};
		try {
			for (i = from; i <= to; i++) {
				data["attribute" + i] = await tokenContract._attributes(i);
			}
			return data;
		} catch (err) {
			return err;
		}
	}

	// async speedupTransactionOverrides(txnHash: string) {
	// 	const txn = await ethers.provider.getTransaction(txnHash);

	// 	if (txn === null) {
	// 		throw new Error(`Transaction not found: ${txnHash}`);
	// 	}
	// 	const gasPrice = await this.getSpeedGasPrice(txn.gasPrice);
	// 	const overrides = {
	// 		nonce: txn.nonce,
	// 		gasPrice: gasPrice,
	// 	};

	// 	return overrides;
	// }

	// async getSpeedGasPrice(oldGasPrice: any) {
	// 	let gasPrice = await ethers.provider.getGasPrice();

	// 	const fastGasPrice = await this.polygon.scanGasTrackerPrice(2);
	// 	if (fastGasPrice > 0) {
	// 		gasPrice = ethers.BigNumber.from(fastGasPrice * 1e9);
	// 	}

	// 	if (Number(gasPrice) < Number(oldGasPrice)) {
	// 		gasPrice = oldGasPrice.add(oldGasPrice.div(9));
	// 	}
	// 	return gasPrice;
	// }

	// async getGasPriceOverrides(level: number = 1) {
	// 	// get gas price from polygon scan
	// 	const scanGasPrice = await this.polygon.scanGasTrackerPrice(level);
	// 	if (scanGasPrice > 0) {
	// 		const gasPrice = ethers.BigNumber.from(scanGasPrice * 1e9);
	// 		return { gasPrice };
	// 	}

	// 	// get gas price from rpc network
	// 	const defaultGasPrice = await ethers.provider.getGasPrice();
	// 	const gasPrice = defaultGasPrice.add(defaultGasPrice.div(2).mul(level));
	// 	return { gasPrice };
	// }
}

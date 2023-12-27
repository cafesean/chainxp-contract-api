// @dev - on-chain transactions for series creation and configuration
import { BaseService } from "./base";
import { attachContract, getGasPriceOverrides } from "../utils";
// import { getForwarderWalletAddressFromClone } from "../utils/contract.utils";
import * as errors from "../errors";
import { ethers } from "hardhat";
import dotenv from "dotenv";

dotenv.config();
interface JSONObject {
	[key: string]: any;
}

// const zeroAddress = "0x0000000000000000000000000000000000000000";

export class SeriesService extends BaseService {
	async network() {
		// get current network and chain from ethers
		const network = await ethers.provider.getNetwork();
		return "Current network is " + network.name + " on chain ID " + network.chainId;
	}

	async addClass(signer: any, contract_address: string, reqBody: any) {
		let contractProxy: any;
		let overrides: any;
		let class_id: string;
		let lcaseContractAddress: string;
		let series: any;

		class_id = reqBody.class_id || "0";
		lcaseContractAddress = contract_address.toLowerCase();

		try {
			contractProxy = await attachContract(contract_address, signer, true);
			overrides = await getGasPriceOverrides(this, 2);

			// get series_id
			series = await this.prisma.series.findUnique({
				select: {
					id: true,
				},
				where: {
					contract_address: contract_address,
				},
			});
		} catch (error) {
			throw new Error("Failed to add class: " + error);
		}

		console.log("series?.id: ", series?.id);

		return new Promise(async (resolve, reject) => {
			try {
				const response = await contractProxy._setClass(Number(class_id), reqBody.name, reqBody.desc, "", overrides);
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

				resolve({ xpId: newXp.id, classId: class_id });
			} catch (e) {
				console.log(e);
				reject(new Error("Error creating class:" + e));
			}
		});
	}

	async addAttributes(signer: any, contractAddress: string, xpId: number, reqBody: any) {
		let contractProxy: any;
		let overrides: any;
		// let attribute_id: string;
		// let class_id: string;
		// let name: string;
		// let value: string;
		// let lcaseContractAddress: string;
		let xp: any;

		let attributes = reqBody.attributes;

		let ids = attributes.map((attribute: { id: number }) => attribute.id);
		let names = attributes.map((attribute: { name: string }) => attribute.name);
		let values = attributes.map((attribute: { value: string }) => attribute.value);

		try {
			xp = await this.prisma.xp.findUnique({
				where: {
					id: xpId,
				},
			});
		} catch (error) {
			throw new Error("Failed to add attribute: " + error);
		}

		contractProxy = await attachContract(xp?.contract_address, signer, true);
		overrides = await getGasPriceOverrides(this, 2);

		return new Promise(async (resolve, reject) => {
			try {
				const response = await contractProxy.setAttributes(Number(xp?.class_id), ids, names, values, overrides);
				
				// const response = await contractProxy.setAttributes(1,[1,2,3],["name1","name2","name3"],["value1","value2","value3"], overrides);
				const receipt = await response.wait();
				console.log("Receipt: ", receipt);

				// for (const event of receipt.events) {
				// 	if (event.eventSignature === "AttributeUpdated(string,uint256)") {
				// 		const arg = event.args[1]; // uint256 value is 2nd arg in array as hex value
				// 		attribute_id = arg.toString();
				// 	}
				// }

				resolve({ response: response });
			} catch (e) {
				console.log(e);
				reject(new Error("Error creating attribute:" + e));
			}
		});
	}

	async addAttribute(signer: any, contractAddress: string, xpId: number, reqBody: any) {
		let contractProxy: any;
		let overrides: any;
		let attribute_id: string;
		// let class_id: string;
		let name: string;
		let value: string;
		// let lcaseContractAddress: string;
		let xp: any;

		// class_id = reqBody.class_id || "0";
		attribute_id = reqBody.attribute_id || "0";
		name = reqBody.name || "";
		value = reqBody.value || "";
		// lcaseContractAddress = contract_address.toLowerCase();

		try {
			xp = await this.prisma.xp.findUnique({
				where: {
					id: xpId,
				},
			});
		} catch (error) {
			throw new Error("Failed to add attribute: " + error);
		}

		contractProxy = await attachContract(xp?.contract_address, signer, true);
		overrides = await getGasPriceOverrides(this, 2);

		return new Promise(async (resolve, reject) => {
			try {
				const response = await contractProxy._setAttribute(
					Number(xp?.class_id),
					Number(attribute_id),
					name,
					value,
					overrides
				);
				const receipt = await response.wait();
				console.log("Receipt: ", receipt);

				for (const event of receipt.events) {
					if (event.eventSignature === "AttributeUpdated(string,uint256)") {
						const arg = event.args[1]; // uint256 value is 2nd arg in array as hex value
						attribute_id = arg.toString();
					}
				}

				resolve({ response: response });
			} catch (e) {
				console.log(e);
				reject(new Error("Error creating attribute:" + e));
			}
		});
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

	async getClasses(deployer: any, contract_address: any, from: number, to: number) {
		const tokenContract = await attachContract(contract_address, deployer, true);
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
	async getAttributes(deployer: any, contract_address: any, classId: number, from: number, to: number) {
		const tokenContract = await attachContract(contract_address, deployer, true);
		try {
			var i;
			var data: JSONObject = {};
			for (i = from; i <= to; i++) {
				data["attribute" + i] = await tokenContract._attributes(classId, i);
			}
			return data;
		} catch (err) {
			return err;
		}
	}

	async god(deployer: any, contract_address: any, reqBody: any) {
		const classId = reqBody.class_id || "0";
		const name = reqBody.name || "";
		const desc = reqBody.desc || "";
		const baseUri = reqBody.base_uri || "";

		// const [signer] = await ethers.getSigners();

		const functionSignature = ethers.utils.id("setClass(uint256,string,string,string,address)").slice(0, 10);
		const encodedParams = ethers.utils.defaultAbiCoder.encode(
			["uint256", "string", "string", "string", "address"],
			[classId, name, desc, baseUri]
		);
		const data = functionSignature + encodedParams.slice(2); // remove the 0x from encodedParams

		// const tokenContract = await attachContract(this.config.artifacts.tokenAbi as any, this.config.artifacts.tokenBytecode, contract_address, this.config.artifacts.tokenContractName);
		const tx = {
			to: contract_address,
			value: ethers.utils.parseEther("0"), // Sending 0 Ether; change if needed
			data: data,
			gasLimit: 1000000, // Define an appropriate gas limit; adjust as required
		};

		const response = await deployer.sendTransaction(tx);
		const receipt = await response.wait();

		console.log("Transaction hash:", response.hash);
		console.log("Transaction was mined in block:", receipt.blockNumber);

		return response;
	}
}

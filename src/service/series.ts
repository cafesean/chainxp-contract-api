// @dev - on-chain transactions for series creation and configuration
import { BaseService } from "./base";
import { attachContract, getGasPriceOverrides } from "../utils";
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

	async addClass(contract_address: string, reqBody: any) {
		const contractProxy = await attachContract(contract_address, true);
		const overrides = await getGasPriceOverrides(this, 2);
		let class_id = reqBody.class_id || "0";
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

				resolve({ xp_id: newXp.id, class_id: class_id });
			} catch (e) {
				console.log(e);
				reject(new Error("Error creating class:" + e));
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


	async setAttributes(contract_address: any, count: number) {
		const tokenContract = await attachContract(contract_address, true);
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
		const tokenContract = await attachContract(contract_address, true);
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
		const tokenContract = await attachContract(contract_address, true);
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


	async god(contract_address: any, reqBody: any) {
		const classId = reqBody.class_id || "0";
		const name = reqBody.name || "";
		const desc = reqBody.desc || "";
		const baseUri = reqBody.base_uri || "";

		const [signer] = await ethers.getSigners();

		const functionSignature = ethers.utils.id("setClass(uint256,string,string,string,address)").slice(0, 10);
		const encodedParams = ethers.utils.defaultAbiCoder.encode(["uint256", "string", "string", "string", "address"], [classId, name, desc, baseUri]);
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

}

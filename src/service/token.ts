// @dev - user's on-chain transactions services
import { BaseService } from "./base";
import { attachContract, getGasPriceOverrides, getAbiByName } from "../utils";
import * as errors from "../errors";
import { ethers } from "hardhat";
import dotenv from "dotenv";

dotenv.config();
interface JSONObject {
	[key: string]: any;
}
// const zeroAddress = "0x0000000000000000000000000000000000000000";

export class TokenService extends BaseService {

	async mintNFT(contract_address: string, class_id: string, user_address: string) {
		// await this.findContractClass(contract_address, class_id);

		const tokenContract = await attachContract(contract_address);
		const overrides = await getGasPriceOverrides(this, 2);
		// const factory = await ethers.getContractFactory(ProxySol);
		// const factoryContract = factory.attach(contract_address);

		const [signer] = await ethers.getSigners();

		const response = await tokenContract.mint(user_address, Number(class_id), overrides);

		let _returnedClassId;
		let _amount;

		const receipt = await response.wait();
		console.log("Receipt: ", receipt);
		for (const event of receipt.events) {
			if (event.eventSignature === "TokenCreated(address,uint256,uint256)") {
				const argClassId = event.args[1]; // uint256 value is 2nd arg in array as hex value
				const argAmount = event.args[2]; // uint256 value is 2nd arg in array as hex value
				_returnedClassId = argClassId.toString();
				_amount = argAmount.toString();
			}
		}

		// const prisma = new PrismaClient();

		const transaction = await this.prisma.transaction.create({
			data: {
				txn_hash: response.hash,
				nonce: response.nonce,
				contract_address,
				class_id: _returnedClassId,
				amount: _amount,
				from: await signer.getAddress(),
				to: user_address,
				status: -1,
			},
		});
		console.log(`Created transaction with hash: ${transaction.txn_hash}`);

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

		return transaction;
	}

	// write a function that checks wallet for balance of a token using ethers, then return true or false
	async getBalance(contract_address: any, user_address: any) {
		const [abi, , ,] = await getAbiByName("TokenContract");

		if (abi === undefined) {
			throw new Error("abi is undefined");
		}
		const contract = new ethers.Contract(contract_address, abi, ethers.provider);
		const balance = await contract.balanceOf(user_address);
		return balance;
	}


	async getUris(contract_address: any, from: number, to: number) {
		var i;
		var data: JSONObject = {};
		const tokenContract = await attachContract(contract_address);

		try {
			for (i = from; i <= to; i++) {
				data["uri" + i] = await tokenContract.uri(i);

				// base64 decode the uri then encode to utf-8
				// const uriString = Buffer.from(data["uri" + i].slice(29), "base64").toString("utf-8");
				const uriString = data["uri" + i];
				data["uri" + i] = uriString;
			}
			return data;
		} catch (err) {
			return err;
		}
	}

	async transfer(contract_address: string, class_id: string, from: string, to: string, amount: number) {
		// const [deployer] = await ethers.getSigners();

		// const [signer] = await ethers.getSigners();
		// const factory = await ethers.getContractFactory(this.config.artifacts.factoryContractName);

		// const factory = ethers.getContractFactory(this.config.artifacts.tokenAbi as any, signer as any);
		// const factoryContract = factory.attachContract(this.config.artifacts.tokenAbi, contract_address, this.config.artifacts.factoryContractName
		let _returnedClassId;
		let _amount;

		const tokenContract = await attachContract(contract_address);

		const response = await tokenContract.safeTransferFrom(from, to, class_id, amount, "0x00");
		console.log(`transfer NFT from '${from}' to '${to}' Txn: ${response.hash}`);
		// await response.wait(2);

		const lcaseContractAddress = contract_address.toLowerCase();
		// note: add token_id

		const receipt = await response.wait();
		for (const event of receipt.events) {
			if (event.eventSignature === "TokenTxn(string,address,address,uint256,uint256)") {
				const argClassId = event.args[3]; // uint256 value is 2nd arg in array as hex value
				const argAmount = event.args[4]; // uint256 value is 2nd arg in array as hex value
				_returnedClassId = argClassId.toString();
				_amount = argAmount.toString();
			}
		}

		const txn = [
			{
				txn_hash: response.hash,
				nonce: response.nonce,
				contract_address: lcaseContractAddress,
				class_id: _returnedClassId,
				amount: _amount,
				from: from,
				to: to,
				status: -1,
			},
		];

		for (const t of txn) {
			const transaction = await this.prisma.transaction.create({
				data: t,
			});
			console.log(`Created transaction with hash: ${transaction.txn_hash}`);
		}
		return response;
	}

	async burn(contract_address: string, class_id: string, userAddress: string, amount: number) {
		const [signer] = await ethers.getSigners();

		const lcaseContractAddress = contract_address.toLowerCase();
		// const [signer] = await ethers.getSigners();
		// const factory = ethers.getContractFactory(this.config.artifacts.tokenAbi as any, signer as any);
		const tokenContract = await attachContract(contract_address);

		const response = await tokenContract.burn(userAddress, class_id, amount);
		console.log(`burn NFT from '${userAddress}' Txn: ${response.hash}`);

		let _returnedClassId;
		let _amount;
		const receipt = await response.wait();
		for (const event of receipt.events) {
			if (event.eventSignature === "TokenTxn(string,address,address,uint256,uint256)") {
				console.log("event.args[0] = ", event.args[0]);
				console.log("event.args[1] = ", event.args[1]);
				console.log("event.args[2] = ", event.args[2]);
				console.log("event.args[3] = ", event.args[3]);
				console.log("event.args[4] = ", event.args[4]);
				const argClassId = event.args[3]; // uint256 value is 2nd arg in array as hex value
				const argAmount = event.args[4]; // uint256 value is 2nd arg in array as hex value
				_returnedClassId = argClassId.toString();
				_amount = argAmount.toString();
			}
		}
		console.log("receipt = ", receipt);
		const txn = [
			{
				txn_hash: response.hash,
				nonce: response.nonce,
				contract_address: lcaseContractAddress,
				class_id: _returnedClassId,
				amount: _amount,
				from: signer.address,
				to: "0x0",
				status: -1,
			},
		];

		for (const t of txn) {
			const transaction = await this.prisma.transaction.create({
				data: t,
			});
			console.log(`Created transaction with hash: ${transaction.txn_hash}`);
		}
		return response;
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

}
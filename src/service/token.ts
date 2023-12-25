// @dev - user's on-chain transactions services
import { BaseService } from "./base";
import { attachContract, getAbiByName, getGasPriceOverrides } from "../utils";
import * as errors from "../errors";
import { ethers } from "hardhat";
import dotenv from "dotenv";
import { IForwardRequest } from "./forward.type";
// import { decryptPrivateKey } from "../utils/encryption";
import { getForwarderWalletKeyFromClone } from "../utils/contract.utils";

dotenv.config();
interface JSONObject {
	[key: string]: any;
}
// const zeroAddress = "0x0000000000000000000000000000000000000000";

export class TokenService extends BaseService {
	async mint(contract_address: string, class_id: string, user_address: string, signedRequest: IForwardRequest) {
		// await this.findContractClass(contract_address, class_id);

		const tokenContract = await attachContract(contract_address, null, true);
		const overrides = await getGasPriceOverrides(this, 2);

		console.log("signedRequest: ", signedRequest);
		const { calldata, sender, sign }: IForwardRequest = signedRequest;

		// ERC2771 Forwarder
		const verified = sender === ethers.utils.verifyMessage(calldata, sign);

		// get signer based on correct forwarder
		const orgTierId = await this.prisma.series.findMany({
			where: {
				contract_address: contract_address,
			},
			select: {
				org: {
					select: {
						tier_id: true,
					},
				},
			},
		});

		if (!orgTierId[0]?.org?.tier_id) {
			return { error: "No org tier Id" };
		}

		// const tierId = orgTierId[0]?.org?.tier_id;

		// get forwarder based on tier Id
		const forwarderWalletKey = await getForwarderWalletKeyFromClone(contract_address);
		// get signer using private key
		const forwarderSigner = new ethers.Wallet(forwarderWalletKey, ethers.provider);

		// Verify signature
		if (!verified) {
			return { error: "Invalid signature" };
		}
		const forwardCalldata = calldata.concat(sender.slice(2));
		// const [signer] = await ethers.getSigners();


		console.log("forwarderSigner: ", forwarderSigner);
		console.log("forwarder address:", forwarderSigner?.address);

		console.log("-- contract_address: ", contract_address);
		console.log("-- forwardCalldata: ", forwardCalldata);
		// Creating a transaction param
		const tx = {
			to: contract_address,
			data: forwardCalldata,
		};
		console.log("tx: ", tx);
		console.log("overrides: ", overrides);
		const mergedTx = {
			...tx,
			...overrides,
		};
		console.log("mergedTx: ", mergedTx);
		const response = await forwarderSigner.sendTransaction(mergedTx);
		const receipt = await response.wait();

		console.log("response: ", response);
		console.log("receipt: ", receipt);

		const logs = receipt.logs.filter((log) => log.address.toLowerCase() === contract_address.toLowerCase());
		const events = logs.map((log) => tokenContract.interface.parseLog(log));

		// const response = await tokenContract.mint(user_address, Number(class_id), overrides);
		let _returnedClassId;
		let _classTokenId;
		if (!receipt || receipt === undefined) {
			return { error: "response is undefined" };
		}
		for (const LogDescription of events) {
			console.log("LogDescription: ", LogDescription);
			if (LogDescription.signature === "TokenCreated(address,uint256,uint256)") {
				const argClassId = LogDescription.args[1]; // uint256 value is 2nd arg in array as hex value
				const argClassTokenId = LogDescription.args[2]; // uint256 value is 2nd arg in array as hex value
				_returnedClassId = argClassId.toString();
				_classTokenId = argClassTokenId.toString();
			}
		}

		if (_returnedClassId === undefined) {
			return { error: "No classId; mint failed" };
		}

		const transaction = await this.prisma.transaction.create({
			data: {
				txn_hash: response.hash,
				nonce: response.nonce,
				contract_address,
				class_id: _returnedClassId,
				token_id: _classTokenId,
				from: await forwarderSigner.getAddress(),
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

		if (abi?.toString() === undefined) {
			throw new Error("abi is undefined");
		}
		const contract = new ethers.Contract(contract_address, abi?.toString(), ethers.provider);
		const balance = await contract.balanceOf(user_address);
		return balance;
	}

	async getUris(contract_address: any, from: number, to: number) {
		var i;
		var data: JSONObject = {};
		const tokenContract = await attachContract(contract_address, null, true);

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

		const tokenContract = await attachContract(contract_address, null, true);

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
		const tokenContract = await attachContract(contract_address, null, true);

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

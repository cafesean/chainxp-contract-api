// @dev - contract deployment and configuration services
import { BaseService } from "./base";
import { attachContract, getGasPriceOverrides, addContractAbi, getAbiByName } from "../utils";
import { ethers } from "hardhat";
import { getAbiByCache } from "../utils";
import dotenv from "dotenv";
dotenv.config();

interface JSONObject {
	[key: string]: any;
}

export class ContractService extends BaseService {
	async version() {
		return "Contract API v" + process.env.VERSION;
	}
	async network() {
		return "Current network is " + process.env.DEFAULT_NETWORK;
	}

	async cloneProxy(reqBody: any) {
		const { series_id, factory_address, contract_address, delegate_address, template_address, title, baseUri, description, symbol } = reqBody;

		const [signer] = await ethers.getSigners();

		const overrides = await getGasPriceOverrides(this, 2);
		// const utils = ethers.utils;
		// const random = crypto.randomBytes(8).toString("hex");
		// const uuid = crypto.randomUUID();

		// const salt = ethers.utils.formatBytes32String(random.toString());

		let addressClone;

		const contractFactory = await attachContract(factory_address);
		const response = await contractFactory.createClone(contract_address);

		const receipt = await response.wait(); // response is empty if using hardhat network

		const [abi, bytecode, contractName, sourceName] = await getAbiByName("TokenContract");
		// console.log("response=", await receipt.events);
		for (const event of receipt.events) {
			if (event.event === "ProxyCloned") {
				addressClone = event.args.cloneAddress.toLowerCase();
			}
		}

		try {
			await this.prisma.contract.create({
				data: {
					type: "clone",
					name: contractName || "",
					contract_address: addressClone.toLowerCase(),
					contract_name: contractName,
					source_name: sourceName,
					owner_address: await signer.getAddress(),
					abi: abi,
					bytecode: bytecode,
				},
			});
		} catch (error) {
			console.log("contractData Error: ", error);
		}

		// initialize clone
		const contractClone = await attachContract(addressClone);
		await contractClone.initialize(signer.address, title, baseUri, description, symbol, overrides).then((tx: any) => tx.wait());

		// configure with delegate
		const delegateContract = await attachContract(delegate_address);

		await contractClone.setDelegateAddress(delegate_address, overrides);
		await delegateContract.grantAccess(addressClone, "ADMIN_ROLE", overrides).then((tx: any) => tx.wait());

		const contractTemplate = await attachContract(template_address);

		// configure with template
		await contractClone.setDefaultTemplate(template_address, overrides).then((tx: any) => tx.wait());
		await contractClone.grantAccess(template_address, "ADMIN_ROLE", overrides).then((tx: any) => tx.wait());
		await contractClone.setTemplateContract(1, template_address, overrides).then((tx: any) => tx.wait());
		await contractTemplate.authorizeCallingContract(signer.address, addressClone, overrides).then((tx: any) => tx.wait());
		console.log("Clone config done");

		const seriesData = await this.prisma.series.upsert({
			where: {
				id: Number(series_id),
			},
			create: {
				title: title || "",
				contract_address: addressClone.toLowerCase(),
				delegate_address: delegate_address.toLowerCase(),
				owner: await signer.getAddress(),
				status: 1,
			},
			update: {
				id: Number(series_id),
				contract_address: addressClone.toLowerCase(),
				delegate_address: delegate_address.toLowerCase(),
				owner: await signer.getAddress(),
				status: 1,
			},
			select: {
				id: true,
				title: true,
			},
		});

		if (!seriesData) {
			return { "result:": "upsert error" };
		}

		// const series_id = seriesData?.id;
		console.log("Clone address: ", addressClone);
		// return new clone (series)
		return { "clone address": addressClone, series_id: seriesData?.id };
	}

	async deploy(name: string) {
		const formattedContractName = name.charAt(0).toUpperCase() + name.slice(1) + "Contract";
		const [abi, bytecode, contractName, sourceName] = await getAbiByName(formattedContractName);

		const contractFullName = sourceName + ":" + contractName;
		const [signer] = await ethers.getSigners();
		const factory = await ethers.getContractFactory(contractFullName);
		const overrides = await getGasPriceOverrides(this, 2);
		const newContract = await factory.deploy(overrides);
		await newContract.deployed();

		console.log("Deployed %s: %s", contractFullName, newContract.address);

		try {
			await this.prisma.contract.create({
				data: {
					name: contractName || "",
					contract_address: newContract.address.toLowerCase(),
					contract_name: contractName,
					source_name: sourceName,
					owner_address: await signer.getAddress(),
					abi: abi,
					bytecode: bytecode,
				},
			});
		} catch (error) {
			console.log("contractData Error: ", error);
		}
		return newContract;
	}

	async deployFactory(reqBody: any) {
		// var contractFactory;
		// var addressFactory;

		const { proxy_address } = reqBody;
		const newFactory = await this.deploySingle("Factory", null);

		const overrides = await getGasPriceOverrides(this, 2);
		// try {
		// contractFactory = await this.deploy("Factory");
		// console.log("	contractFactory owner: ", await contractFactory.owner());
		// console.log("	ProxyFactory address: ", contractFactory.address);
		// addressFactory = contractFactory.address;
		// await newFactory.initialize();
		// attach initial token proxy contract and register newly deployed factory
		const proxyContract = await attachContract(proxy_address);

		//register factory
		await proxyContract.registerFactory(newFactory.address, overrides);
		// } catch (error) {
		// }

		return newFactory.address;
	}

	async deployAll(name: string, baseUri: string, description: string, symbol: string) {
		const [deployer] = await ethers.getSigners();

		const overrides = await getGasPriceOverrides(this, 2);
		// deploy delegate
		const initEmptyOptions = [""];
		const contractDelegate = await this.deploySingle("delegate", initEmptyOptions); // #1 Delegate

		// deploy proxy
		const initProxyOptions = [name, baseUri, description, symbol];
		const contractProxy = await this.deploySingle("token", initProxyOptions); // #2 Proxy

		// deploy template and set as default
		const contractTemplate = await this.deploySingle("template", initEmptyOptions); // #3 Template

		// const response = await this.configureProxy(contractProxy.address, contractDelegate.address, contractTemplate.address);
		// return response;
		// configure proxy
		await contractProxy.setDelegateAddress(contractDelegate.address, overrides);
		await contractDelegate.grantAccess(deployer.address, "ADMIN_ROLE", overrides);
		const setDefaultTemplate = await contractProxy.setDefaultTemplate(contractTemplate.address);

		console.log("setDefaultTemplate - chainId: ", setDefaultTemplate.chainId);

		await contractProxy.grantAccess(contractTemplate.address, "ADMIN_ROLE", overrides);
		await contractProxy.setTemplateContract(1, contractTemplate.address, overrides);
		console.log("Config done");

		return { proxy_address: contractProxy.address, template_address: contractTemplate.address, delegate_address: contractDelegate.address };
	}

	async deploySingle(contractName: string, options: any) {
		const newContract = await this.deploy(contractName);

		const overrides = await getGasPriceOverrides(this, 2);
		const [deployer] = await ethers.getSigners();
		switch (contractName) {
			case "template":
				break;
			case "token":
				await newContract.initialize(deployer.address, ...options, overrides);
				break;
			default:
				await newContract.initialize(overrides);
				break;
		}
		return newContract;
	}

	async configureProxy(proxyAddress: any, delegateAddress: any, templateAddress: any) {
		// configure proxy
		const [deployer] = await ethers.getSigners();

		const overrides = await getGasPriceOverrides(this, 2);
		console.log("	proxyAddress: ", proxyAddress);
		const proxyContract = await attachContract(proxyAddress);
		await proxyContract.setDelegateAddress(delegateAddress, overrides);

		console.log("	proxyAddress: ", delegateAddress);
		const delegateContract = await attachContract(delegateAddress);
		await delegateContract.grantAccess(deployer.address, "ADMIN_ROLE", overrides);
		const setDefaultTemplate = await proxyContract.setDefaultTemplate(templateAddress);

		console.log("setDefaultTemplate - chainId: ", setDefaultTemplate.chainId);

		await proxyContract.grantAccess(templateAddress, "ADMIN_ROLE", overrides);
		await proxyContract.setTemplateContract(1, templateAddress, overrides);

		return { proxy_address: proxyAddress, template_address: templateAddress, delegate_address: delegateAddress };
	}

	async grantCloneAccess(walletAddress: string, contractAddress: string) {
		const overrides = await getGasPriceOverrides(this, 2);
		console.log("	contractAddress: ", contractAddress);
		const proxyContract = await attachContract(contractAddress);
		await proxyContract.grantAccess(walletAddress, "OPS_ROLE", overrides);

		return { result: "OPS_ROLE access granted to " + walletAddress };
	}

	async createContracts(token: boolean, delegate: boolean, factory: boolean, template: boolean, version: string, isDefault: boolean) {
		let responseJSON: JSONObject = {};
		if (token) {
			const [...tokenAbi] = await getAbiByCache("Token");
			const tokenResponse = await addContractAbi(this.prisma, [...tokenAbi], version, isDefault);
			console.log("tokenResponse: ", tokenResponse);
			responseJSON = { ...responseJSON, tokenResponse };
		}
		if (factory) {
			const factoryAbi = await getAbiByCache("Factory");
			const factoryResponse = await addContractAbi(this.prisma, [...factoryAbi], version, isDefault);
			responseJSON = { ...responseJSON, factoryResponse };
		}
		if (delegate) {
			const delegateAbi = await getAbiByCache("Delegate");
			const delegateResponse = await addContractAbi(this.prisma, [...delegateAbi], version, isDefault);
			responseJSON = { ...responseJSON, delegateResponse };
		}
		if (template) {
			const templateAbi = await getAbiByCache("Template");
			const templateResponse = await addContractAbi(this.prisma, [...templateAbi], version, isDefault);
			responseJSON = { ...responseJSON, templateResponse };
		}

		return responseJSON;
	}
	async getContractDetails(contract_address: any) {
		// var data: JSONObject = {};

		// const slot1 = await ethers.provider.getStorageAt(contract_address, 0);
		const [abi, , ,] = await getAbiByName("TokenContract");
		// const abi = this.config.artifacts.tokenAbi;
		if (abi === undefined) {
			throw new Error("abi is undefined");
		}
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

	async updateBaseUri(contract_address: string, base_uri: string) {
		const tokenContract = await attachContract(contract_address);

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

		const factoryContract = await attachContract(contract_address);
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


	async god(contract_address: any, reqBody: any) {
		const classId = reqBody.class_id || "0";
		const name = reqBody.name || "";
		const desc = reqBody.desc || "";
		const baseUri = reqBody.base_uri || "";
		const templateAddress = reqBody.template_address || "";

		const [signer] = await ethers.getSigners();

		const functionSignature = ethers.utils.id("setClass(uint256,string,string,string,address)").slice(0, 10);
		const encodedParams = ethers.utils.defaultAbiCoder.encode(["uint256", "string", "string", "string", "address"], [classId, name, desc, baseUri, templateAddress]);
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

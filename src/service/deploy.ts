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

export class DeployService extends BaseService {
	async network() {
		return "Current network is " + process.env.DEFAULT_NETWORK;
	}

	async getSigner() {
		const [signer] = await ethers.getSigners();
		return signer.address;
	}

	async cloneProxy(reqBody: any) {
		const { seriesId, fungible, factoryAddress, proxyAddress, delegateAddress, title, baseUri, description, symbol } = reqBody;

		// get deployed contract data based on token contract version before cloning

		const [signer] = await ethers.getSigners();

		const overrides = await getGasPriceOverrides(this, 2);
		// const utils = ethers.utils;
		// const random = crypto.randomBytes(8).toString("hex");
		// const uuid = crypto.randomUUID();

		// const salt = ethers.utils.formatBytes32String(random.toString());

		let addressClone;

		const contractFactory = await attachContract(factoryAddress, false);
		const response = await contractFactory.createClone(proxyAddress);

		const receipt = await response.wait(); // response is empty if using hardhat network

		const [, abi,, contractName,,] = await getAbiByName("TokenContract");
		console.log("abi=", abi);
		for (const event of receipt.events) {
			if (event.event === "ProxyCloned") {
				addressClone = event.args.cloneAddress.toLowerCase();
			}
		}
		const signerAddress = await signer.getAddress();

		try {
			await this.prisma.clone.create({
				data: {
					type: "clone",
					fungible: fungible === 1, 
					name: contractName?.toString() || "",
					contract_address: addressClone.toLowerCase(),
					owner_address: signerAddress.toLowerCase(),
					factory_address: factoryAddress.toLowerCase(),
					proxy_address: proxyAddress.toLowerCase(),
					status: 1,
				},
			});
		} catch (error) {
			console.log("contractData Error: ", error);
		}

		// initialize clone
		const contractClone = await attachContract(addressClone, true);
		await contractClone.initialize(signer.address, title, baseUri, description, symbol, fungible, overrides).then((tx: any) => tx.wait());

		// configure with delegate
		const delegateContract = await attachContract(delegateAddress);

		await contractClone.setDelegateAddress(delegateAddress, overrides);
		await delegateContract.grantAccess(addressClone, "ADMIN_ROLE", overrides).then((tx: any) => tx.wait());

		console.log("Clone config done");

		const seriesData = await this.prisma.series.upsert({
			where: {
				id: Number(seriesId),
			},
			create: {
				title: title || "",
				contract_address: addressClone.toLowerCase(),
				delegate_address: delegateAddress.toLowerCase(),
				owner: signerAddress.toLowerCase(),
				status: 1,
			},
			update: {
				id: Number(seriesId),
				contract_address: addressClone.toLowerCase(),
				delegate_address: delegateAddress.toLowerCase(),
				owner: signerAddress.toLowerCase(),
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
		const [id, abi, bytecode, contractName, sourceName, version] = await getAbiByName(formattedContractName);

		const contractFullName = sourceName + ":" + contractName;
		const [signer] = await ethers.getSigners();
		const factory = await ethers.getContractFactory(contractFullName);
		const chainId = await ethers.provider.getNetwork().then((network) => network.chainId);
		const overrides = await getGasPriceOverrides(this, 2);
		const newContract = await factory.deploy(overrides);
		await newContract.deployed();

		console.log("Deployed %s: %s", contractFullName, newContract.address);

		try {
			await this.prisma.contract.create({
				data: {
					name: contractName?.toString() || "",
					contract_address: newContract.address.toLowerCase(),
					contract_name: contractName?.toString(),
					source_name: sourceName?.toString(),
					owner_address: await signer.getAddress(),
					abi: abi?.toString(),
					bytecode: bytecode?.toString(),
					contract_version_id: Number(id),
					version: version?.toString(),
					chain_id: chainId,
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

		const { proxyAddress } = reqBody;
		const newFactory = await this.deploySingle("Factory", null);

		const overrides = await getGasPriceOverrides(this, 2);
		// try {
		// contractFactory = await this.deploy("Factory");
		// console.log("	contractFactory owner: ", await contractFactory.owner());
		// console.log("	ProxyFactory address: ", contractFactory.address);
		// addressFactory = contractFactory.address;
		// await newFactory.initialize();
		// attach initial token proxy contract and register newly deployed factory
		const proxyContract = await attachContract(proxyAddress);

		//register factory
		await proxyContract.registerFactory(newFactory.address, overrides);
		// } catch (error) {
		// }

		return newFactory.address;
	}

	async deployAll(name: string, baseUri: string, description: string, symbol: string, fungible: boolean) {
		// const [deployer] = await ethers.getSigners();

		// const overrides = await getGasPriceOverrides(this, 2);
		// deploy delegate
		const initEmptyOptions = [""];
		const contractDelegate = await this.deploySingle("delegate", initEmptyOptions); // #1 Delegate

		// deploy proxy
		const initProxyOptions = [name, baseUri, description, symbol, fungible];
		const contractProxy = await this.deploySingle("token", initProxyOptions); // #2 Proxy

		// configure proxy
		// await contractProxy.setDelegateAddress(contractDelegate.address, overrides);
		// await contractDelegate.grantAccess(deployer.address, "ADMIN_ROLE", overrides);

		console.log("Config done");

		return { proxy_address: contractProxy.address, delegate_address: contractDelegate.address };
	}

	async deploySingle(contractName: string, options: any) {
		const newContract = await this.deploy(contractName);

		const overrides = await getGasPriceOverrides(this, 2);
		const [deployer] = await ethers.getSigners();
		switch (contractName) {
			case "token":
				await newContract.initialize(deployer.address, ...options, overrides);
				// await newContract.initialize(deployer.address, ...options);
				break;
			default:
				await newContract.initialize(overrides);
				break;
		}
		return newContract;
	}

	async configureProxy(proxyAddress: any, delegateAddress: any) {
		// configure proxy
		const [deployer] = await ethers.getSigners();

		const overrides = await getGasPriceOverrides(this, 2);
		console.log("	proxyAddress: ", proxyAddress);
		const proxyContract = await attachContract(proxyAddress);
		await proxyContract.setDelegateAddress(delegateAddress, overrides);

		console.log("	delegateAddress: ", delegateAddress);
		const delegateContract = await attachContract(delegateAddress);
		await delegateContract.grantAccess(deployer.address, "ADMIN_ROLE", overrides);

		return { proxy_address: proxyAddress, delegate_address: delegateAddress };
	}

	async grantCloneAccess(walletAddress: string, contractAddress: string) {
		const overrides = await getGasPriceOverrides(this, 2);
		console.log("	contractAddress: ", contractAddress);
		const proxyContract = await attachContract(contractAddress, true);
		await proxyContract.grantAccess(walletAddress, "OPS_ROLE", overrides);

		return { result: "OPS_ROLE access granted to " + walletAddress };
	}

	async createContracts(token: boolean, delegate: boolean, factory: boolean, version: string, isDefault: boolean, tierId: number) {
		let responseJSON: JSONObject = {};
		if (token) {
			const [...tokenAbi] = await getAbiByCache("Token");
			const tokenResponse = await addContractAbi(this.prisma, [...tokenAbi], version, isDefault, tierId);
			console.log("tokenResponse: ", tokenResponse);
			responseJSON = { ...responseJSON, tokenResponse };
		}
		if (factory) {
			const factoryAbi = await getAbiByCache("Factory");
			const factoryResponse = await addContractAbi(this.prisma, [...factoryAbi], version, isDefault, tierId);
			responseJSON = { ...responseJSON, factoryResponse };
		}
		if (delegate) {
			const delegateAbi = await getAbiByCache("Delegate");
			const delegateResponse = await addContractAbi(this.prisma, [...delegateAbi], version, isDefault, tierId);
			responseJSON = { ...responseJSON, delegateResponse };
		}

		return responseJSON;
	}
	async getContractDetails(contract_address: any) {
		// var data: JSONObject = {};

		// const slot1 = await ethers.provider.getStorageAt(contract_address, 0);
		const [abi, , , , ,] = await getAbiByName("TokenContract");
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
}

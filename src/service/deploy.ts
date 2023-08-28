import { BaseService } from "./base";
import { attachContract, getGasPriceOverrides, addContractAbi, getAbiByName } from "../utils";
import { ethers } from "hardhat";
import { getAbiByCache } from "../utils";

// import crypto from "node:crypto";
import dotenv from "dotenv";
dotenv.config();
interface JSONObject {
	[key: string]: any;
}
export class DeployService extends BaseService {
	async version() {
		return "Contract API v" + process.env.VERSION;
	}
	async network() {
		return "Current network is " + process.env.DEFAULT_NETWORK;
	}

	async cloneProxy(reqBody: any) {
		const { factory_address, contract_address, delegate_address, template_address, external_link, org_id, title, baseUri, description, symbol, requirements, slug, image_url, template_id } = reqBody;

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

		let seriesData;

		try {
			seriesData = await this.prisma.series.create({
				data: {
					org_id: org_id,
					contract_address: addressClone,
					delegate_address: delegate_address,
					owner: await signer.getAddress(),
					title: title,
					description: description,
					external_link: external_link,
					requirements: requirements,
					image_url: image_url,
					slug: slug,
					template_id: template_id as number,
				},
				select: {
					id: true, // Include the new series id in the returned data
				},
			});
		} catch (error) {
			console.log("seriesData Error: ", error);
		}

		const series_id = seriesData?.id;
		console.log("Clone address: ", addressClone);
		// return new clone (series)
		return { "clone address": addressClone, series_id: series_id };
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
}

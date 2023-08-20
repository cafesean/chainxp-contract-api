import { BaseService } from "./base";
import { attachContract } from "../utils";
import { ethers } from "hardhat";
// import crypto from "node:crypto";
import dotenv from "dotenv";
dotenv.config();

export class DeployService extends BaseService {
	async version() {
		return "Contract API v" + process.env.VERSION;
	}
	async network() {
		return "Current network is " + process.env.DEFAULT_NETWORK;
	}

	async addContractAbi(
		abi: string,
		bytecode: string,
		contract_name: string,
		source_name: string,
		version: string,
		isDefault: boolean
	) {
		try {
			const newContract = await this.prisma.contract_version.create({
				data: {
					abi: abi,
					bytecode: bytecode,
					contract_name: contract_name,
					source_name: source_name,
					version: version,
					default: isDefault,
				},
				select: {
					id: true,
				},
			});

			if (isDefault) {
				// set all other Default to false, except the data.id
				await this.prisma.contract_version.updateMany({
					where: {
						AND: [
							{
								default: {
									equals: true,
								},
								contract_name: {
									equals: contract_name,
								},
								id: {
									not: {
										equals: newContract.id,
									},
								},
							},
						],
					},
					data: {
						default: false,
					},
				});
			}
		} catch (error) {
			console.log("contractData Error: ", error);
		}
	}

	async cloneProxy(reqBody: any) {
		const {
			factory_address,
			contract_address,
			delegate_address,
			template_address,
			external_link,
			org_id,
			title,
			baseUri,
			description,
			symbol,
			requirements,
			slug,
			image_url,
			template_id,
		} = reqBody;

		const [signer] = await ethers.getSigners();
		// const utils = ethers.utils;
		// const random = crypto.randomBytes(8).toString("hex");
		// const uuid = crypto.randomUUID();

		// const salt = ethers.utils.formatBytes32String(random.toString());

		const contractFactory = await attachContract(
			this.config.artifacts.factoryAbi as any,
			this.config.artifacts.factoryBytecode,
			factory_address,
			this.config.artifacts.factoryContractName
		);
		// const contractFactory = await attachContract(this.config.artifacts.factoryAbi, owner, factory_address, FactorySol);

		// salt MUST be unique for eip-1167 cloning to work

		const response = await contractFactory.createClone(contract_address);

		let addressClone;
		const receipt = await response.wait(); // response is empty if using hardhat network
		// console.log("response=", await receipt.events);
		for (const event of receipt.events) {
			if (event.event === "ProxyCloned") {
				addressClone = event.args.cloneAddress.toLowerCase();
			}
		}

		// initialize clone
		const contractClone = await attachContract(
			this.config.artifacts.tokenAbi as any,
			this.config.artifacts.tokenBytecode,
			addressClone,
			this.config.artifacts.tokenContractName
		);

		await contractClone.initialize(signer.address, title, baseUri, description, symbol);

		// configure with delegate
		const delegateContract = await attachContract(
			this.config.artifacts.delegateAbi as any,
			this.config.artifacts.delegateBytecode,
			delegate_address,
			this.config.artifacts.delegateContractName
		).then((tx: any) => tx.wait());

		await contractClone.setDelegateAddress(delegate_address).then((tx: any) => tx.wait());;
		await delegateContract.grantAccess(addressClone, "ADMIN_ROLE").then((tx: any) => tx.wait());;

		const contractTemplate = await attachContract(
			this.config.artifacts.templateAbi as any,
			this.config.artifacts.templateBytecode,
			template_address,
			this.config.artifacts.templateContractName
		);

		// configure with template
		await contractClone.setDefaultTemplate(template_address).then((tx: any) => tx.wait());
		await contractClone.grantAccess(template_address, "ADMIN_ROLE").then((tx: any) => tx.wait());
		await contractClone.setTemplateContract(1, template_address).then((tx: any) => tx.wait());
		await contractTemplate.authorizeCallingContract(signer.address, addressClone).then((tx: any) => tx.wait());
		console.log("Clone config done");

		try {
			await this.prisma.contract.create({
				data: {
					name: title,
					type: "clone",
					contract_address: addressClone,
					factory_address: factory_address,
					cloned_from: contract_address,
					owner_address: await signer.getAddress(),
				},
			});
		} catch (error) {
			console.log("contractData Error: ", error);
		}

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

		// return new clone (series)
		return { addressClone, series_id };
	}

	async deploySingle(abi: any, bytecode: string, contractName: string, sourceName: string) {
		// console.log("signer: ", await signer.getAddress());
		const contractFullName = sourceName + ":" + contractName;
		// console.log("contractFullName: ", contractFullName);

		const [signer] = await ethers.getSigners();
		// const newContractFactory = new ContractFactory(abi, bytecode);

		const factory = await ethers.getContractFactory(contractFullName);
		// const overrides = await this.getGasPriceOverrides(2);
		const newContract = await factory.deploy();
		await newContract.deployed();

		// const newContract = await newContractFactory
		// 	.connect(signer)
		// 	.deploy()
		// 	.then((contract: any) => contract.deployed());

		console.log("Deployed %s: %s", contractFullName, newContract.address);

		try {
			await this.prisma.contract.create({
				data: {
					contract_address: newContract.address,
					name: contractName,
					source_name: sourceName,
					owner_address: await signer.getAddress(),
					abi: JSON.stringify(abi),
					bytecode: bytecode,
				},
			});
		} catch (error) {
			console.log("contractData Error: ", error);
		}
		return newContract;
	}

	async deployFactory(reqBody: any) {
		var contractFactory;
		var addressFactory;

		const { proxy_address } = reqBody;

		try {
			contractFactory = await this.deploySingle(
				this.config.artifacts.factoryAbi as any,
				this.config.artifacts.factoryBytecode,
				this.config.artifacts.factoryContractName,
				this.config.artifacts.factorySourceName
			);

			console.log("	contractFactory owner: ", await contractFactory.owner());
			console.log("	ProxyFactory address: ", contractFactory.address);
			addressFactory = contractFactory.address;
			await contractFactory.initialize();

			// attach initial token proxy contract and register newly deployed factory
			const proxyContract = await attachContract(
				this.config.artifacts.tokenAbi as any,
				this.config.artifacts.tokenBytecode,
				proxy_address,
				this.config.artifacts.tokenContractName
			);

			//register factory
			await proxyContract.registerFactory(contractFactory.address);
		} catch (error) {
			console.log("Deploy Error: ", error);
			return error;
		}

		return addressFactory;
	}

	async deployAll(name: string, baseUri: string, description: string, symbol: string) {
		var addressTemplate, addressDelegate;
		var contractDelegate, contractProxy, contractTemplate;
		var addressProxy, addressTemplate, addressDelegate;
		const [deployer] = await ethers.getSigners();

		try {
			contractDelegate = await this.deploySingle(
				this.config.artifacts.delegateAbi as any,
				this.config.artifacts.delegateBytecode,
				this.config.artifacts.delegateContractName,
				this.config.artifacts.delegateSourceName
			); // #1 Delegate
			addressDelegate = contractDelegate.address;
			await contractDelegate.initialize();

			contractProxy = await this.deploySingle(
				this.config.artifacts.tokenAbi as any,
				this.config.artifacts.tokenBytecode,
				this.config.artifacts.tokenContractName,
				this.config.artifacts.tokenSourceName
			); // #2 Proxy
			await contractProxy.initialize(deployer.address, name, baseUri, description, symbol);

			// ?await contractProxy.;
			addressProxy = contractProxy.address;
			contractTemplate = await this.deploySingle(
				this.config.artifacts.templateAbi as any,
				this.config.artifacts.templateBytecode,
				this.config.artifacts.templateContractName,
				this.config.artifacts.templateSourceName
			); // #3 Template
			addressTemplate = contractTemplate.address;
		} catch (error) {
			console.log("Deploy Error: ", error);
			return error;
		}

		try {
			await contractProxy.setDelegateAddress(addressDelegate);
			await contractDelegate.grantAccess(deployer.address, "ADMIN_ROLE");
			const setDefaultTemplate = await contractProxy.setDefaultTemplate(addressTemplate);

			console.log("setDefaultTemplate - chainId: ", setDefaultTemplate.chainId);

			await contractProxy.grantAccess(addressTemplate, "ADMIN_ROLE");
			await contractProxy.setTemplateContract(1, addressTemplate);
			console.log("Config done");
		} catch (error) {
			console.log("Config Error: ", error);
			return error;
		}

		return { proxy_address: addressProxy, template_address: addressTemplate, delegate_address: addressDelegate };
	}
}

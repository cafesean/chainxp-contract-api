// @dev - contract deployment and configuration services
import { BaseService } from "./base";
import { attachContract, getGasPriceOverrides, addContractAbi, getAbiByName } from "../utils";
import { ethers } from "ethers";
// import { ethers as hardhatEthers } from "hardhat";
import { Contract } from "ethers";
import { getAbiByCache } from "../utils";
import {
	getForwarderWalletAddress,
	getForwarderAddressFromDeployment,
	grantAccessToForwarder,
	getDeployedContractAddress,
} from "../utils/contract.utils";
import dotenv from "dotenv";

dotenv.config();

interface JSONObject {
	[key: string]: any;
}

export class DeployService extends BaseService {
	async network() {
		return "Current network is " + process.env.DEFAULT_NETWORK;
	}

	// async getSigner() {
	// 	const [signer] = await ethers.getSigners();
	// 	return signer.address;
	// }

	async cloneProxy(deployer: any, reqBody: any) {
		const {
			seriesId,
			fungible,
			factoryAddress,
			proxyAddress,
			delegateAddress,
			title,
			baseUri,
			description,
			symbol,
		} = reqBody;

		// get deployed contract data based on token contract version before cloning

		// const [signer] = await ethers.getSigners();

		const overrides = await getGasPriceOverrides(this, 2);
		// const utils = ethers.utils;
		// const random = crypto.randomBytes(8).toString("hex");
		// const uuid = crypto.randomUUID();

		// const salt = ethers.utils.formatBytes32String(random.toString());

		let addressClone;
		const signerAddress = await deployer.getAddress();

		// get forwarder address

		try {
			const forwarderAddress = (await getForwarderWalletAddress(proxyAddress.toLowerCase())) || "";

			const contractFactory = await attachContract(factoryAddress, deployer, false);
			const response = await contractFactory.createClone(proxyAddress);

			const receipt = await response.wait(); // response is empty if using hardhat network

			const [, , , contractName, ,] = await getAbiByName("TokenContract");
			// console.log("abi=", abi);
			for (const event of receipt.events) {
				if (event.event === "ProxyCloned") {
					addressClone = event.args.cloneAddress.toLowerCase();
				}
			}

			await this.prisma.clone.create({
				data: {
					type: "clone",
					fungible: fungible === 1,
					name: contractName?.toString() || "",
					contract_address: addressClone.toLowerCase(),
					owner_address: signerAddress.toLowerCase(),
					factory_address: factoryAddress.toLowerCase(),
					proxy_address: proxyAddress.toLowerCase(),
					forwarder_address: forwarderAddress.toLowerCase(),
					status: 1,
				},
			});
		} catch (error) {
			console.log("Create clone Error: ", error);
		}

		// initialize clone
		try {
			const contractClone = await attachContract(addressClone, deployer, true);
			await contractClone
				.initialize(deployer.address, title, baseUri, description, symbol, fungible, overrides)
				.then((tx: any) => tx.wait());
			await contractClone.grantAccess(deployer.address, "FORWARDER_ROLE", overrides).then((tx: any) => tx.wait());
			// configure with delegate
			const delegateContract = await attachContract(delegateAddress, deployer);

			await contractClone.setDelegateAddress(delegateAddress, overrides);

			console.log(deployer.address + " role: ", await delegateContract.getRole(deployer.address));

			await delegateContract.grantAccess(addressClone, "ADMIN_ROLE", overrides).then((tx: any) => tx.wait());
		} catch (error) {
			console.log("Contract configuration error: ", error);
			throw new Error("Oops, something went wrong. (D100)");
		}
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
		return { cloneAddress: addressClone, seriesId: seriesData?.id };
	}

	async deploy(deploymentId: number, name: string, deployer: any): Promise<Contract> {
		const formattedContractName = name.charAt(0).toUpperCase() + name.slice(1) + "Contract";
		const [id, abi, bytecode, contractName, sourceName, version] = await getAbiByName(formattedContractName);

		const contractFullName = sourceName + ":" + contractName;

		// const [signer] = await ethers.getSigners();

		// const wallet = new ethers.Wallet(deployerPrivateKey);
		// const signer = wallet.connect(ethers.provider);

		const factory = new ethers.ContractFactory(
			abi as ethers.ContractInterface,
			bytecode as ethers.utils.BytesLike,
			deployer
		);
		// let network;
		// if (process.env.DEFAULT_NETWORK === "hardhat") {
		// 	network = await hardhatEthers.provider.getNetwork();
		// } else {
		const network = await new ethers.providers.JsonRpcProvider(process.env.PROVIDER_URL).getNetwork();
		// }
		console.log("network: ", network);
		const chainId = network.chainId;
		const overrides = await getGasPriceOverrides(this, 2);
		const newContract = await factory.connect(deployer).deploy(overrides);
		await newContract.deployed();

		console.log("Deployed %s: %s", contractFullName, newContract.address);

		try {
			await this.prisma.contract.create({
				data: {
					name: contractName?.toString() || "",
					contract_address: newContract.address.toLowerCase(),
					contract_name: contractName?.toString(),
					source_name: sourceName?.toString(),
					owner_address: await deployer.getAddress(),
					abi: abi?.toString(),
					bytecode: bytecode?.toString(),
					contract_version_id: Number(id),
					version: version?.toString(),
					chain_id: chainId,
					deployment_id: Number(deploymentId),
				},
			});
		} catch (error) {
			console.log("contractData Error: ", error);
		}
		return newContract;
	}

	async deployFactory(deploymentId: number, deployer: any, reqBody: any): Promise<string> {
		// var contractFactory;
		// var addressFactory;

		const { proxyAddress } = reqBody;

		try {
			// deploy factory
			const newFactory = await this.deploySingle(deploymentId, deployer, "Factory", null);
			const overrides = await getGasPriceOverrides(this, 2);

			// attach proxy contract and register factory
			const proxyContract = await attachContract(proxyAddress, deployer);
			await proxyContract.registerFactory(newFactory.address, overrides);

			return newFactory.address;
		} catch (error) {
			console.log("Factory deployment Error: ", error);
			throw new Error("Factory deployment Error: " + error);
		}
	}

	async deployAll(
		deploymentId: number,
		deployer: any,
		name: string,
		baseUri: string,
		description: string,
		symbol: string,
		fungible: number
	) {
		// const [deployer] = await ethers.getSigners();

		// const overrides = await getGasPriceOverrides(this, 2);
		// deploy delegate
		const initEmptyOptions = [""];

		console.log("signer address:", deployer.address);
		const contractDelegate = await this.deploySingle(deploymentId, deployer, "delegate", initEmptyOptions); // #1 Delegate
		// deploy proxy
		const initProxyOptions: [string, string, string, string, number] = [name, baseUri, description, symbol, fungible];
		const contractProxy = await this.deploySingle(deploymentId, deployer, "token", initProxyOptions); // #2 Proxy

		// configure proxy
		// await contractProxy.setDelegateAddress(contractDelegate.address, overrides);
		// await contractDelegate.grantAccess(deployer.address, "ADMIN_ROLE", overrides);

		console.log("Config done");

		return { proxyAddress: contractProxy.address, delegateAddress: contractDelegate.address };
	}

	async deploySingle(deploymentId: number, deployer: any, contractName: string, options: any): Promise<Contract> {
		// if deploymentId exists, skip
		const formattedContractName = contractName.charAt(0).toUpperCase() + contractName.slice(1) + "Contract";

		let contract;
		const deployedContract = await getDeployedContractAddress(formattedContractName, deploymentId);
		if (deployedContract) {
			// get contract object from contract table
			contract = await attachContract(deployedContract, deployer);
		} else {
			contract = await this.deploy(deploymentId, contractName, deployer);
		}
		const overrides = await getGasPriceOverrides(this, 2);
		const forwarderAddress = await getForwarderAddressFromDeployment(deploymentId as number);

		try {
			switch (contractName) {
				case "token":
					console.log("options:", options);
					await contract.initialize(deployer.address, ...options, overrides);

					// save forwarder address to database by looking up proxy address in deployment table using deploymentId
					await this.prisma.contract.update({
						where: {
							contract_name_deployment_id: { contract_name: formattedContractName, deployment_id: deploymentId },
						},
						data: { forwarder_address: forwarderAddress },
					});
					break;
				default:
					// delegate or factory
					await contract.connect(deployer).initialize(overrides);
					const grantAccessResult = await grantAccessToForwarder(
						formattedContractName,
						contract,
						overrides,
						forwarderAddress,
						"ADMIN_ROLE",
						deploymentId
					);

					console.log("grantAccessResult: ", formattedContractName + " - " + grantAccessResult);
					break;
			}
		} catch (error) {
			console.log("error:", error);
			console.log("already initialized");
		}
		return contract;
	}

	async configureProxy(deployer: any, proxyAddress: string, delegateAddress: string) {
		// configure proxy
		// const [deployer] = await ethers.getSigners();

		const overrides = await getGasPriceOverrides(this, 2);
		console.log("	proxyAddress: ", proxyAddress);
		const proxyContract = await attachContract(proxyAddress, deployer);
		await proxyContract.setDelegateAddress(delegateAddress, overrides);

		console.log("	delegateAddress: ", delegateAddress);
		const delegateContract = await attachContract(delegateAddress, deployer);
		await delegateContract.grantAccess(deployer.address, "ADMIN_ROLE", overrides);

		return { proxyAddress: proxyAddress, delegateAddress: delegateAddress };
	}

	async grantCloneAccess(deployer: any, walletAddress: string, contractAddress: string) {
		const overrides = await getGasPriceOverrides(this, 2);
		console.log("	contractAddress: ", contractAddress);
		const proxyContract = await attachContract(contractAddress, deployer, true);
		await proxyContract.grantAccess(walletAddress, "OPS_ROLE", overrides);

		return { result: "OPS_ROLE access granted to " + walletAddress };
	}

	async createContracts(
		token: boolean,
		delegate: boolean,
		factory: boolean,
		version: string,
		isDefault: boolean,
		tierId: number
	) {
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
		const provider = new ethers.providers.JsonRpcProvider(process.env.PROVIDER_URL);

		// const provider = ethers.getDefaultProvider();
		const contract = new ethers.Contract(contract_address, abi?.toString(), provider);

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

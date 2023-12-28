// import { ContractFactory } from "ethers";
import { ethers } from "hardhat";
import { getAbiByAddress } from "../utils/abi.utils";
import { decryptPrivateKey } from "../utils/encryption";
import { prisma } from "src/utils/prisma";

export async function attachContract(contractAddress: string, signer?: any, isClone?: boolean) {
	// ethers
	// const factory = new ContractFactory(abi, bytecode);
	// const attachedContract = factory.attach(contractAddress);
	let attachedContract;
	let contractName;
	// lookup proxyContract address based on clone address
	const isProxyClone = isClone ? isClone : false;
	try {
		const [, , contract_name] = await getAbiByAddress(contractAddress, isProxyClone);
		// hardhat
		contractName = contract_name;
		const attachSigner = signer;

		// if (!attachSigner) {
		// 	attachSigner = await ethers.getSigners();
		// }
		const contract = await ethers.getContractFactory(contract_name as string);
		attachedContract = contract.connect(attachSigner).attach(contractAddress);
	} catch (error) {
		throw new Error("Error in attachContract: " + error);
	}
	console.log("Attached contract %s: %s", contractName, attachedContract.address);
	// console.log("Owner: ", await attachedContract.owner());

	return attachedContract;
}

// get forwarder wallet
export async function getForwarderWalletKey(proxyAddress: string) {
	// get forwarder based on proxy address in contract table

	let forwarderKey;
	try {
		const contract = await prisma.contract.findFirst({
			where: {
				contract_address: proxyAddress.toLowerCase(),
			},
			select: {
				forwarder: {
					select: {
						address: true,
						key: true,
						iv: true,
					},
				},
			},
		});

		const password = process.env.FORWARDER_PASSWORD as string;

		if (!contract?.forwarder) {
			throw new Error("No forwarder");
		}
		forwarderKey = decryptPrivateKey(contract?.forwarder?.key!, password, contract.forwarder?.iv!);
		console.log("forwarderKey: ", forwarderKey);
	} catch (error) {
		throw new Error("Error in getForwarderWalletKey: " + error);
	}

	return forwarderKey;
}

// get forwarder address from proxy address
export async function getForwarderWalletAddress(proxyAddress: string) {
	// get forwarder based on proxy address in contract table
	const contract = await prisma.contract.findFirst({
		where: {
			contract_address: proxyAddress,
		},
		select: {
			forwarder: {
				select: {
					address: true,
				},
			},
		},
	});

	if (!contract?.forwarder) {
		throw new Error("No forwarder");
	}

	return contract?.forwarder?.address?.toLowerCase();
}

// get forwarder address from proxy address
export async function getForwarderWalletKeyFromClone(cloneAddress: string) {
	// get forwarder based on proxy address in contract table

	let forwarderKey;
	try {
		const contract = await prisma.clone.findUnique({
			where: {
				contract_address: cloneAddress,
			},
			select: {
				forwarder: {
					select: {
						address: true,
						key: true,
						iv: true,
					},
				},
			},
		});

		const password = process.env.FORWARDER_PASSWORD as string;

		if (!contract?.forwarder) {
			throw new Error("No forwarder");
		}
		forwarderKey = decryptPrivateKey(contract?.forwarder?.key!, password, contract.forwarder?.iv!);
		console.log("forwarderKey: ", forwarderKey);
	} catch (error) {
		throw new Error("Error: " + error);
	}

	return forwarderKey;
}

// get forwarder address from database by looking up proxy address in deployment table using deploymentId
// forwarder address is in metadata JSON field

export async function getForwarderAddressFromDeployment(deploymentId: number) {
	// get forwarder based on proxy address in contract table
	const deployment = await prisma.deployment.findUnique({
		where: {
			id: deploymentId,
		},
		select: {
			metadata: true,
		},
	});

	if (deployment?.metadata) {
		const metadata = deployment.metadata as any;
		return metadata.forwarder_address as string;
	} else {
		return "No forwarder";
	}
}

// grant access to forwarder and save forwarder address in contract table
export async function grantAccessToForwarder(contractName: string, contract: any, overrides: any, forwarderAddress: string, role: string, deploymentId: number): Promise<boolean> {
	try {
		await contract.grantAccess(forwarderAddress, role, overrides);
		const checkRole = await contract.getRole(forwarderAddress);

		console.log("Role: ", checkRole);
		await prisma.contract.update({
			where: { contract_name_deployment_id: { contract_name: contractName, deployment_id: deploymentId } },
			data: { forwarder_address: forwarderAddress },
		});
	} catch (error) {
		console.log("Error updating forwarder address: ", error);
		throw new Error(error as string);
	}
	return true;
}

// get deployment from deployment table using contract name and deploymentId
export async function getDeployedContractAddress(contractName: string, deploymentId: number) {
	const contract = await prisma.contract.findUnique({
		where: {
			contract_name_deployment_id: { contract_name: contractName, deployment_id: deploymentId },
		},
	});

	return contract?.contract_address;
}

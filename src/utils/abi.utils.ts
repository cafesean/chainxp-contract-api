import fs from "fs";
import path from "path";
import { PrismaClient } from "@prisma/client";

// Load the JSON from the provided path
function loadContractJson(abiPath: string): any {
	const rawContent = fs.readFileSync(abiPath, "utf-8");
	return JSON.parse(rawContent);
}

export const getAbi = (abiPath: string) => {
	console.log("process.cwd(): ", process.cwd());

	try {
		const dir = path.resolve(__dirname, abiPath);
		const file: any = loadContractJson(dir);

		return [JSON.stringify(file.abi), file.bytecode, file.contractName, file.sourceName];
	} catch (e) {
		return [, , ,];
	}
};

export const getBytecode = (abiPath: string) => {
	try {
		const dir = path.resolve(__dirname, abiPath);
		const file: any = loadContractJson(dir);
		// console.log(`bytecode`, file.bytecode);

		return file.bytecode;
	} catch (e) {
		console.log(`e`, e);
	}
};

export const getAbiByCache = async (contractName: string) => {
	const abiPath = "src/lib/" + contractName + ".sol/" + contractName + "Contract.json";
	const dir = path.join(process.cwd(), abiPath);

	try {
		const file = fs.readFileSync(dir, "utf-8");

		const json = JSON.parse(file);
		return [JSON.stringify(json.abi), json.bytecode, json.contractName, json.sourceName];
	} catch (e) {
		return [null, null, null, null, null, null];
	}
};

// create function to get abi by contract_address
export async function getAbiByName(contractName: string) {
	const prisma = new PrismaClient();

	const data = await prisma.contract_version.findFirst({
		where: {
			AND: [
				{
					contract_name: {
						equals: contractName,
					},
					default: {
						equals: true,
					},
				},
			],
		},
		select: {
			id: true,
			abi: true,
			bytecode: true,
			contract_name: true,
			source_name: true,
			version: true,
		},
	});

	if (!data) {
		console.log("No abi data found.");
		return [null, null, null, null, null, null];
	}

	// console.log("source_name: ", data.source_name);
	return [data?.id, data?.abi, data?.bytecode, data?.contract_name, data?.source_name, data?.version];
}

export async function addContractAbi(prisma: any, contractAbi: any, version: string, isDefault: boolean, tierId: number) {
	const [abi, bytecode, contract_name, source_name] = contractAbi;

	try {
		const newContract = await prisma.contract_version.create({
			data: {
				abi: abi,
				bytecode: bytecode,
				contract_name: contract_name,
				source_name: source_name,
				version: version,
				default: isDefault,
				tier_id: tierId,
			},
			select: {
				id: true,
			},
		});

		if (isDefault) {
			// set all other Default to false, except the data.id
			await prisma.contract_version.updateMany({
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
							tier_id: {
								equals: tierId,
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

	return "Contract v" + version + " added.";
}

// create function to get abi by contract_address
export async function getAbiByAddress(contractAddress: string, isClone: boolean) {
	const prisma = new PrismaClient();

	// lookup proxyAddress based on cloneAddress
	let lookupContractAddress;

	if (isClone) {
		console.log("isClone: ", isClone);
		const proxyAddress = await prisma.clone.findFirst({
			where: {
				contract_address: {
					equals: contractAddress.toLowerCase(),
				},
			},
			select: {
				proxy_address: true,
			},
		});

		if (!proxyAddress?.proxy_address) {
			console.log("No proxyAddress found.");
			lookupContractAddress = null;
		}
		lookupContractAddress = proxyAddress?.proxy_address;
	} else {
		lookupContractAddress = contractAddress;
	}

	if (!lookupContractAddress) {
		console.log("No contractAddress found.");
		return [, , ,];
	}
	const data = await prisma.contract.findMany({
		take: 1,
		where: {
			contract_address: {
				equals: lookupContractAddress.toLowerCase(),
			},
		},
		select: {
			abi: true,
			bytecode: true,
			contract_name: true,
			source_name: true,
		},
		orderBy: {
			created_at: "desc",
		},
	});

	if (!data) {
		console.log("No abi data found.");
		return [, , ,];
	}

	// console.log("source_name: ", data.source_name);
	return [data[0]?.abi, data[0]?.bytecode, data[0]?.contract_name, data[0]?.source_name];
}

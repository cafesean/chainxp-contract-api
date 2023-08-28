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
		return [, , ,];
	}
};

export async function addContractAbi(prisma: any, contractAbi: any, version: string, isDefault: boolean) {
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
								equals: contract_name.toLowerCase(),
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

	return "Contract v" + version + " added.";
}

// create function to get abi by contract_address
export async function getAbiByAddress(contractAddress: string) {
	const prisma = new PrismaClient();

	const data = await prisma.contract.findFirst({
		where: {
			AND: [
				{
					contract_address: {
						equals: contractAddress,
					},
				},
			],
		},
		select: {
			abi: true,
			bytecode: true,
			contract_name: true,
			source_name: true,
		},
	});

	if (!data) {
		console.log("No abi data found.");
		return [, , ,];
	}

	// console.log("source_name: ", data.source_name);
	return [data?.abi, data?.bytecode, data?.contract_name, data?.source_name];
}

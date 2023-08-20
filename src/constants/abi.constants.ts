// import { getAbi } from "../utils";

import fs from "fs";
import path from "path";
import { PrismaClient } from "@prisma/client";

// Load the JSON from the provided path
// function loadContractJson(abiPath: string): any {
// 	console.log("abiPath: ", abiPath);

// 	const rawContent = fs.readFileSync(abiPath, "utf-8");
// 	return JSON.parse(rawContent);
// }

// type artifact = {
// 	abi: JSON;
// 	bytecode: string;
// 	contract_name: string;
// 	source_name: string;
// }

export const getAbi = async (contractName: string) => {
	const abiPath = "src/lib/" + contractName + ".sol/" + contractName + "Contract.json";
	const dir = path.join(process.cwd(), abiPath);

	try {
		const file = fs.readFileSync(dir, "utf-8");

		const json = JSON.parse(file);
		return json;
	} catch (e) {
		console.log(`e`, e);
	}
};

export const templateArtifacts = async () => {
	try {
		const template = await getDefaultContractAbi("Template");
		// console.log("After getDefaultContractAbi(template): ", template[3]);
		return template;
	} catch {
		console.log("Error in templateArtifacts");
		return ["", "", "", ""];
	}
};

export const tokenArtifacts = async () => {
	return await getDefaultContractAbi("Token");
};

export const delegateArtifacts = async () => {
	return await getDefaultContractAbi("Delegate");
};

export const factoryArtifacts = async () => {
	return await getDefaultContractAbi("Factory");
};

// export const [delegateAbi, delegateBytecode, delegateContractName, delegateSourceName] = templateArtifacts();

// export const [templateAbi, templateBytecode, templateContractName, templateSourceName] = getAbi(
// 	"lib/Template.sol/TemplateContract.json"
// ) as any[];

// export const [tokenAbi, tokenBytecode, tokenContractName, tokenSourceName] = async () => {
// 	if (process.env.NODE_ENV === "development") {
// 		return getAbi("lib/Template.sol/TemplateContract.json") as any[];
// 	} else {
// 		// get values from database
// 		const data = await getDefaultContractAbi("TokenContract");
// 		return [data?.abi, data?.bytecode, data?.contract_name, data?.source_name] as any[];
// 	}
// };

export async function getDefaultContractAbi(contract: string) {
	const prisma = new PrismaClient();

	// console.log("In getDefaultContractAbi: ", contract);
	// console.log("process.env.ENV: ", process.env.ENV);
	// console.log("process.env.NODE_ENV: ", process.env.NODE_ENV);

	if (process.env.NODE_ENV === "development") {
		console.log("In local");
		const file = await getAbi(contract);

		return [JSON.stringify(file.abi), file.bytecode, file.contractName, file.sourceName];
	} else {
		console.log("In production: ", contract);
		const contractName = contract + "Contract";

		const data = await prisma.contract_version.findFirst({
			where: {
				AND: [
					{
						default: {
							equals: true,
						},
						contract_name: {
							equals: contractName,
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
			return "No data found";
		} else {
			console.log("contract_name: ", data.contract_name);
		}

		// console.log("source_name: ", data.source_name);
		return [data?.abi, data?.bytecode, data?.contract_name, data?.source_name];
	}
}

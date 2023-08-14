// import { getAbi } from "../utils";

import fs from "fs";
import path from "path";
import { PrismaClient } from "@prisma/client";
// import fastify from "fastify";
// import contract from "@root/providers/polygon/routes/contract";

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
	console.log("in getAbi: ", contractName);
	const abiPath = "lib/" + contractName + ".sol/" + contractName + "Contract.json";
	const dir = path.join(process.cwd(), abiPath);

	// console.log("abi.constants dir: ", dir);

	try {
		// const dir = path.join(process.cwd(), "dist/src/" + abiPath);
		// console.log("abi.constants dir: ", dir);

		// const file: any = loadContractJson(dir);
		const file = fs.readFileSync(dir, "utf-8");

		const json = JSON.parse(file);

		console.log("json.contractName: ", json.contractName);
		console.log("json.sourceName: ", json.sourceName);
		return json;
	} catch (e) {
		console.log(`e`, e);
	}
};

// export const [tokenAbi, tokenBytecode, tokenContractName, tokenSourceName] = () => {
// 	if (process.env.NODE_ENV === "development") {
// 		return getAbi("lib/Token.sol/TokenContract.json") as any[];
// 	} else {
// 		// get values from database

// 		const data = await getDefaultContractAbi("TokenContract");
// 		return [data.abi, data.bytecode, data.contract_name, data.source_name] as any[];
// 	}
// };

export const templateArtifacts = async () => {
	return await getDefaultContractAbi("Template");
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
		console.log("In production");
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
		}
		console.log("source_name: ", data.source_name);
		return [data?.abi, data?.bytecode, data?.contract_name, data?.source_name];
	}
}

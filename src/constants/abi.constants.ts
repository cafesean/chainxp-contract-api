// import { getAbi } from "../utils";

// import fs from "fs";
// import path from "path";
// import { PrismaClient } from "@prisma/client";

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


// export const templateArtifacts = async () => {
// 	try {
// 		const template = await getDefaultAbi("Template");
// 		// console.log("After getDefaultContractAbi(template): ", template[3]);
// 		return template;
// 	} catch {
// 		console.log("Error in templateArtifacts");
// 		return ["", "", "", ""];
// 	}
// };

// export const tokenArtifacts = async () => {
// 	return await getAbiByAddress("Token");
// };

// export const delegateArtifacts = async () => {
// 	return await getAbiByAddress("Delegate");
// };

// export const factoryArtifacts = async () => {
// 	return await getAbiByAddress("Factory");
// };

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

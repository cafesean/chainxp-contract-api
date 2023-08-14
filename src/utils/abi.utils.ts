import fs from "fs";
import path from "path";

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

    return [
        JSON.stringify(file.abi),
        file.bytecode,
        file.contractName,
        file.sourceName
    ];

	} catch (e) {
		console.log(`e`, e);
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

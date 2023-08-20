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

		return [JSON.stringify(file.abi), file.bytecode, file.contractName, file.sourceName];
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

export async function addContractAbi(
	ctx: any,
	abi: string,
	bytecode: string,
	contract_name: string,
	source_name: string,
	version: string,
	isDefault: boolean
) {
	try {
		const newContract = await ctx.prisma.contract_version.create({
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
			await ctx.prisma.contract_version.updateMany({
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


import { ContractFactory } from "ethers";


export async function attachContract(abi: string, bytecode: string, contractAddress: string, contractName: string) {
	const factory = new ContractFactory(abi, bytecode);
	const attachedContract = factory.attach(contractAddress);

	console.log("Attached contract %s: %s", contractName, attachedContract.address);
	// console.log("Owner: ", await attachedContract.owner());

	return attachedContract;
}
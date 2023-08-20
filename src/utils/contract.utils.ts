// import { ContractFactory } from "ethers";
import { ethers } from "hardhat";

export async function attachContract(abi: string, bytecode: string, contractAddress: string, contractName: string) {
	// ethers
	// const factory = new ContractFactory(abi, bytecode);
	// const attachedContract = factory.attach(contractAddress);

	// hardhat
	const [signer] = await ethers.getSigners();
	const factory = await ethers.getContractFactory(contractName);
	const attachedContract = factory.connect(signer).attach(contractAddress);

	console.log("Attached contract %s: %s", contractName, attachedContract.address);
	// console.log("Owner: ", await attachedContract.owner());

	return attachedContract;
}


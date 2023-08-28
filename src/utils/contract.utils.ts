// import { ContractFactory } from "ethers";
import { ethers } from "hardhat";
import { getAbiByAddress } from "../utils/abi.utils";

export async function attachContract(contractAddress: string) {
	// ethers
	// const factory = new ContractFactory(abi, bytecode);
	// const attachedContract = factory.attach(contractAddress);
	const [, , contract_name,] = await getAbiByAddress(contractAddress);
	// hardhat
	const [signer] = await ethers.getSigners();
	const factory = await ethers.getContractFactory(contract_name as string);
	const attachedContract = factory.connect(signer).attach(contractAddress);

	console.log("Attached contract %s: %s", contract_name, attachedContract.address);
	// console.log("Owner: ", await attachedContract.owner());

	return attachedContract;
}

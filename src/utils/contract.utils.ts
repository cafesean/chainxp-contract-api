// import { ContractFactory } from "ethers";
import { ethers } from "hardhat";
import { getAbiByAddress } from "../utils/abi.utils";

export async function attachContract(contractAddress: string) {
	// ethers
	// const factory = new ContractFactory(abi, bytecode);
	// const attachedContract = factory.attach(contractAddress);
	const [, , contractName,] = await getAbiByAddress(contractAddress);
	// hardhat
	const [signer] = await ethers.getSigners();
	const factory = await ethers.getContractFactory(contractName as string);
	const attachedContract = factory.connect(signer).attach(contractAddress);

	console.log("Attached contract %s: %s", contractName, attachedContract.address);
	// console.log("Owner: ", await attachedContract.owner());

	return attachedContract;
}

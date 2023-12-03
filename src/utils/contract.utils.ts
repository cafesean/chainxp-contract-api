// import { ContractFactory } from "ethers";
import { ethers } from "hardhat";
import { getAbiByAddress } from "../utils/abi.utils";

export async function attachContract(contractAddress: string, signer?: any, isClone?: boolean) {
	// ethers
	// const factory = new ContractFactory(abi, bytecode);
	// const attachedContract = factory.attach(contractAddress);

	// lookup proxyContract address based on clone address
	const isProxyClone = isClone ? isClone : false;

	const [, , contract_name] = await getAbiByAddress(contractAddress, isProxyClone);
	// hardhat

	let attachSigner = signer;

	if (!attachSigner) {
		attachSigner = await ethers.getSigners();
	}
	const factory = await ethers.getContractFactory(contract_name as string);
	const attachedContract = factory.connect(attachSigner).attach(contractAddress);

	console.log("Attached contract %s: %s", contract_name, attachedContract.address);
	// console.log("Owner: ", await attachedContract.owner());

	return attachedContract;
}

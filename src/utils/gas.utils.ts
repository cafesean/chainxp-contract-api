import { ethers } from "hardhat";

export async function speedupTransactionOverrides(contract: any, txnHash: string) {
	const txn = await ethers.provider.getTransaction(txnHash);

	if (txn === null) {
		throw new Error(`Transaction not found: ${txnHash}`);
	}
	const gasPrice = await contract.getSpeedGasPrice(txn.gasPrice);
	const overrides = {
		nonce: txn.nonce,
		gasPrice: gasPrice,
	};

	return overrides;
}

export async function getSpeedGasPrice(contract: any, oldGasPrice: any) {
	let gasPrice = await ethers.provider.getGasPrice();

	const fastGasPrice = await contract.polygon.scanGasTrackerPrice(2);
	if (fastGasPrice > 0) {
		gasPrice = ethers.BigNumber.from(fastGasPrice * 1e9);
	}

	if (Number(gasPrice) < Number(oldGasPrice)) {
		gasPrice = oldGasPrice.add(oldGasPrice.div(9));
	}
	return gasPrice;
}

export async function getGasPriceOverrides(contract: any, level: number = 1) {
	// get gas price from polygon scan
	const scanGasPrice = await contract.polygon.scanGasTrackerPrice(level);
	if (scanGasPrice > 0) {
		const gasPrice = ethers.BigNumber.from(scanGasPrice * 1e9);
		return { gasPrice };
	}

	// get gas price from rpc network
	const defaultGasPrice = await ethers.provider.getGasPrice();
	const gasPrice = defaultGasPrice.add(defaultGasPrice.div(2).mul(level));
	return { gasPrice };
}

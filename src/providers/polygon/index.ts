import * as scan from "./scan";

export { default as Response } from "./response";

export default class PolygonClient {
	constructor(private readonly baseUrl: string, private readonly apiKey: string, private readonly maxGasPrice: number) {}

	async scanTransaction(txnHash: string): Promise<number> {
		try {
			return await scan.scanTransaction(this.baseUrl, this.apiKey, txnHash);
		} catch (err) {
			// ignore the error
		}
		return -1;
	}

	async scanGasTrackerPrice(level: number = 1): Promise<number> {
		try {
			let gasPrice = await scan.scanGasTrackerPrice(this.baseUrl, this.apiKey, level);
			if (gasPrice > this.maxGasPrice) {
				// try again
				console.log(`gas price ${gasPrice} is higher than max gas price ${this.maxGasPrice}, try again...`);
				gasPrice = await scan.scanGasTrackerPrice(this.baseUrl, this.apiKey, level);
				console.log(`after try again, gas price is ${gasPrice}`);
				return gasPrice > this.maxGasPrice ? this.maxGasPrice : gasPrice;
			}
			return gasPrice;
		} catch (err) {
			// ignore the error
		}
		return -1;
	}
}

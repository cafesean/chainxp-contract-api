import * as scan from './scan';
// import { ethers } from "hardhat";

export default class PolygonClient {
  constructor(
    private readonly baseUrl: string,
    private readonly apiKey: string,
    // private readonly maxGasPrice: number,
  ) {

  }

  async scanTransaction(txnHash: string): Promise<number> {
    try {
      return await scan.scanTransaction(this.baseUrl, this.apiKey, txnHash);
    } catch (err) {
      // ignore the error
    }
    return -1;
  }

  // async scanGasTrackerPrice(level: number = 1): Promise<number> {
  //   try {
  //     let gasPrice = await scan.scanGasTrackerPrice(this.baseUrl, this.apiKey, level);
  //     if (gasPrice > this.maxGasPrice) {
  //       // try again
  //       console.log(`gas price ${gasPrice} is higher than max gas price ${this.maxGasPrice}, try again...`);
  //       gasPrice = await scan.scanGasTrackerPrice(this.baseUrl, this.apiKey, level);
  //       console.log(`after try again, gas price is ${gasPrice}`);

  //       const defaultGasPrice = await ethers.provider.getGasPrice();
  //       const defaultGasPriceGwei = parseFloat(ethers.utils.formatUnits(defaultGasPrice, 'gwei'));
      
        
  //       // const defaultGasPriceGwei = ethers.toWei(defaultGasPrice, 'gwei');
  //       console.log(`default gas price ${defaultGasPriceGwei} gwei`);
  //       if (gasPrice > defaultGasPriceGwei * 2) {
  //         gasPrice = defaultGasPriceGwei * 2;
  //       }
  //       return gasPrice > this.maxGasPrice ? this.maxGasPrice : gasPrice;
  //     }
  //     return gasPrice;
  //   } catch (err) {
  //     // ignore the error
  //   }
  //   return -1;
  // }
}

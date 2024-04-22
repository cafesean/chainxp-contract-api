import { Alchemy } from "alchemy-sdk";
import { ethers } from "hardhat";
// import { FastifyInstance } from "fastify";
import { TransactionReceipt, TransactionResponse } from "@ethersproject/providers";
import { GetOwnersForContractWithTokenBalancesResponse, GetOwnersForNftResponse } from "alchemy-sdk/dist/src/types/types";
import { ETH_NETWORK, PROVIDER_API_KEY } from "../../constants/env.constants";


export default class AlchemyClient {
	private readonly alchemy: Alchemy;
	deployerAddress: string = "";

	constructor() { // private readonly network: string, // private readonly apiKey: string,
		this.alchemy = new Alchemy({
			apiKey: PROVIDER_API_KEY,
			network: ETH_NETWORK,
		});
	}

	async initDeployerAddress(): Promise<string> {
		if (!this.deployerAddress) {
			// const [deployer] = await ethers.getSigners();
			this.deployerAddress = await ethers.getSigners().then((signers) => signers[0].getAddress());
		}
		return this.deployerAddress;
	}

	async getTransaction(hash: string): Promise<TransactionResponse | null> {
		return await this.alchemy.core.getTransaction(hash);
	}

	async getTransactionReceipt(hash: string): Promise<TransactionReceipt | null> {
		return await this.alchemy.core.getTransactionReceipt(hash);
	}

	async getTransactionCount(status?: string): Promise<number> {
		for (let i = 0; i < 3; i++) {
			const count = await this.alchemy.core.getTransactionCount(this.deployerAddress, status);
			if (count > 0) {
				return count;
			}
		}
		return 0;
	}

	// async simulateAssetChangesError(hash: string): Promise<string> {
	//   const { error } = await this.alchemy.transact.simulateAssetChanges(hash);
	//   return error ? error.message : "";
	// }

	async getOwnersForContract(contractId: string): Promise<GetOwnersForContractWithTokenBalancesResponse> {
		const result = await this.alchemy.nft.getOwnersForContract(contractId, { withTokenBalances: true });
		return result;
	}

	async getOwnersForNFT(contractId: string, tokenID: string): Promise<GetOwnersForNftResponse> {
		const result = await this.alchemy.nft.getOwnersForNft(contractId, tokenID);
		return result;
	}

	async verifyOwnership(walletAddress: string, contractId: string): Promise<boolean> {
		let data;
		try {
      console.log("alchemy config: ", this.alchemy.config);
			data = await this.alchemy.nft.verifyNftOwnership(walletAddress, contractId);

    } catch (e) {
			console.log(e);
		}
    if (!data) {
      return false;
    }
		return data;
	}
}

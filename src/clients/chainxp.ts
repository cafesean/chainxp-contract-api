import axios from "axios";
import ApiError from "./error";

import type ApiResponse from "./response";

export default class ChainxpClient {
	constructor(private readonly baseUrl: string, private readonly apiKey: string) {}

	async mintCallback<T>(user_address: string, contract_address: string, class_id: number, token_id: number, transaction_id: number, txn_hash: string): Promise<T | undefined> {
		const url = `${this.baseUrl}/api/mintCallback`;
		try {
			// const response = await axios.post<ApiResponse<T>>(
			// 	"https://localhost:3000/api/mintCallback",
			// 	{
			// 		"user_address": "0x358a8a6f2277ea74943f31bf5dfa68bcafa99064",
			// 		"contract_address": "0x3cfbc7ad27b3b5732b41777281d7ff933732f94a",
			// 		"class_id": 1,
			// 		"token_id": 1,
			// 		"transaction_id": 88,
			// 		"txn_hash": "0x39bf57a595a3eb8c421bd19be3e259b0cafd3dd5816569e0108a2f804025fb43"
			// 	},
			// 	{
			// 		headers: {
			// 			"Content-Type": "application/json",
			// 			"x-api-key": "FD@d0c2xlc0",
			// 		},
			// 	}
			// );
			const response = await axios.post<ApiResponse<T>>(
				url,
				{
					user_address: user_address,
					contract_address: contract_address,
					class_id: class_id,
					token_id: token_id,
					transaction_id: transaction_id,
					txn_hash: txn_hash,
				},
				{
					headers: {
						"Content-Type": "application/json",
						"x-api-key": this.apiKey,
					},
				}
			);
			const { data } = response;
			if (response.status !== 200) {
				throw new ApiError(data.code, data.message);
			}
			return data.data;
		} catch (error) {
			if (error instanceof ApiError) {
				throw error;
			}
			throw new ApiError(500, "Internal Server Error");
		}
	}
}

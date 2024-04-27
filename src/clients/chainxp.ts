import axios from "axios";
import ApiError from "./error";

import type ApiResponse from "./response";

export default class ChainxpClient {
	constructor(private readonly baseUrl: string, private readonly apiKey: string) {}

	async mintCallback<T>(user_address: string, contract_address: string, class_id: number, token_id: number, transaction_id: number, txn_hash: string): Promise<T | undefined> {
		const url = `${this.baseUrl}/api/mintCallback`;
		try {
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

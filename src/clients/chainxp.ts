import axios from "axios";
import ApiError from "./error";

import type ApiResponse from "./response";

export default class ChainxpClient {
	constructor(private readonly baseUrl: string, private readonly apiKey: string) {}

	async mintCallback<T>(
		user_address: string,
		contract_address: string,
		class_id: number,
		token_id: number,
		transaction_id: number,
		txn_hash: string
	): Promise<T | undefined> {
		const url = `${this.baseUrl}/api/mintCallback`;
		const { data } = await axios.post<ApiResponse<T>>(
			url,
			{
				txn_hash,
				token_id,
				transaction_id,
				class_id,
				contract_address,
				user_address,
			},
			{
				headers: {
					"Content-Type": "application/json",
					"x-api-key": this.apiKey,
				},
			}
		);
		if (data.code === 200) {
			return data.data;
		}

		throw new ApiError(data.code, data.message);
	}
}

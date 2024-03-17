import axios from "axios";
import ApiError from "./error";

import type ApiResponse from "./response";

export default class ChainxpClient {
	constructor(private readonly baseUrl: string, private readonly apiKey: string) {}

	async mintCallback<T>(
		user_address: string,
		contract_address: string,
		class_id: string,
		txn_hash: string,
		transaction_id: number
	): Promise<T | undefined> {
		const url = `${this.baseUrl}/api/mintCallback`;
		const { data } = await axios.post<ApiResponse<T>>(
			url,
			{
				user_address,
				contract_address,
				class_id,
				txn_hash,
				transaction_id,
			},
			{
				headers: { "x-api-key": this.apiKey },
			}
		);
		if (data.code === 200) {
			return data.data;
		}

		throw new ApiError(data.code, data.message);
	}
}

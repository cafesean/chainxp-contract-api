import axios from 'axios';
import ApiError from './error';

import type ApiResponse from './response';

export default class WalletClient {
  constructor(
    private readonly baseUrl: string,
    private readonly apiKey: string,
  ) {
  }

  async getWallet<T>(userId: number): Promise<T | undefined> {
    const url = `${this.baseUrl}/api/v1/wallet/${userId}`;
    const { data } = await axios.get<ApiResponse<T>>(
      url,
      {
        headers: { 'x-api-key': this.apiKey },
      },
    );
    if (data.code === 200) {
      return data.data;
    }

    throw new ApiError(data.code, data.message);
  }

  async getBalance<T>(userId: number): Promise<T | undefined> {
    const url = `${this.baseUrl}/api/v1/wallet/${userId}/balance`;
    const { data } = await axios.get<ApiResponse<T>>(
      url,
      {
        headers: { 'x-api-key': this.apiKey },
      },
    );
    if (data.code === 200) {
      return data.data;
    }

    throw new ApiError(data.code, data.message);
  }

  async withdrawBalance<T>(
    userId: number,
    bankName: string,
    cardHolder: string,
    cardNo: string,
    amount: number,
    note: string = ''): Promise<T | undefined> {
    const url = `${this.baseUrl}/api/v1/wallet/withdraw`;
    const { data } = await axios.post<ApiResponse<T>>(
      url,
      {
        userId,
        bankName,
        cardHolder,
        cardNo,
        amount,
        note,
      },
      {
        headers: { 'x-api-key': this.apiKey },
      },
    );
    if (data.code === 200) {
      return data.data;
    }

    throw new ApiError(data.code, data.message);
  }

  async listTransaction<T>({
    userId,
    transactionId,
    transactionType,
    status,
    page,
    size,
    startDate,
    endDate,
  }: {
    userId?: number,
    transactionId?: string,
    transactionType?: number,
    status?: number,
    page?: number,
    size?: number,
    startDate?: string,
    endDate?: string,
  }): Promise<T | undefined> {
    const url = `${this.baseUrl}/api/v1/wallet/transaction`;

    if (page === undefined) {
      page = 1;
    }
    if (size === undefined) {
      size = 10;
    }

    const { data } = await axios.get<ApiResponse<T>>(
      url,
      {
        headers: { 'x-api-key': this.apiKey },
        params: {
          userId,
          transactionId,
          transactionType,
          status,
          startDate,
          endDate,
          page,
          size,
        }
      },
    );
    if (data.code === 200) {
      return data.data;
    }

    throw new ApiError(data.code, data.message);
  }

  async getTransaction<T>(transactionId: string): Promise<T | undefined> {
    const url = `${this.baseUrl}/api/v1/wallet/transaction/${transactionId}`;
    const { data } = await axios.get<ApiResponse<T>>(
      url,
      {
        headers: { 'x-api-key': this.apiKey },
      },
    );
    if (data.code === 200) {
      return data.data;
    }

    throw new ApiError(data.code, data.message);
  }

  async createTransaction<T>(
    userId: number,
    transactionId: string,
    transactionType: number,
    payment: number,
    amount: number,
    note: string,
  ): Promise<T | undefined> {
    const url = `${this.baseUrl}/api/v1/wallet/transaction`;
    const { data } = await axios.post<ApiResponse<T>>(
      url,
      {
        userId,
        transactionId,
        transactionType,
        payment,
        amount,
        note,
      },
      {
        headers: { 'x-api-key': this.apiKey },
      },
    );
    if (data.code === 200) {
      return data.data;
    }

    throw new ApiError(data.code, data.message);
  }

  async finishTransaction<T>(
    transactionId: string,
    note: string,
  ): Promise<T | undefined> {
    const url = `${this.baseUrl}/api/v1/wallet/transaction/${transactionId}`;
    const { data } = await axios.put<ApiResponse<T>>(
      url,
      {
        note,
      },
      {
        headers: { 'x-api-key': this.apiKey },
      },
    );
    if (data.code === 200) {
      return data.data;
    }

    throw new ApiError(data.code, data.message);
  }

  async refundTransaction<T>(
    transactionId: string,
    note: string,
  ): Promise<T | undefined> {
    const url = `${this.baseUrl}/api/v1/wallet/transaction/${transactionId}/refund`;
    const { data } = await axios.put<ApiResponse<T>>(
      url,
      {
        note,
      },
      {
        headers: { 'x-api-key': this.apiKey },
      },
    );
    if (data.code === 200) {
      return data.data;
    }

    throw new ApiError(data.code, data.message);
  }

  async closeTransaction<T>(
    transactionId: string,
    note: string,
  ): Promise<T | undefined> {
    const url = `${this.baseUrl}/api/v1/wallet/transaction/${transactionId}/close`;
    const { data } = await axios.put<ApiResponse<T>>(
      url,
      {
        note,
      },
      {
        headers: { 'x-api-key': this.apiKey },
      },
    );
    if (data.code === 200) {
      return data.data;
    }

    throw new ApiError(data.code, data.message);
  }

  async createWallet<T>(
    userId: number,
    address: string,
    privateKey: string,
  ): Promise<T | undefined> {
    const url = `${this.baseUrl}/api/v1/wallet`;
    const { data } = await axios.post<ApiResponse<T>>(
      url,
      {
        userId,
        address,
        privateKey,
      },
      {
        headers: { 'x-api-key': this.apiKey },
      },
    );
    if (data.code === 200) {
      return data.data;
    }

    throw new ApiError(data.code, data.message);
  }
}

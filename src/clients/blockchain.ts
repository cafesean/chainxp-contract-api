import axios from 'axios';
import ApiError from './error';

import type ApiResponse from './response';

export default class BlockChainClient {
  constructor(
    private readonly baseUrl: string,
    private readonly apiKey: string,
  ) {
  }

  async deploy<T>(
    organizerId: string,
    name: string,
    uri: string,
  ): Promise<T | undefined> {
    const url = `${this.baseUrl}/api/v1/contract/deploy`;
    const { data } = await axios.post<ApiResponse<T>>(
      url,
      {
        organizerId,
        name,
        uri,
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

  async register<T>(
    contractId: string,
    classId: string,
    organizerId: string,
    eventId: string,
    ticketId: string,
    ticketTypeId: string,
  ): Promise<T | undefined> {
    const url = `${this.baseUrl}/api/v1/contract/${contractId}/register/${classId}`;
    const { data } = await axios.post<ApiResponse<T>>(
      url,
      {
        organizerId,
        eventId,
        ticketId,
        ticketTypeId,
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

  async findContract<T>(organizerId: string): Promise<T | undefined> {
    const url = `${this.baseUrl}/api/v1/contract/find`;
    const { data } = await axios.get<ApiResponse<T>>(
      url,
      {
        headers: { 'x-api-key': this.apiKey },
        params: {
          organizerId,
        },
      }
    );
    if (data.code === 200) {
      return data.data;
    }

    throw new ApiError(data.code, data.message);
  }

  async findContractEvent<T>(contractId: string, classId: string): Promise<T | undefined> {
    const url = `${this.baseUrl}/api/v1/contract/event/${contractId}/${classId}`;
    const { data } = await axios.get<ApiResponse<T>>(
      url,
      {
        headers: { 'x-api-key': this.apiKey },
      }
    );
    if (data.code === 200) {
      return data.data;
    }

    throw new ApiError(data.code, data.message);
  }

  async query<T>(
    organizerId: string,
    eventId: string,
    ticketId: string,
    ticketTypeId: string,
  ): Promise<T | undefined> {
    const url = `${this.baseUrl}/api/v1/contract/query`;
    const { data } = await axios.get<ApiResponse<T>>(
      url,
      {
        headers: { 'x-api-key': this.apiKey },
        params: {
          organizerId,
          eventId,
          ticketId,
          ticketTypeId,
        },
      }
    );
    if (data.code === 200) {
      return data.data;
    }

    throw new ApiError(data.code, data.message);
  }

  async addClass<T>(
    contractId: string,
    name: string,
    desc: string,
    total: number,
  ): Promise<T | undefined> {
    const url = `${this.baseUrl}/api/v1/contract/${contractId}/class`;
    const { data } = await axios.post<ApiResponse<T>>(
      url,
      {
        name,
        desc,
        total,
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

  async setClassMetadata<T>(
    contractId: string,
    classId: string,
    metadataUrl: string,
  ): Promise<T | undefined> {
    const url = `${this.baseUrl}/api/v1/contract/${contractId}/class/${classId}`;
    const { data } = await axios.put<ApiResponse<T>>(
      url,
      {
        metadataUrl,
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

  async mint<T>(
    contractId: string,
    classId: string,
    userAddress: string,
    amount: number,
  ): Promise<T | undefined> {
    const url = `${this.baseUrl}/api/v1/contract/${contractId}/mint/${classId}`;
    const { data } = await axios.post<ApiResponse<T>>(
      url,
      {
        userAddress,
        amount,
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

  async transfer<T>(
    contractId: string,
    classId: string,
    from: string,
    to: string,
    amount: number,
  ): Promise<T | undefined> {
    const url = `${this.baseUrl}/api/v1/contract/${contractId}/transfer/${classId}`;
    const { data } = await axios.post<ApiResponse<T>>(
      url,
      {
        from,
        to,
        amount,
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

  async confirmTransaction<T>(txnHash: string): Promise<T | undefined> {
    const url = `${this.baseUrl}/api/v1/contract/transaction/${txnHash}/confirm`;
    const { data } = await axios.post<ApiResponse<T>>(
      url,
      {},
      {
        headers: { 'x-api-key': this.apiKey },
      }
    );
    if (data.code === 200) {
      return data.data;
    }

    throw new ApiError(data.code, data.message);
  }

  async verify<T>(txnHash: string): Promise<T | undefined> {
    const url = `${this.baseUrl}/api/v1/contract/transaction/${txnHash}/status`;
    const { data } = await axios.post<ApiResponse<T>>(
      url,
      {},
      {
        headers: { 'x-api-key': this.apiKey },
      }
    );
    if (data.code === 200) {
      return data.data;
    }

    throw new ApiError(data.code, data.message);
  }
}

type Contract = {
	contractName?: string;
	name?: string;
	title?: string;
	baseUri?: string;
	description?: string | null;
	symbol?: string;
	fungible: number;
};

type DecryptWallet = {
	iv: string;
	encryptedKey: string;
	salt: string;
	password: string;
};

type ContractTypes = {
	delegateAddress: string;
	proxyAddress: string;
	factoryAddress: string;
};

type DeployedContract = {
	address: string;
	is_new_version: boolean;
};

type Series = {
	name: string;
	title: string;
	description: string;
	slug: string;
	requirements: string;
	imageUrl: string;
	fungible: number;
};

export type DeployAllBlockchainContractRequest = Contract & DecryptWallet;
export type DeployAllBlockchainContractResponse = Omit<ContractTypes, "factoryAddress">;
export type CloneProxyBlockchainRequest = Contract &
	ContractTypes & {
		orgId: number;
		seriesId: number;
		imageUrl: string;
		slug: string;
		requirements?: string;
		externalLink?: string;
	};

export type CloneProxyBlockchainResponse = {
	cloneAddress: string;
	seriesId: number;
};

export type DeploySingleContractRequest = Contract & DecryptWallet;

export type DeploySingleContractResponse = {
	newContractAddress: string;
};

export type DeployFactoryContractRequest = DecryptWallet & {
	name?: string;
	proxyAddress: string;
};

export type DeployFactoryContractResponse = {
	factoryAddress: string;
};

export type ConfigureProxyDelegateRequest = Omit<ContractTypes, "factoryAddress"> & DecryptWallet;

export type ConfigureProxyDelegateResponse = {
	contract: Omit<DeploySmartContract, "factory">;
};

export type DeploySmartContract = {
	proxy: DeployedContract;
	delegate: DeployedContract;
	factory: DeployedContract;
};

export type PublishXPCloneAddressPayload = Omit<Series, "fungible"> & {
	classId: string;
	description: string;
};

export type PublishXPCloneAddressResponse = {
	xpId: number;
	classId: string;
};

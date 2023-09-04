import * as crypto from "crypto";

// Map to store encrypted private keys associated with wallet addresses
// const encryptedPrivateKeys = new Map<string, string>();

// Function to encrypt a private key using a password and an IV
export const encryptPrivateKey: (privateKey: string, password: string, iv: string) => string = (privateKey, password, iv) => {
	// Generate a key from the password using PBKDF2
	const key = crypto.pbkdf2Sync(password, "salt", 100000, 32, "sha256");
	const ivBuffer = Buffer.from(iv, 'hex');
	const cipher = crypto.createCipheriv("aes-256-cfb", key, ivBuffer);
	let encrypted = cipher.update(privateKey, "utf-8", "hex");
	encrypted += cipher.final("hex");
	return encrypted;
};

// Function to decrypt a private key using a password and an IV
export function decryptPrivateKey(encryptedPrivateKey: string, password: string, iv: string): string {
	// Generate a key from the password using PBKDF2
	const key = crypto.pbkdf2Sync(password, "salt", 100000, 32, "sha256");
	const ivBuffer = Buffer.from(iv, 'hex');
	const decipher = crypto.createDecipheriv("aes-256-cfb", key, ivBuffer);
	let decrypted = decipher.update(encryptedPrivateKey, "hex", "utf-8");
	decrypted += decipher.final("utf-8");
	return decrypted;
}

// Function to store encrypted private key associated with a wallet address
// function storePrivateKey(walletAddress: string, privateKey: string, password: string, iv: Buffer): void {
//     const encryptedPrivateKey = encryptPrivateKey(privateKey, password, iv);
//     encryptedPrivateKeys.set(walletAddress, encryptedPrivateKey);
// }

// Function to send a smart contract transaction using a wallet address, password, and IV
// async function sendTransaction(walletAddress: string, password: string, iv: Buffer, to: string, value: number, data: string): Promise<void> {
//     const encryptedPrivateKey = encryptedPrivateKeys.get(walletAddress);
//     if (!encryptedPrivateKey) {
//         throw new Error('Wallet address not found');
//     }
//     const privateKey = decryptPrivateKey(encryptedPrivateKey, password, iv);

// TODO: Use the decrypted private key to send a smart contract transaction
// Example:
// const tx = {
//     to: to,
//     value: value,
//     data: data,
// };
// const signedTx = await web3.eth.accounts.signTransaction(tx, privateKey);
// const receipt = await web3.eth.sendSignedTransaction(signedTx.rawTransaction);
// console.log('Transaction receipt:', receipt);
// }

// Example usage:
// const iv = crypto.randomBytes(16);
// storePrivateKey('0x1234567890abcdef1234567890abcdef12345678', 'private_key_here', 'password_here', iv);
// sendTransaction('0x1234567890abcdef1234567890abcdef12345678', 'password_here', iv, '0xabcdefabcdefabcdefabcdefabcdefabcdefabcdef', 100, '0x12345678');

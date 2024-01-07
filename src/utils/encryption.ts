import * as crypto from "crypto";
import Web3 from 'web3';

// Map to store encrypted private keys associated with wallet addresses
// const encryptedPrivateKeys = new Map<string, string>();

// Function to encrypt a private key using a password and an IV
export const encryptPrivateKey: (privateKey: string, password: string, iv: string) => string = (
	privateKey,
	password,
	iv
) => {
	// Generate a key from the password using PBKDF2
	const key = crypto.pbkdf2Sync(password, "salt", 100000, 32, "sha256");
	const ivBuffer = Buffer.from(iv, "hex");
	const cipher = crypto.createCipheriv("aes-256-cfb", key, ivBuffer);
	let encrypted = cipher.update(privateKey, "utf-8", "hex");
	encrypted += cipher.final("hex");
	return encrypted;
};

// Function to decrypt a private key using a password and an IV
export function decryptPrivateKey(encryptedPrivateKey: string, password: string, iv: string): string {
	// Generate a key from the password using PBKDF2
	const key = crypto.pbkdf2Sync(password, "salt", 100000, 32, "sha256");
	const ivBuffer = Buffer.from(iv, "hex");
	const decipher = crypto.createDecipheriv("aes-256-cfb", key, ivBuffer);
	let decrypted = decipher.update(encryptedPrivateKey, "hex", "utf-8");
	decrypted += decipher.final("utf-8");
	return decrypted;
}

export async function decryptKeystore(keystoreJson: any, password: string) {
	try {
		const web3 = new Web3();
		const decryptedAccount = await web3.eth.accounts.decrypt(keystoreJson, password);
		return decryptedAccount.privateKey;
	} catch (error) {
		console.error("Error decrypting keystore:", error);
		return null;
	}
}

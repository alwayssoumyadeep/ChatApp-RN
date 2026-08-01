// src/utils/crypto.js
import { p256 } from "@noble/curves/nist.js";
import { gcm } from "@noble/ciphers/aes.js";
import { sha256 } from "@noble/hashes/sha2.js";
import { bytesToHex, hexToBytes } from "@noble/curves/utils.js";

export function generateKeyPair() {
  const { secretKey: privateKey, publicKey } = p256.keygen();
  return {
    privateKey: bytesToHex(privateKey),
    publicKey: bytesToHex(publicKey),
  };
}

export function deriveSharedKey(myPrivateKeyHex, theirPublicKeyHex) {
  const myPrivateKey = hexToBytes(myPrivateKeyHex);
  const theirPublicKey = hexToBytes(theirPublicKeyHex);
  const sharedPoint = p256.getSharedSecret(myPrivateKey, theirPublicKey);
  const aesKey = sha256(sharedPoint).slice(0, 32);
  return aesKey;
}

export function encryptMessage(plainText, aesKey) {
  const nonce = crypto.getRandomValues(new Uint8Array(12));
  const cipher = gcm(aesKey, nonce);
  const plainBytes = new TextEncoder().encode(plainText);
  const ciphertext = cipher.encrypt(plainBytes);
  return { ciphertext: bytesToHex(ciphertext), iv: bytesToHex(nonce) };
}

export function decryptMessage(ciphertextHex, ivHex, aesKey) {
  try {
    const nonce = hexToBytes(ivHex);
    const ciphertext = hexToBytes(ciphertextHex);
    const cipher = gcm(aesKey, nonce);
    const plainBytes = cipher.decrypt(ciphertext);
    return new TextDecoder().decode(plainBytes);
  } catch (err) {
    return "[Unable to decrypt]";
  }
}
import "fast-text-encoding";

import { p256 } from '@noble/curves/nist.js';
import { gcm } from '@noble/ciphers/aes.js';
import { bytesToHex, hexToBytes } from '@noble/curves/utils.js';
import { sha256 } from '@noble/hashes/sha2.js';

export function generateKeyPair() {
  const { secretKey, publicKey } = p256.keygen();
  return {
    privateKey: bytesToHex(secretKey),
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

  return {
    ciphertext: bytesToHex(ciphertext),
    iv: bytesToHex(nonce),
  };
}

export function decryptMessage(ciphertextHex, ivHex, aesKey) {
  if (!ciphertextHex || !ivHex || !aesKey) {
    return "[Invalid message]";
  }

  try {
    const nonce = hexToBytes(ivHex);
    const ciphertext = hexToBytes(ciphertextHex);

    const cipher = gcm(aesKey, nonce);
    const plainBytes = cipher.decrypt(ciphertext);

    return new TextDecoder().decode(plainBytes);
  } catch (err) {
    console.log("DECRYPT ERROR:", err);
    return "[Unable to decrypt]";
  }
}
export async function encryptWithPassword(password: string, text: string) {
  const encoder = new TextEncoder();
  const salt = crypto.getRandomValues(new Uint8Array(16));
  
  // Generate ECC key pair
  const keyPair = await crypto.subtle.generateKey(
    {
      name: "ECDH",
      namedCurve: "P-256"
    },
    true,
    ["deriveKey", "deriveBits"]
  );

  // Derive shared secret from password
  const keyMaterial = await getKeyMaterial(password);
  const sharedSecret = await deriveKey(keyMaterial, salt);

  // Encrypt with shared secret
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const encrypted = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv },
    sharedSecret,
    encoder.encode(text)
  );

  // Export public key
  const publicKey = await crypto.subtle.exportKey("raw", keyPair.publicKey);

  return {
    salt: bufferToBase64(salt),
    iv: bufferToBase64(iv),
    data: bufferToBase64(encrypted),
    publicKey: bufferToBase64(publicKey)
  };
}

export async function decryptWithPassword(password: string, saltB64: string, ivB64: string, dataB64: string, publicKeyB64: string) {
  const decoder = new TextDecoder();
  
  const salt = base64ToBuffer(saltB64);
  const iv = base64ToBuffer(ivB64);
  const data = base64ToBuffer(dataB64);
  const publicKey = base64ToBuffer(publicKeyB64);

  // Import public key
  const importedPublicKey = await crypto.subtle.importKey(
    "raw",
    publicKey,
    {
      name: "ECDH",
      namedCurve: "P-256"
    },
    false,
    []
  );

  // Derive shared secret from password
  const keyMaterial = await getKeyMaterial(password);
  const sharedSecret = await deriveKey(keyMaterial, salt);

  const decrypted = await crypto.subtle.decrypt(
    { name: "AES-GCM", iv },
    sharedSecret,
    data
  );

  return decoder.decode(decrypted);
}

async function getKeyMaterial(password: string): Promise<CryptoKey> {
  const enc = new TextEncoder();
  return crypto.subtle.importKey(
    "raw",
    enc.encode(password),
    { name: "PBKDF2" },
    false,
    ["deriveBits", "deriveKey"]
  );
}

async function deriveKey(keyMaterial: CryptoKey, salt: Uint8Array): Promise<CryptoKey> {
  return crypto.subtle.deriveKey(
    {
      name: "PBKDF2",
      salt: salt,
      iterations: 100000,
      hash: "SHA-256"
    },
    keyMaterial,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt", "decrypt"]
  );
}

function bufferToBase64(buffer: ArrayBuffer | Uint8Array): string {
  return Buffer.from(buffer).toString("base64");
}

function base64ToBuffer(base64: string): Uint8Array {
  return new Uint8Array(Buffer.from(base64, "base64"));
} 
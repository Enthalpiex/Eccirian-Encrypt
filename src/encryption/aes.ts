export async function aesEncrypt(content: string): Promise<{ key: string, iv: string, data: string }> {
    const encoder = new TextEncoder();
    const contentBytes = encoder.encode(content);
  
    const iv = crypto.getRandomValues(new Uint8Array(12));
    const aesKey = await crypto.subtle.generateKey(
      { name: "AES-GCM", length: 256 },
      true,
      ["encrypt", "decrypt"]
    );
  
    const encryptedContent = await crypto.subtle.encrypt(
      { name: "AES-GCM", iv },
      aesKey,
      contentBytes
    );
  
    const rawKey = await crypto.subtle.exportKey("raw", aesKey);
  
    return {
      key: Buffer.from(rawKey).toString("base64"),
      iv: Buffer.from(iv).toString("base64"),
      data: Buffer.from(encryptedContent).toString("base64")
    };
  }
  
  export async function aesDecrypt(keyBase64: string, ivBase64: string, dataBase64: string): Promise<string> {
    const rawKey = Buffer.from(keyBase64, "base64");
    const iv = Buffer.from(ivBase64, "base64");
    const encryptedData = Buffer.from(dataBase64, "base64");
  
    const aesKey = await crypto.subtle.importKey(
      "raw",
      rawKey,
      { name: "AES-GCM" },
      false,
      ["decrypt"]
    );
  
    const decryptedContent = await crypto.subtle.decrypt(
      { name: "AES-GCM", iv },
      aesKey,
      encryptedData
    );
  
    const decoder = new TextDecoder();
    return decoder.decode(decryptedContent);
  }
  
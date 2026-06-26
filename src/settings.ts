export interface EccEncryptSettings {
    encryptionMethod: "AES" | "ECC";
    defaultEncryptionMode: "temporary" | "permanent";
    iconStyle: "lock" | "shield" | "key" | "padlock";
    requirePasswordConfirmation: boolean;
    showToggleExtensionButton: boolean;
    showNotice: boolean;
    showHint: boolean;
    fileExtension: string;
    encryptAttachments: boolean;
    kdfType: "PBKDF2" | "Argon2id";
    pbkdf2Iterations: 100000 | 600000 | 1000000;
    argon2MemoryKB: number;      // e.g., 24576 (24MB)
    argon2Iterations: number;    // e.g., 2
    argon2Parallelism: number;   // e.g., 1
    argon2HashLen: number;       // e.g., 32
    // Advanced settings
    enableKeyCache: boolean;
    keyCacheTTL: number;         // minutes
    keyCacheMaxSize: number;     // max keys to cache
  }
  
  export const DEFAULT_SETTINGS: EccEncryptSettings = {
    encryptionMethod: "ECC",
    defaultEncryptionMode: "temporary",
    iconStyle: "lock",
    requirePasswordConfirmation: true,
    showToggleExtensionButton: false,
    showNotice: false,
    showHint: true,
    fileExtension: "eccirian",
    encryptAttachments: true,
    kdfType: "PBKDF2",
    pbkdf2Iterations: 600000,
    argon2MemoryKB: 24576,
    argon2Iterations: 2,
    argon2Parallelism: 1,
    argon2HashLen: 32,
    // Advanced defaults
    enableKeyCache: true,
    keyCacheTTL: 5,
    keyCacheMaxSize: 10,
  };
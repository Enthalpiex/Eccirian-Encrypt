export interface EccEncryptSettings {
    encryptionMethod: "AES" | "ECC";
    defaultEncryptionMode: "temporary" | "permanent";
    iconStyle: "lock" | "shield" | "key" | "padlock";
  }
  
  export const DEFAULT_SETTINGS: EccEncryptSettings = {
    encryptionMethod: "AES",
    defaultEncryptionMode: "temporary",
    iconStyle: "lock"
  };
  
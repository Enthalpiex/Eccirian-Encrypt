export interface EccEncryptSettings {
    encryptionMethod: "AES" | "ECC";
    defaultEncryptionMode: "temporary" | "permanent";
    iconStyle: "lock" | "shield" | "key" | "padlock";
    requirePasswordConfirmation: boolean;
    showToggleExtensionButton: boolean;
    showNotice: boolean;
    showHint: boolean;
  }
  
  export const DEFAULT_SETTINGS: EccEncryptSettings = {
    encryptionMethod: "AES",
    defaultEncryptionMode: "temporary",
    iconStyle: "lock",
    requirePasswordConfirmation: false,
    showToggleExtensionButton: false,
    showNotice: true,
    showHint: true
  };
  
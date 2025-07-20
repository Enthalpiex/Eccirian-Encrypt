![Eccidian_RDM2 - pre](https://github.com/user-attachments/assets/e6ae4359-d1fe-4613-99b0-3edf6007cdec)

# ⚠️WARNING: EARLY ACCESS 0.9.0

# Eccidian Encrypt – Encrypted Files for Obsidian

The better encryption plugin for Obsidian. Encrypt your files.

**Eccidian** is a security-focused Obsidian encryption plugin that supports seamless encryption and decryption of files using multiple advanced password-based encryption methods. 

It introduces a custom file extensions and provides a unique read-only view for locked files, allowing you to easily manage sensitive information directly in Obsidian.


[![Stars](https://img.shields.io/github/stars/Enthalpiex/Eccidian-Encrypt?style=social)](https://github.com/Enthalpiex/Eccidian-Encrypt/stargazers)
[![Release](https://img.shields.io/github/v/release/Enthalpiex/Eccidian-Encrypt?include_prereleases&label=release)](https://github.com/Enthalpiex/Eccidian-Encrypt/releases)
[![Issues](https://img.shields.io/github/issues/Enthalpiex/Eccidian-Encrypt)](https://github.com/Enthalpiex/Eccidian-Encrypt/issues)
[![License](https://img.shields.io/github/license/Enthalpiex/Eccidian-Encrypt)](https://github.com/Enthalpiex/Eccidian-Encrypt/blob/main/LICENSE)
[![Last Commit](https://img.shields.io/github/last-commit/Enthalpiex/Eccidian-Encrypt)](https://github.com/Enthalpiex/Eccidian-Encrypt/commits/main)


---

##  Why Eccidian?

Eccidian is designed for users who want secure encryption in Obsidian **without sacrificing speed, usability, or compatibility**.

Compared to similar plugins (e.x. *[Meld Encrypt](https://github.com/meld-cp/obsidian-encrypt)*), Eccidian offers:

- ⚡ **Low performance overhead** — encryption and decryption happen instantly with no noticeable lag.
- 🧩 **Optional composite encryption methods** — choose your level of security.
- 🔁 **Flexible mode switching** — choose between temporary or permanent encryption.
- 🖼️ **Full compatibility** with `Hover Editor` and `Page Preview` — thanks to the locked page view, you won't get annoying popups on hover.
- 🖋️ **Customizable locked page** — personalize the locked view message and appearance.
- 🛡️ **Minimal interference with workflow** — locked files integrate cleanly into your vault without breaking navigation or previews.

---

##  Features

- 🔁 One-click encryption/decryption of **any** file type—not just `.md`.
- 🔒 AES and ECC based password encryption.
- 📄 Custom view that shows a locked page instead of the default editor.
- 🧷 Files remain read-only until unlocked via user input.
- ⚙️ UI and control panel support.
- 📦 Modular architecture for maintainability and expansion.
- ☁️ Cloud-sync and sharing friendly.

---

##  Security

1. **AES-256-GCM**
   - 256-bit key length
   - Galois/Counter Mode (GCM) for authenticated encryption
   - PBKDF2 key derivation with 100,000 iterations
   - SHA-256 hash function
   - 16-byte random salt
   - 12-byte initialization vector (IV)

2. **ECC+AES**
   - P-256 curve (secp256r1)
   - ECDH key exchange
   - Combined with AES-GCM for data encryption
   - Same PBKDF2 parameters as AES method

- **Password Protection**: Passwords are never stored in any form.
- **Decryption**: For the permanently encrypted files you set, they will never be automatically decrypted to the hard disk unless you allow them to be.
- **Salt Protection**: Unique salt for each encryption prevents rainbow table attacks.

---

##  Installation

### Method 1. (Under review) Official Community Release

To be published to the Obsidian Community Plugin Marketplace.

You can clone the current repository to try it out first, but please do not update before the official release - the encryption logic may **change**.


###  Method 2. Release File

1. **Download & extract** the release.
2. Move the files into your Obsidian vault's plugin directory:

```
<your-vault>/.obsidian/plugins/eccidian-encrypt/
```

3. Open Obsidian:
   - Go to **Settings → Community Plugins**.
   - Enable **Eccidian Encrypt** from the list.

---

##  Usage

Temporary encryption: Your file will be converted to ordinary md when decrypted.
Permanent encryption: Your file will retain the password you originally set and will remain valid after decryption.

1. Open any file.
2. Run the `Eccidian Encrypt: Encrypt/Decrypt Note` command from the Command Palette (`Ctrl+P`) or click left icon.
3. Enter a password to encrypt or decrypt.
4. Encrypted files will be renamed to `.eccidian` or `.peccidian`and shown as locked views.
5. Click “Unlock” and enter the password to decrypt and return to edit mode.

## Others 

6. Run the `Eccidian Encrypt: Convert to Markdown` command from the Command Palette (`Ctrl+P`) or click left icon to decrypt the peccidian file into a normal file.
7. Run the `Eccidian Encrypt: Toggle file Extension` command from the Command Palette (`Ctrl+P`) or click left icon to force conversion between md and eccidian files, or create fake encrypted views.

---

##  Security Notes

- The plugin is designed for personal use and basic security needs.
- Do not use it for storing highly sensitive or critical information.
- The developer is not responsible for any loss of encrypted data.
- If you forget your password, there is no way to recover the encrypted data.

---

##  License

MPL-2.0 License © 2025 Entropiex

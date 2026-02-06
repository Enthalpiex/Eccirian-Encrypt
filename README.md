> [!Caution]
> Version 1.0.6 had a vulnerability that could cause notes to be lost. Please update to newest version.

<img alt="Eccirian_preview" src="https://github.com/user-attachments/assets/dfa58b45-0136-4b81-b29d-851cf82a3554" />

# Next-generation file encryption solution

[![Obsidian](https://img.shields.io/badge/Obsidian-0.15.0+-purple.svg)](https://obsidian.md) [![Stars](https://img.shields.io/github/stars/Enthalpiex/eccirian-Encrypt?style=social)](https://github.com/Enthalpiex/eccirian-Encrypt/stargazers)

[![Release](https://img.shields.io/github/v/release/Enthalpiex/eccirian-Encrypt?include_prereleases&label=release)](https://github.com/Enthalpiex/eccirian-Encrypt/releases) [![Issues](https://img.shields.io/github/issues/Enthalpiex/eccirian-Encrypt)](https://github.com/Enthalpiex/eccirian-Encrypt/issues) [![Last Commit](https://img.shields.io/github/last-commit/Enthalpiex/eccirian-Encrypt)](https://github.com/Enthalpiex/eccirian-Encrypt/commits/main)

---

> [!Caution]
> 
> - This plugin is designed for **personal use** and **reasonable security needs**
> - **Not recommended** for highly classified or mission-critical information
> - **Always backup** your vault before encrypting important files
> - **Remember your passwords** and there is **NO** recovery mechanism
> - The developer is not responsible for **any data loss**

# Stable Release 1.0.0

**Eccirian Encrypt** is a security-focused Obsidian plugin which provides safe and seamless file encryption. The plugin adds file-level encryption and decryption capabilities to your vault, using AES-256-GCM and ECC-P-256 cryptographic encryption algorithms. By introduces custom file extensions and read-only view for locked files, allowing you to easily manage sensitive information directly in Obsidian. It is also the only plugin that supports one-click encryption of all link attachments.

## Why Eccirian?

### Attachment Encryption

Unlike other encryption plugins that only encrypt note content, Eccirian can **encrypt your attachments** (images, PDFs, documents) alongside your notes.

### Lightning Fast

Zero performance overhead. Encryption and decryption both utilize the browser's native Web Crypto API `crypto.subtle` for hardware-accelerated AES-GCM operations. Key derivation meets OWASP's minimum security requirements without sacrificing speed by useing the `PBKDF2` algorithm.

### Flexible Mode Switching

- **Temporary Mode** (`.eccirian`) - One-time password, auto-decrypt on open
- **Permanent Mode** (`.peccirian`) - Persistent encryption, password are required every time

### **Maximum Security**

- **AES-256-GCM** - Industry standard symmetric encryption
- **ECC + AES** - Hybrid encryption for maximum security

---

## Features

Compared to similar plugins (e.x. *[Meld Encrypt](https://github.com/meld-cp/obsidian-encrypt)*), eccirian offers:

- ⚡ **Low Performance Overhead** - Encryption and decryption happen instantly with no noticeable lag
- 🧩 **Composite Encryption methods** - Optional hybrid Elliptic Curve Cryptography asymmetric encryption
- 🔐 **Flexible Mode Switching** - Protect both your markdown files and linked attachments
- 📁 **Any File Type** - Not limited to `.md` files, encrypt any file format
- 🎨 **Customized Lock Screen** - Custom read-only view for encrypted files
- 🖼️**Super Compatibility** - Full compatibility with all hover preview and editing plugins
- ⚙️ **Hardware Acceleration** - Supports hardware-accelerated encryption and decryption
- ☁️ **Cloud-sync friendly** - Encrypted files work seamlessly with sync services

---

## Compare

| Feature                   | Eccirian Encrypt | Meld Encrypt | Other Plugins |
| ------------------------- | ---------------- | ------------ | ------------- |
| **Attachment Encryption** | ✅ Yes            | ❌ No         | ❌ No          |
| **Lock Screen View**      | ✅ Yes            | ❌ No         | ❌ No          |
| **Super Compatibility**   | ✅ Yes            | ❌ No         | ⚠️ Varies     |
| **Multiple Algorithms**   | ✅ AES + ECC      | ⚠️ AES       | ⚠️ Varies     |
| **Temporary Encryption**  | ✅ Yes            | ❌ No         | ❌ No          |
| **Performance**           | ⚡ Instant        | ✅ Normal     | ⚠️ Varies     |
| **Cloud Sync Friendly**   | ✅ Yes            | ✅ Yes        | ⚠️ Varies     |

---

## Security & Encryption Algorithms

**1. AES-256-GCM (Default)**

- 256-bit key length
- Galois/Counter Mode (GCM) for authenticated encryption
- PBKDF2 1,000,000 iterations or Argon2id key derivation
- SHA-256 hash function
- 16-byte random salt per encryption
- 12-byte initialization vector (IV)

**2. ECC + AES (Advanced)**

- P-256 elliptic curve (secp256r1)
- ECDH key exchange for key agreement
- Combined with AES-256-GCM for data encryption
- Same PBKDF2 parameters as AES method

In addition:

- **Password Protection** - Passwords are never saved anywhere
- **Unique Salts** - Each encryption uses a fresh random salt
- **Authenticated Encryption** - GCM mode prevents tampering
- **Memory-only Decryption** - Permanent mode files stay encrypted on disk

---

## 📦 Installation

### Method 1: [Community Plugins](https://obsidian.md/plugins?search=eccirian#) (Recommended)

1. Open Obsidian Settings
2. Go **Community Plugins** → **Browse**
3. Search for "**Eccirian Encrypt**"
4. Click **Install** → **Enable**

### Method 2: Manual Installation

1. Download the latest release `release.zip` file from [GitHub Releases](https://github.com/Enthalpiex/eccirian-encrypt/releases)

2. Extract the files to your vault's plugin directory:
   
   ```
   <your-vault>/.obsidian/plugins/eccirian-encrypt/
   ```

3. Reload Obsidian

4. Enable the plugin in **Settings → Community Plugins**

---

## 🚀 Quick Start

### Basic

**Temporary Mode** (Auto-decrypt on open)

1. Open any note
2. Click the lock icon in the ribbon, or use `Ctrl+P` → "Encrypt/Decrypt file"
3. Enter a password
4. Your note encrypted as `.eccirian`
5. Click "Unlock" to decrypt back to `.md`

**Permanent Mode** (Always encrypted)

1. Go to **Settings → Eccirian Encrypt**
2. Set **Default Encryption Mode** to "Permanent"
3. Encrypt a note (same steps as above)
4. File becomes `.peccirian` and requires password every time you open it

### Commands

**Convert to Markdown**

- Converts `.peccirian` files to regular `.md` files
- Use: `Ctrl+P` → "Convert to Markdown"
- Or click the convert icon in the ribbon

**Toggle File Extension**

- Force conversion between `.md` and `.eccirian` extensions
- Useful for creating encrypted views or fixing extension issues
- Use: `Ctrl+P` → "Toggle file Extension"

---

## FAQ

**Q: What happens if I forget my password?**  
A: Unfortunately, there's no way to recover encrypted data without the password.

**Q: Can I use this with Sync?**  
A: Yes. Encrypted files sync perfectly across devices. [Remotely Save](https://github.com/remotely-save/remotely-save) is a great plugin to do this.

**Q: Does attachment encryption work with Permanent mode?**  
A: Yes. As of v1.0.0, both Temporary and Permanent modes support attachment encryption with different strategies.

**Q: Are my passwords stored anywhere?**  
A: No. Passwords are never stored. They're only used during encryption/decryption and immediately discarded.

**Q: Can I encrypt folders?**  
A: Yes. Right-click any folder and select "Encrypt Folder" from the command palette. The entire folder structure is preserved.

---

## Contributing & Support

Contributions are welcome! Please feel free to: [GitHub Issues](https://github.com/Enthalpiex/eccirian-encrypt/issues)

If you find this plugin helpful:

- ⭐ Star the repo on [GitHub](https://github.com/Enthalpiex/eccirian-encrypt)
- 🎁 Support development on [Aifadian](https://afdian.com/a/entropiex)
- 📢 Share with others who might benefit

**MPL-2.0 License** © 2025 [Entropiex](https://github.com/Enthalpiex)

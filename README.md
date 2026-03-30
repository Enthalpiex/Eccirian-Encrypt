<img alt="Eccirian-trs" src="https://github.com/user-attachments/assets/4cba2d6d-92e8-4485-8895-b2f7ea2d22ff" />


---

[![Obsidian](https://img.shields.io/badge/Obsidian-0.15.0+-purple.svg)](https://obsidian.md) [![Stars](https://img.shields.io/github/stars/Enthalpiex/eccirian-Encrypt?style=social)](https://github.com/Enthalpiex/eccirian-Encrypt/stargazers)

[![Release](https://img.shields.io/github/v/release/Enthalpiex/eccirian-Encrypt?include_prereleases&label=release)](https://github.com/Enthalpiex/eccirian-Encrypt/releases) [![Issues](https://img.shields.io/github/issues/Enthalpiex/eccirian-Encrypt)](https://github.com/Enthalpiex/eccirian-Encrypt/issues) [![Last Commit](https://img.shields.io/github/last-commit/Enthalpiex/eccirian-Encrypt)](https://github.com/Enthalpiex/eccirian-Encrypt/commits/main)

---

> [!Caution]
> 
> - This plugin is designed for personal use and reasonable security needs
> - Not recommended for highly classified or mission-critical information
> - Always backup your vault before encrypting important files
> - The developer is not responsible for any data loss
> - Losing the password means losing the file

## Next-generation file encryption solution

**Eccirian Encrypt** is a security-focused Obsidian plugin which provides safe and seamless file encryption. The plugin adds file-level encryption and decryption capabilities to your vault, using AES-256-GCM and ECC-P-256 cryptographic encryption algorithms. By introduces custom file extensions and read-only view for locked files, allowing you to easily manage sensitive information directly in Obsidian. It is also the only plugin that supports one-click encryption of all link attachments.

![Demo](https://github.com/user-attachments/assets/d8fe356c-e66e-41c8-8b44-2eb7f93095c2)


## Features

Eccirian Encrypt provides file-level encryption inside Obsidian.

- Encrypt notes and linked attachments together
- Two file modes:
   - Temporary mode (`.eccirian`): unlock once, then edit normally
   - Permanent mode (`.peccirian`): stays encrypted on disk and asks for password when opened
- Works with common file types, not only `.md`
- Includes a read-only view for locked files
- Uses Web Crypto API (`crypto.subtle`) for AES operations

Current platform support is focused on Windows and macOS.

---

## Security & Encryption Algorithms

### AES-256-GCM (Default)

- 256-bit key
- GCM authenticated encryption
- SHA-256
- 16-byte random salt
- 12-byte IV

### ECC + AES (Advanced)

- Curve: P-256 (`secp256r1`)
- ECDH key exchange
- AES-256-GCM for final data encryption

### Key Derivation

Both encryption methods support configurable key derivation functions:

- **PBKDF2**: 1,000,000 iterations (compatible, configurable)
- **Argon2id**: Memory-hard, time-cost and memory-cost configurable

Configurable parameters allow you to adjust security vs. performance tradeoff based on your device and needs.

### Additional Features

- **Key caching**: Decrypted keys can be cached temporarily to reduce re-entry of passwords for repeated operations
- **Passwords not stored**: Passwords are only used during encryption/decryption and immediately discarded
- **Unique salts**: Each encryption generates a fresh random salt
- **Authenticated encryption**: GCM mode provides integrity verification
- **Disk security**: Permanent mode keeps encrypted content on disk

---

## 📦 Installation

### [Community Plugins](https://obsidian.md/plugins?search=eccirian#) (Recommended)

1. Open Obsidian Settings
2. Go **Community Plugins** → **Browse**
3. Search for **Eccirian Encrypt**
4. Click **Install** → **Enable**

### Manual Installation

1. Download the latest `release.zip` from [GitHub Releases](https://github.com/Enthalpiex/eccirian-encrypt/releases)

2. Extract into:
   
   ```
   <your-vault>/.obsidian/plugins/eccirian-encrypt/
   ```

3. Reload Obsidian

4. Enable the plugin in **Settings → Community Plugins**

---

## Quick Start

### Encrypt or Decrypt One File

1. Open a note
2. Use ribbon lock icon, or `Ctrl+P` → "Encrypt/Decrypt file"
3. Enter password
4. File will be converted to `.eccirian` or `.peccirian` based on current mode

### Set Default Mode

1. Go to **Settings → Eccirian Encrypt**
2. Choose **Default Encryption Mode**

### Commands

- `Convert to Markdown`: `.peccirian` to `.md`
- `Toggle file Extension`: switch `.md` and `.eccirian`
- `Encrypt Folder`: encrypt files in a folder while preserving structure

---

## FAQ

**Q: What happens if I forget my password?**  
A: Data cannot be recovered without the password.

**Q: Can I use this with Sync?**  
A: Yes. Encrypted files can be synced like other files.

**Q: Does attachment encryption work with Permanent mode?**  
A: Yes.

**Q: Are my passwords stored anywhere?**  
A: No.

**Q: Can I encrypt folders?**  
A: Yes. Use the folder encryption command from the context menu or command palette.

**Q: How is this different from other encryption plugins like Meld Encrypt?**  
A: Main differences:
- **Attachment encryption**: This plugin encrypts linked files (images, PDFs, docs) alongside notes. Other plugins typically only encrypt note content.
- **Two persistent modes**: Permanent mode keeps files encrypted on disk and requires password each time. Temporary mode encrypts but auto-decrypts on open.
- **File type flexibility**: Works with any file format, not limited to `.md`.
- **Lock screen**: Provides a custom read-only interface for encrypted files. The password input box will not be triggered when using the mouse hover preview.
- **Encryption methods**: Supports both AES-256-GCM and optional ECC hybrid encryption.
- **Configurable KDF**: Both AES and ECC modes support PBKDF2 and Argon2id with adjustable parameters for flexible security/performance tradeoff.
- **Key caching**: Can cache decrypted keys temporarily to avoid repeated password prompts during batch operations.
- **Platform**: Currently Windows and macOS only. Meld Encrypt has broader platform support.

---

## Contributing

Issues and pull requests are welcome:
[GitHub Issues](https://github.com/Enthalpiex/eccirian-encrypt/issues)

**MPL-2.0 License** © 2026 [Entropiex](https://github.com/Enthalpiex)

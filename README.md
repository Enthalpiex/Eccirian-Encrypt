![Eccidian_RDM2](https://github.com/user-attachments/assets/9e9392c2-c123-4e01-8484-cd7a50b36d9d)

# Eccidian – Encrypted Files for Obsidian

**Eccidian** is a security-focused Obsidian encryption plugin that supports seamless encryption and decryption of files using multiple advanced password-based encryption methods. It introduces a custom `.eccidian` file extension and provides a unique read-only view for locked files, allowing you to easily manage sensitive information directly in Obsidian.

---

##  Features

- 🔁 One-click encryption and decryption of `.md` files (or any other types) into `.eccidian`, and vice versa.
- 🔒 AES and ECC based password encryption.
- 📄 Custom `eccidian-view` that shows a locked message instead of the default editor.
- 🧷 Files remain read-only until unlocked via user input.
- ⚙️ UI and control panel support.
- 📦 Modular architecture for maintainability and expansion.pansion.

---

##  Installation

### (Planned) Official Community Release

To be published to the Obsidian Community Plugin Marketplace.

You can clone the current repository to try it out first, but please do not update before the official release - the encryption logic may **change**.

---

##  Usage

1. Open any file.
2. Run the `Eccidian: Encrypt/Decrypt Note` command from the Command Palette (`Ctrl+P`) or click left icon.
3. Enter a password to encrypt or decrypt.
4. Encrypted files will be renamed to `.eccidian` and shown as locked views.
5. Click “Unlock” and enter the password to decrypt and return to edit mode.
6. Decrypted notes will automatically be renamed back to `.md` (or origional namme).

---

##  Security Notes

- Do not use it to store critical secrets. The developer is not responsible for any loss of content.
- The password you set will not be stored in any way, if you forget the password you will lose your file.

---

##  License

MPL-2.0 License © 2025 Entropiex


import { Plugin, TFile, Notice, WorkspaceLeaf } from "obsidian";
import { encryptWithPassword, decryptWithPassword } from "./encryption/aesWithPassword";
import { encryptWithPassword as eccEncrypt, decryptWithPassword as eccDecrypt } from "./encryption/eccWithPassword";
import { PasswordModal } from "./ui/passwordModal";
import { EccEncryptSettingTab } from "./ui/settingsTab";
import { DEFAULT_SETTINGS, EccEncryptSettings } from "./settings";
import { changeFileExtension } from "./utils/fileHelper";
import { EccirianView, ECCIRIAN_VIEW_TYPE } from "./view/eccirianView";

export default class EccEncryptPlugin extends Plugin {
  settings: EccEncryptSettings;
  private toggleExtensionButton: HTMLElement | null = null;

  async onload() {
    await this.loadSettings();

    this.addCommand({
      id: "toggle-encryption",
      name: "Toggle between .md and .eccirian",
      callback: async () => {
        const activeFile = this.app.workspace.getActiveFile();
        if (!activeFile) {
          if (this.settings.showNotice) {
            new Notice("Please open a file first");
          }
          return;
        }

        try {
          if (activeFile.extension === "eccirian") {
            const mdFile = await changeFileExtension(this.app.vault, activeFile, "md");
            const leaf = this.app.workspace.getLeaf();
            await leaf.openFile(mdFile);
          } else if (activeFile.extension === "md") {
            const eccFile = await changeFileExtension(this.app.vault, activeFile, "eccirian");
            const leaf = this.app.workspace.getLeaf();
            await leaf.openFile(eccFile);
          } else {
            if (this.settings.showNotice) {
              new Notice("Only .md files can be converted to .eccirian");
            }
          }
        } catch (err) {
          // 静默失败
        }
      }
    });

    this.addRibbonIcon(this.settings.iconStyle, "Encrypt/decrypt current file", async () => {
      const activeFile = this.app.workspace.getActiveFile();
      if (!activeFile) {
        if (this.settings.showNotice) {
          new Notice("Please open a file first");
        }
        return;
      }

      const fileContent = await this.app.vault.read(activeFile);
      
      new PasswordModal(
        this.app,
        async (password) => {
          try {
            if (fileContent.includes("%%ENC")) {
              if (this.settings.encryptionMethod === "AES") {
                const saltMatch = fileContent.match(/SALT:(.+)/);
                const ivMatch = fileContent.match(/IV:(.+)/);
                const dataMatch = fileContent.match(/DATA:(.+)/);

                if (saltMatch && ivMatch && dataMatch) {
                  const decrypted = await decryptWithPassword(
                    password,
                    saltMatch[1],
                    ivMatch[1],
                    dataMatch[1]
                  );
                  await this.app.vault.modify(activeFile, decrypted);
                  const mdFile = await changeFileExtension(this.app.vault, activeFile, "md");
                  if (this.settings.showNotice) {
                    new Notice("File decrypted");
                  }
                  const leaf = this.app.workspace.getLeaf();
                  await leaf.openFile(mdFile);
                } else {
                  if (this.settings.showNotice) {
                    new Notice("Decryption failed: Invalid file format");
                  }
                }
              } else {
                if (this.settings.showNotice) {
                  new Notice("ECC decryption not implemented");
                }
              }
            } else {
              if (this.settings.encryptionMethod === "AES") {
                const { salt, iv, data } = await encryptWithPassword(password, fileContent);
                const encrypted = `%%ENC\nTYPE:${this.settings.defaultEncryptionMode}\nORIGINAL_EXT:${activeFile.extension}\nSALT:${salt}\nIV:${iv}\nDATA:${data}`;
                const eccFile = await changeFileExtension(this.app.vault, activeFile, "eccirian");
                await this.app.vault.modify(eccFile, encrypted);
                if (this.settings.showNotice) {
                  new Notice("File encrypted");
                }
                const leaf = this.app.workspace.getLeaf();
                await leaf.openFile(eccFile);
              } else {
                const { salt, iv, data, publicKey } = await eccEncrypt(password, fileContent);
                const encrypted = `%%ENC\nTYPE:${this.settings.defaultEncryptionMode}\nORIGINAL_EXT:${activeFile.extension}\nSALT:${salt}\nIV:${iv}\nDATA:${data}\nPUBLIC_KEY:${publicKey}`;
                const eccFile = await changeFileExtension(this.app.vault, activeFile, "eccirian");
                await this.app.vault.modify(eccFile, encrypted);
                if (this.settings.showNotice) {
                  new Notice("File encrypted");
                }
                const leaf = this.app.workspace.getLeaf();
                await leaf.openFile(eccFile);
              }
            }
          } catch (err) {
            if (err instanceof Error && err.message.includes("密码错误")) {
              if (this.settings.showNotice) {
                new Notice("Operation failed: Password may be incorrect");
              }
            }
          }
        },
        () => {},
        this.settings.defaultEncryptionMode,
        fileContent.includes("%%ENC"),
        this.settings.requirePasswordConfirmation,
        this.settings.showHint,
        this.settings.encryptionMethod,
        this
      ).open();
    });

    // 添加文件扩展名转换按钮
    this.updateToggleExtensionButton();

    this.registerView(
      ECCIRIAN_VIEW_TYPE,
      (leaf) => {
        const view = new EccirianView(leaf);
        return view;
      }
    );

    this.registerExtensions(["eccirian"], ECCIRIAN_VIEW_TYPE);

    this.addSettingTab(new EccEncryptSettingTab(this.app, this));

    this.addCommand({
      id: "encrypt-decrypt-file",
      name: "Encrypt/Decrypt file",
      callback: async () => {
        const activeFile = this.app.workspace.getActiveFile();
        if (!activeFile) {
          if (this.settings.showNotice) {
            new Notice("Please open a file first");
          }
          return;
        }

        const fileContent = await this.app.vault.read(activeFile);
        const isEncrypted = fileContent.includes("%%ENC");

        if (isEncrypted) {
          // 解密逻辑
          const hintMatch = fileContent.match(/HINT:(.+)/);
          const hint = hintMatch ? hintMatch[1] : undefined;

          new PasswordModal(
            this.app,
            async (password) => {
              try {
                if (this.settings.encryptionMethod === "AES") {
                  const saltMatch = fileContent.match(/SALT:(.+)/);
                  const ivMatch = fileContent.match(/IV:(.+)/);
                  const dataMatch = fileContent.match(/DATA:(.+)/);

                  if (saltMatch && ivMatch && dataMatch) {
                    const decrypted = await decryptWithPassword(
                      password,
                      saltMatch[1],
                      ivMatch[1],
                      dataMatch[1]
                    );
                    await this.app.vault.modify(activeFile, decrypted);
                    const mdFile = await changeFileExtension(this.app.vault, activeFile, "md");
                    if (this.settings.showNotice) {
                      new Notice("File decrypted");
                    }
                    const leaf = this.app.workspace.getLeaf();
                    await leaf.openFile(mdFile);
                  } else {
                    if (this.settings.showNotice) {
                      new Notice("Decryption failed: Invalid file format");
                    }
                  }
                } else {
                  if (this.settings.showNotice) {
                    new Notice("ECC decryption not implemented");
                  }
                }
              } catch (err) {
                if (err instanceof Error && err.message.includes("密码错误")) {
                  if (this.settings.showNotice) {
                    new Notice("Operation failed: Password may be incorrect");
                  }
                }
              }
            },
            () => {},
            this.settings.defaultEncryptionMode,
            true,
            this.settings.requirePasswordConfirmation,
            this.settings.showHint,
            this.settings.encryptionMethod,
            this
          ).open();

          if (hint && this.settings.showNotice) {
            new Notice(`Password Hint: ${hint}`);
          }
        } else {
          // 加密逻辑
          new PasswordModal(
            this.app,
            async (password, encryptionMethod, hint) => {
              try {
                if (encryptionMethod === "AES") {
                  const { salt, iv, data } = await encryptWithPassword(password, fileContent);
                  const encrypted = `%%ENC\nTYPE:${this.settings.defaultEncryptionMode}\nORIGINAL_EXT:${activeFile.extension}\nSALT:${salt}\nIV:${iv}\nDATA:${data}${hint ? `\nHINT:${hint}` : ''}`;
                  const eccFile = await changeFileExtension(this.app.vault, activeFile, "eccirian");
                  await this.app.vault.modify(eccFile, encrypted);
                  if (this.settings.showNotice) {
                    new Notice("File encrypted");
                  }
                  const leaf = this.app.workspace.getLeaf();
                  await leaf.openFile(eccFile);
                } else {
                  const { salt, iv, data, publicKey } = await eccEncrypt(password, fileContent);
                  const encrypted = `%%ENC\nTYPE:${this.settings.defaultEncryptionMode}\nORIGINAL_EXT:${activeFile.extension}\nSALT:${salt}\nIV:${iv}\nDATA:${data}\nPUBLIC_KEY:${publicKey}${hint ? `\nHINT:${hint}` : ''}`;
                  const eccFile = await changeFileExtension(this.app.vault, activeFile, "eccirian");
                  await this.app.vault.modify(eccFile, encrypted);
                  if (this.settings.showNotice) {
                    new Notice("File encrypted");
                  }
                  const leaf = this.app.workspace.getLeaf();
                  await leaf.openFile(eccFile);
                }
              } catch (err) {
                if (err instanceof Error && err.message.includes("密码错误")) {
                  if (this.settings.showNotice) {
                    new Notice("Operation failed: Password may be incorrect");
                  }
                }
              }
            },
            () => {},
            this.settings.defaultEncryptionMode,
            false,
            this.settings.requirePasswordConfirmation,
            this.settings.showHint,
            this.settings.encryptionMethod,
            this
          ).open();
        }
      }
    });
  }

  private updateToggleExtensionButton() {
    if (this.toggleExtensionButton) {
      this.toggleExtensionButton.remove();
      this.toggleExtensionButton = null;
    }

    if (this.settings.showToggleExtensionButton) {
      this.toggleExtensionButton = this.addRibbonIcon("file-text", "Toggle File Extension", async () => {
        const activeFile = this.app.workspace.getActiveFile();
        if (!activeFile) {
          return;
        }

        try {
          if (activeFile.extension === "eccirian") {
            const mdFile = await changeFileExtension(this.app.vault, activeFile, "md");
            const leaf = this.app.workspace.getLeaf();
            await leaf.openFile(mdFile);
          } else if (activeFile.extension === "md") {
            const eccFile = await changeFileExtension(this.app.vault, activeFile, "eccirian");
            const leaf = this.app.workspace.getLeaf();
            await leaf.openFile(eccFile);
          } else {
            new Notice("Only .md files can be converted to .eccirian");
          }
        } catch (err) {
          // 静默失败
        }
      });
    }
  }

  async onunload() {
    if (this.toggleExtensionButton) {
      this.toggleExtensionButton.remove();
      this.toggleExtensionButton = null;
    }
  }

  async switchToMarkdownView(file: TFile) {
    this.app.workspace.detachLeavesOfType(ECCIRIAN_VIEW_TYPE);
    const leaf = this.app.workspace.getLeaf();
    await leaf.openFile(file, { state: { mode: "source" } });
  }

  async loadSettings() {
    this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
  }

  async saveSettings() {
    await this.saveData(this.settings);
  }
}

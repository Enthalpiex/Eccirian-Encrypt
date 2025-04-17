import { Plugin, TFile, Notice, WorkspaceLeaf } from "obsidian";
import { encryptWithPassword, decryptWithPassword } from "./encryption/aesWithPassword";
import { encryptWithPassword as eccEncrypt, decryptWithPassword as eccDecrypt } from "./encryption/eccWithPassword";
import { PasswordModal } from "./ui/passwordModal";
import { EccEncryptSettingTab } from "./ui/settingsTab";
import { DEFAULT_SETTINGS, EccEncryptSettings } from "./settings";
import { changeFileExtension } from "./utils/fileHelper";
import { EccidianView, ECCIDIAN_VIEW_TYPE } from "./view/eccidianView";

export default class EccEncryptPlugin extends Plugin {
  settings: EccEncryptSettings;
  private toggleExtensionButton: HTMLElement | null = null;

  async onload() {
    await this.loadSettings();

    this.addCommand({
      id: "encrypt-decrypt",
      name: "Eccidian: Toggle between .md and .eccidian",
      callback: async () => {
        const activeFile = this.app.workspace.getActiveFile();
        if (!activeFile) {
          new Notice("Please open a file first");
          return;
        }

        try {
          if (activeFile.extension === "eccidian") {
            const mdFile = await changeFileExtension(this.app.vault, activeFile, "md");
            const leaf = this.app.workspace.getLeaf();
            await leaf.openFile(mdFile);
          } else if (activeFile.extension === "md") {
            const eccFile = await changeFileExtension(this.app.vault, activeFile, "eccidian");
            const leaf = this.app.workspace.getLeaf();
            await leaf.openFile(eccFile);
          } else {
            new Notice("Only .md files can be converted to .eccidian");
          }
        } catch (err) {
          // 静默失败
        }
      }
    });

    this.addRibbonIcon(this.settings.iconStyle, "Encrypt/Decrypt Current File", async () => {
      const activeFile = this.app.workspace.getActiveFile();
      if (!activeFile) {
        new Notice("Please open a file first");
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
                  new Notice("File decrypted");
                  const leaf = this.app.workspace.getLeaf();
                  await leaf.openFile(mdFile);
                } else {
                  new Notice("Decryption failed: Invalid file format");
                }
              } else {
                new Notice("ECC decryption not implemented");
              }
            } else {
              if (this.settings.encryptionMethod === "AES") {
                const { salt, iv, data } = await encryptWithPassword(password, fileContent);
                const encrypted = `%%ENC\nTYPE:${this.settings.defaultEncryptionMode}\nORIGINAL_EXT:${activeFile.extension}\nSALT:${salt}\nIV:${iv}\nDATA:${data}`;
                const eccFile = await changeFileExtension(this.app.vault, activeFile, "eccidian");
                await this.app.vault.modify(eccFile, encrypted);
                if (this.settings.showNotice) {
                  new Notice("File encrypted");
                }
                const leaf = this.app.workspace.getLeaf();
                await leaf.openFile(eccFile);
              } else {
                const { salt, iv, data, publicKey } = await eccEncrypt(password, fileContent);
                const encrypted = `%%ENC\nTYPE:${this.settings.defaultEncryptionMode}\nORIGINAL_EXT:${activeFile.extension}\nSALT:${salt}\nIV:${iv}\nDATA:${data}\nPUBLIC_KEY:${publicKey}`;
                const eccFile = await changeFileExtension(this.app.vault, activeFile, "eccidian");
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
              new Notice("Operation failed: Password may be incorrect");
            }
          }
        },
        () => {},
        this.settings.defaultEncryptionMode,
        fileContent.includes("%%ENC"),
        this.settings.requirePasswordConfirmation,
        this.settings.showHint
      ).open();
    });

    // 添加文件扩展名转换按钮
    this.updateToggleExtensionButton();

    this.registerView(
      ECCIDIAN_VIEW_TYPE,
      (leaf) => {
        const view = new EccidianView(leaf);
        return view;
      }
    );

    this.registerExtensions(["eccidian"], ECCIDIAN_VIEW_TYPE);

    this.registerEvent(
      this.app.workspace.on("file-open", async (file) => {
        if (file && file instanceof TFile && file.extension === "eccidian") {
          let leaf: WorkspaceLeaf;
          const activeLeaf = this.app.workspace.getActiveViewOfType(EccidianView)?.leaf;
          
          if (activeLeaf) {
            leaf = activeLeaf;
          } else {
            leaf = this.app.workspace.getLeaf();
          }

          if (leaf.view.getViewType() !== ECCIDIAN_VIEW_TYPE) {
            await leaf.setViewState({
              type: ECCIDIAN_VIEW_TYPE,
              active: true
            });
          }

          const view = leaf.view as EccidianView;
          const currentFile = this.app.vault.getAbstractFileByPath(file.path);
          if (currentFile instanceof TFile) {
            await view.setState({ 
              file: currentFile
            }, { history: true });
          }
        }
      })
    );

    this.addSettingTab(new EccEncryptSettingTab(this.app, this));

    this.registerDomEvent(document, "DOMContentLoaded", () => {
      this.loadStyles();
    });

    this.addCommand({
      id: "encrypt-decrypt-file",
      name: "Encrypt/Decrypt file",
      callback: async () => {
        const activeFile = this.app.workspace.getActiveFile();
        if (!activeFile) {
          new Notice("Please open a file first");
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
                    new Notice("Decryption failed: Invalid file format");
                  }
                } else {
                  new Notice("ECC decryption not implemented");
                }
              } catch (err) {
                if (err instanceof Error && err.message.includes("密码错误")) {
                  new Notice("Operation failed: Password may be incorrect");
                }
              }
            },
            () => {},
            this.settings.defaultEncryptionMode,
            true,
            this.settings.requirePasswordConfirmation,
            this.settings.showHint
          ).open();

          if (hint) {
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
                  const eccFile = await changeFileExtension(this.app.vault, activeFile, "eccidian");
                  await this.app.vault.modify(eccFile, encrypted);
                  if (this.settings.showNotice) {
                    new Notice("File encrypted");
                  }
                  const leaf = this.app.workspace.getLeaf();
                  await leaf.openFile(eccFile);
                } else {
                  const { salt, iv, data, publicKey } = await eccEncrypt(password, fileContent);
                  const encrypted = `%%ENC\nTYPE:${this.settings.defaultEncryptionMode}\nORIGINAL_EXT:${activeFile.extension}\nSALT:${salt}\nIV:${iv}\nDATA:${data}\nPUBLIC_KEY:${publicKey}${hint ? `\nHINT:${hint}` : ''}`;
                  const eccFile = await changeFileExtension(this.app.vault, activeFile, "eccidian");
                  await this.app.vault.modify(eccFile, encrypted);
                  if (this.settings.showNotice) {
                    new Notice("File encrypted");
                  }
                  const leaf = this.app.workspace.getLeaf();
                  await leaf.openFile(eccFile);
                }
              } catch (err) {
                if (err instanceof Error && err.message.includes("密码错误")) {
                  new Notice("Operation failed: Password may be incorrect");
                }
              }
            },
            () => {},
            this.settings.defaultEncryptionMode,
            false,
            this.settings.requirePasswordConfirmation,
            this.settings.showHint,
            this.settings.encryptionMethod
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
          if (activeFile.extension === "eccidian") {
            const mdFile = await changeFileExtension(this.app.vault, activeFile, "md");
            const leaf = this.app.workspace.getLeaf();
            await leaf.openFile(mdFile);
          } else if (activeFile.extension === "md") {
            const eccFile = await changeFileExtension(this.app.vault, activeFile, "eccidian");
            const leaf = this.app.workspace.getLeaf();
            await leaf.openFile(eccFile);
          } else {
            new Notice("Only .md files can be converted to .eccidian");
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
    this.app.workspace.detachLeavesOfType(ECCIDIAN_VIEW_TYPE);
    const leaf = this.app.workspace.getLeaf();
    await leaf.openFile(file, { state: { mode: "source" } });
  }

  async loadSettings() {
    this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
  }

  async saveSettings() {
    await this.saveData(this.settings);
  }

  loadStyles() {
    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.type = "text/css";
    link.href = this.app.vault.adapter.getResourcePath(`${this.manifest.dir}/styles.css`);
    document.head.appendChild(link);
  }
}

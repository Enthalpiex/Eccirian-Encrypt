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

  async onload() {
    await this.loadSettings();

    this.addCommand({
      id: "encrypt-decrypt",
      name: "Eccidian: Encrypt/Decrypt",
      callback: async () => {
        const activeFile = this.app.workspace.getActiveFile();
        if (!activeFile) {
          new Notice("Please open a file first");
          return;
        }

        const fileContent = await this.app.vault.read(activeFile);
        
        new PasswordModal(
          this.app,
          async (password, encryptionMethod) => {
            try {
              if (fileContent.includes("%%ENC")) {
                if (encryptionMethod === "AES") {
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
                  const saltMatch = fileContent.match(/SALT:(.+)/);
                  const ivMatch = fileContent.match(/IV:(.+)/);
                  const dataMatch = fileContent.match(/DATA:(.+)/);
                  const publicKeyMatch = fileContent.match(/PUBLIC_KEY:(.+)/);

                  if (saltMatch && ivMatch && dataMatch && publicKeyMatch) {
                    const decrypted = await eccDecrypt(
                      password,
                      saltMatch[1],
                      ivMatch[1],
                      dataMatch[1],
                      publicKeyMatch[1]
                    );
                    await this.app.vault.modify(activeFile, decrypted);
                    const mdFile = await changeFileExtension(this.app.vault, activeFile, "md");
                    new Notice("File decrypted");
                    const leaf = this.app.workspace.getLeaf();
                    await leaf.openFile(mdFile);
                  } else {
                    new Notice("Decryption failed: Invalid file format");
                  }
                }
              } else {
                if (encryptionMethod === "AES") {
                  const { salt, iv, data } = await encryptWithPassword(password, fileContent);
                  const encrypted = `%%ENC\nSALT:${salt}\nIV:${iv}\nDATA:${data}`;
                  await this.app.vault.modify(activeFile, encrypted);
                  const eccFile = await changeFileExtension(this.app.vault, activeFile, "eccidian");
                  new Notice("File encrypted");
                  const leaf = this.app.workspace.getLeaf();
                  await leaf.openFile(eccFile);
                } else {
                  const { salt, iv, data, publicKey } = await eccEncrypt(password, fileContent);
                  const encrypted = `%%ENC\nSALT:${salt}\nIV:${iv}\nDATA:${data}\nPUBLIC_KEY:${publicKey}`;
                  await this.app.vault.modify(activeFile, encrypted);
                  const eccFile = await changeFileExtension(this.app.vault, activeFile, "eccidian");
                  new Notice("File encrypted");
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
          this.settings.requirePasswordConfirmation
        ).open();
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
                const encrypted = `%%ENC\nSALT:${salt}\nIV:${iv}\nDATA:${data}`;
                await this.app.vault.modify(activeFile, encrypted);
                const eccFile = await changeFileExtension(this.app.vault, activeFile, "eccidian");
                new Notice("File encrypted");
                const leaf = this.app.workspace.getLeaf();
                await leaf.openFile(eccFile);
              } else {
                new Notice("ECC encryption not implemented");
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
        fileContent.includes("%%ENC")
      ).open();
    });

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

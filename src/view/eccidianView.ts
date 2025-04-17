import { FileView, WorkspaceLeaf, ViewStateResult, App } from "obsidian";
import { PasswordModal } from "../ui/passwordModal";
import { TFile, Notice } from "obsidian";
import { decryptWithPassword } from "../encryption/aesWithPassword";
import EccEncryptPlugin from "../main";
import { changeFileExtension } from "../utils/fileHelper";

export const ECCIDIAN_VIEW_TYPE = "eccidian-view";

export class EccidianView extends FileView {
  filePath: string;
  private loadingFile: boolean = false;
  private displayName: string = "Encrypted Note";
  private plugin: EccEncryptPlugin;

  constructor(leaf: WorkspaceLeaf) {
    super(leaf);
    this.filePath = "";
    this.navigation = true;
    this.plugin = (this.app as any).plugins.getPlugin('eccidian');
  }

  updateTitle(newTitle: string) {
    this.displayName = newTitle;
  }

  getViewType(): string {
    return ECCIDIAN_VIEW_TYPE;
  }

  getDisplayText(): string {
    return this.displayName;
  }

  getIcon(): string {
    return "lock";
  }

  async setState(state: any, result: ViewStateResult): Promise<void> {
    await super.setState(state, result);

    if (state?.file instanceof TFile) {
      this.file = state.file;
      this.filePath = state.file.path;
      this.updateTitle(state.file.basename);
    }

    await this.onOpen();
  }

  getState(): any {
    return {
      file: this.file,
      filePath: this.filePath,
      displayName: this.displayName
    };
  }

  async onOpen() {
    const container = this.containerEl.children[1];
    container.empty();

    const iconMap = {
      lock: "🔒",
      shield: "🛡️",
      key: "🔑",
      padlock: "🔐"
    };

    const icon = iconMap[this.plugin.settings.iconStyle] || "🔒";

    const html = `
      <div class="eccidian-lock-view" style="
        height: 100%;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        text-align: center;
        padding: 2rem;
        max-width: 600px;
        margin: 0 auto;
      ">
        <div class="eccidian-lock-icon" style="
          font-size: 64px;
          margin-bottom: 1.5rem;
          opacity: 0.8;
          transition: transform 0.3s ease;
        ">${icon}</div>
        <p style="
          margin-bottom: 2rem;
          font-size: 1.1rem;
          color: var(--text-muted);
          line-height: 1.5;
        ">${this.file ? `"${this.file.basename}" is encrypted. Click below to unlock.` : "This file is encrypted. Click below to unlock."}</p>
        <button class="eccidian-unlock-button" style="
          padding: 0.75rem 1.5rem;
          font-size: 1rem;
          cursor: pointer;
          border-radius: 6px;
          border: 1px solid var(--background-modifier-border);
          background-color: var(--background-primary);
          color: var(--text-normal);
          transition: all 0.2s ease;
          box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        ">Unlock</button>
      </div>
    `;

    container.innerHTML = html;

    const unlockBtn = container.querySelector('.eccidian-unlock-button') as HTMLElement;
    const lockIcon = container.querySelector('.eccidian-lock-icon') as HTMLElement;

    if (unlockBtn && lockIcon) {
      unlockBtn.addEventListener('mouseenter', () => {
        unlockBtn.style.backgroundColor = "var(--background-secondary)";
        unlockBtn.style.transform = "translateY(-1px)";
        lockIcon.style.transform = "scale(1.1)";
      });

      unlockBtn.addEventListener('mouseleave', () => {
        unlockBtn.style.backgroundColor = "var(--background-primary)";
        unlockBtn.style.transform = "translateY(0)";
        lockIcon.style.transform = "scale(1)";
      });

      unlockBtn.addEventListener('click', async () => {
        if (this.filePath) {
          const file = this.app.vault.getAbstractFileByPath(this.filePath);
          if (file instanceof TFile) {
            this.file = file;
          }
        }

        if (!this.file) {
          new Notice("File does not exist");
          return;
        }

        let mdFile: TFile;
        try {
          mdFile = await changeFileExtension(this.app.vault, this.file, "md");
          const content = await this.app.vault.read(mdFile);
          
          if (!content.includes("%%ENC")) {
            new Notice("This is not an encrypted file, restored as normal file");
            const leaf = this.app.workspace.getLeaf();
            await leaf.openFile(mdFile, { state: { mode: "source" } });
            return;
          }

          const saltMatch = content.match(/SALT:(.+)/);
          const ivMatch = content.match(/IV:(.+)/);
          const dataMatch = content.match(/DATA:(.+)/);
          const typeMatch = content.match(/TYPE:(.+)/);
          const originalExtMatch = content.match(/ORIGINAL_EXT:(.+)/);

          if (!saltMatch || !ivMatch || !dataMatch || !typeMatch || !originalExtMatch) {
            await changeFileExtension(this.app.vault, mdFile, "eccidian");
            new Notice("Decryption failed: Invalid file format");
            return;
          }

          const encryptionType = typeMatch[1];
          const originalExt = originalExtMatch[1];
          this.plugin.settings.defaultEncryptionMode = encryptionType as "temporary" | "permanent";
          await this.plugin.saveSettings();

          new PasswordModal(
            this.app, 
            async (password) => {
              try {
                let decrypted: string;
                try {
                  decrypted = await decryptWithPassword(
                    password,
                    saltMatch[1],
                    ivMatch[1],
                    dataMatch[1]
                  );
                } catch (err) {
                  await changeFileExtension(this.app.vault, mdFile, "eccidian");
                  new Notice("Decryption failed: Password may be incorrect");
                  return;
                }

                try {
                  await this.app.vault.modify(mdFile, decrypted);
                  new Notice("File decrypted");

                  const leaf = this.app.workspace.getLeaf();
                  const originalFile = await changeFileExtension(this.app.vault, mdFile, originalExt);
                  await leaf.openFile(originalFile, { state: { mode: "source" } });
                } catch (err) {
                  const leaf = this.app.workspace.getLeaf();
                  await leaf.openFile(mdFile, { state: { mode: "source" } });
                  return;
                }

              } catch (err) {
                await changeFileExtension(this.app.vault, mdFile, "eccidian");
                new Notice("Decryption failed: Unexpected error");
                return;
              }
            },
            async () => {
              try {
                await changeFileExtension(this.app.vault, mdFile, "eccidian");
              } catch (err) {
                new Notice("Failed to restore file extension");
              }
            },
            "temporary",
            true
          ).open();
        } catch (err) {
          new Notice("Failed to change file extension");
        }
      });
    }
  }

  async onClose() {
    await super.onClose();
  }
}

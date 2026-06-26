import { FileView, WorkspaceLeaf, ViewStateResult } from "obsidian";
import { PasswordModal } from "../ui/passwordModal";
import { TFile, Notice } from "obsidian";
import { decryptWithPassword } from "../encryption/aesWithPassword";
import EccEncryptPlugin from "../main";
import { changeFileExtension } from "../utils/fileHelper";

export const ECCIRIAN_VIEW_TYPE = "eccirian-view";

export class EccirianView extends FileView {
  filePath: string;
  private loadingFile: boolean = false;
  private displayName: string = "Encrypted note";
  private plugin: EccEncryptPlugin;

  constructor(leaf: WorkspaceLeaf) {
    super(leaf);
    this.filePath = "";
    this.navigation = true;
    this.plugin = (this.app as any).plugins.getPlugin('eccirian-encrypt');
  }

  updateTitle(newTitle: string) {
    this.displayName = newTitle;
  }

  getViewType(): string {
    return ECCIRIAN_VIEW_TYPE;
  }

  getDisplayText(): string {
    return this.displayName;
  }

  getIcon(): string {
    return "lock";
  }

  async setState(state: Record<string, any>, result: ViewStateResult): Promise<void> {
    await super.setState(state, result);

    if (state?.file instanceof TFile) {
      this.file = state.file;
      this.filePath = state.file.path;
      this.updateTitle(state.file.basename);
    }

    await this.onOpen();
  }

  getState(): Record<string, any> {
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

    // 创建主容器
    const lockView = container.createDiv({ cls: 'eccirian-lock-view' });

    // 创建锁图标
    const lockIcon = lockView.createDiv({ cls: 'eccirian-lock-icon' });
    lockIcon.setText(icon);

    // 创建消息文本
    const message = lockView.createEl('p', { cls: 'eccirian-message' });
    message.setText(this.file
      ? `"${this.file.basename}" is encrypted. Click below to unlock.`
      : "This file is encrypted. Click below to unlock.");
      
    // 创建解锁按钮
    const unlockBtn = lockView.createEl('button', { cls: 'eccirian-unlock-button' });
    unlockBtn.setText('Unlock');

    // 添加按钮悬停效果
    unlockBtn.addEventListener('mouseenter', () => {
      unlockBtn.addClass('hover');
      lockIcon.addClass('hover');
    });

    unlockBtn.addEventListener('mouseleave', () => {
      unlockBtn.removeClass('hover');
      lockIcon.removeClass('hover');
    });

    // 添加点击事件
    unlockBtn.addEventListener('click', () => {
      (async () => {
      if (this.filePath) {
        const file = this.app.vault.getAbstractFileByPath(this.filePath);
        if (file instanceof TFile) {
          this.file = file;
        }
      }

      if (!this.file) {
        if (this.plugin.settings.showNotice) {
          new Notice("File does not exist");
        }
        return;
      }

      let mdFile: TFile;
      try {
        mdFile = await changeFileExtension(this.app.vault, this.file, "md");
        const content = await this.app.vault.read(mdFile);
        
        if (!content.includes("%%ENC")) {
          if (this.plugin.settings.showNotice) {
            new Notice("This is not an encrypted file, restored as normal file");
          }
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
          await changeFileExtension(this.app.vault, mdFile, "eccirian");
          if (this.plugin.settings.showNotice) {
            new Notice("Decryption failed: Invalid file format");
          }
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
              } catch {
                await changeFileExtension(this.app.vault, mdFile, "eccirian");
                if (this.plugin.settings.showNotice) {
                  new Notice("Decryption failed: Password may be incorrect");
                }
                return;
              }

              try {
                await this.app.vault.modify(mdFile, decrypted);
                if (this.plugin.settings.showNotice) {
                  new Notice("File decrypted");
                }

                const leaf = this.app.workspace.getLeaf();
                const originalFile = await changeFileExtension(this.app.vault, mdFile, originalExt);
                await leaf.openFile(originalFile, { state: { mode: "source" } });
              } catch {
                const leaf = this.app.workspace.getLeaf();
                await leaf.openFile(mdFile, { state: { mode: "source" } });
                return;
              }

            } catch {
              await changeFileExtension(this.app.vault, mdFile, "eccirian");
              if (this.plugin.settings.showNotice) {
                new Notice("Decryption failed: Unexpected error");
              }
              return;
            }
          },
          async () => {
            try {
              await changeFileExtension(this.app.vault, mdFile, "eccirian");
            } catch {
              if (this.plugin.settings.showNotice) {
                new Notice("Failed to restore file extension");
              }
            }
          },
          this.plugin.settings.defaultEncryptionMode,
          true,
          this.plugin.settings.requirePasswordConfirmation,
          this.plugin.settings.showHint,
          this.plugin.settings.encryptionMethod,
          this.plugin
        ).open();
      } catch {
        if (this.plugin.settings.showNotice) {
          new Notice("Failed to change file extension");
        }
      }
      })();
    });
  }

  async onClose() {
    await super.onClose();
  }
}

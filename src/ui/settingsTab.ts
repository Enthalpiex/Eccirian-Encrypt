import { App, PluginSettingTab, Setting, Modal, Notice } from "obsidian";
import EccEncryptPlugin from "../main";
import { changeFileExtension } from "../utils/fileHelper";

class ConfirmModal extends Modal {
  constructor(app: App) {
    super(app);
  }

  onOpen() {
    const { contentEl } = this;
    contentEl.createEl("h3", { text: "Visit GitHub Repository?" });
    contentEl.createEl("p", { text: "Do you want to visit the GitHub repository?" });

    new Setting(contentEl)
      .addButton(button => {
        button
          .setButtonText("Cancel")
          .onClick(() => {
            this.close();
          });
      })
      .addButton(button => {
        button
          .setButtonText("Confirm")
          .setCta()
          .onClick(() => {
            window.open('https://github.com/Enthalpiex/Eccidian-Encrypt/tree/0.1.0', '_blank');
            this.close();
          });
      });
  }

  onClose() {
    const { contentEl } = this;
    contentEl.empty();
  }
}

export class EccEncryptSettingTab extends PluginSettingTab {
  plugin: EccEncryptPlugin;

  constructor(app: App, plugin: EccEncryptPlugin) {
    super(app, plugin);
    this.plugin = plugin;
  }

  display(): void {
    const { containerEl } = this;
    containerEl.empty();

    // Add logo container
    const logoContainer = containerEl.createDiv({ cls: 'eccidian-logo-container' });

    // Add logo image
    const logo = logoContainer.createEl('img', {
      attr: {
        alt: 'Eccidian Logo'
      },
      cls: 'eccidian-logo'
    });

    // Add click event
    logoContainer.addEventListener('click', () => {
      new ConfirmModal(this.app).open();
    });

    containerEl.createEl("h2", { text: "Eccidian Setting" });

    new Setting(containerEl)
      .setName("Default Encryption Method | 默认加密算法")
      .setDesc("Choose a method to use to encrypt the note content| 选择使用哪种方式加密笔记内容")
      .addDropdown(drop =>
        drop
          .addOption("AES", "AES-256（对称加密）")
          .addOption("ECC", "ECC+AES（非对称加密）")
          .setValue(this.plugin.settings.encryptionMethod)
          .onChange(async (value: "AES" | "ECC") => {
            this.plugin.settings.encryptionMethod = value;
            await this.plugin.saveSettings();
          })
      );

    new Setting(containerEl)
      .setName("Default Encryption Mode | 默认加密模式")
      .setDesc("Choose the default encryption mode | 选择默认加密模式")
      .addDropdown(drop =>
        drop
          .addOption("temporary", "Temporary (Single Use) | 临时（单次使用）")
          .addOption("permanent", "Permanent (Not Implemented) | 永久（未实现）")
          .setValue(this.plugin.settings.defaultEncryptionMode)
          .onChange(async (value: "temporary" | "permanent") => {
            this.plugin.settings.defaultEncryptionMode = value;
            await this.plugin.saveSettings();
          })
      );

    new Setting(containerEl)
      .setName("Icon Style | 图标样式")
      .setDesc("Choose the icon style for the lock page | 选择锁定页面图标样式")
      .addDropdown(drop =>
        drop
          .addOption("lock", "🔒 Lock | 锁")
          .addOption("shield", "🛡️ Shield | 盾牌")
          .addOption("key", "🔑 Key | 钥匙")
          .addOption("padlock", "🔐 Padlock | 挂锁")
          .setValue(this.plugin.settings.iconStyle)
          .onChange(async (value: "lock" | "shield" | "key" | "padlock") => {
            this.plugin.settings.iconStyle = value;
            await this.plugin.saveSettings();
          })
      );

    new Setting(containerEl)
      .setName("Require Password Confirmation | 需要密码确认")
      .setDesc("When enabled, requires entering password twice when encrypting | 启用后，加密时需要输入两次密码")
      .addToggle(toggle =>
        toggle
          .setValue(this.plugin.settings.requirePasswordConfirmation)
          .onChange(async (value) => {
            this.plugin.settings.requirePasswordConfirmation = value;
            await this.plugin.saveSettings();
          })
      );

    new Setting(containerEl)
      .setName("Show Toggle Extension Button | 显示扩展名转换按钮")
      .setDesc("Show the button to toggle between .md and .eccidian extensions | 显示在 .md 和 .eccidian 扩展名之间切换的按钮")
      .addToggle(toggle =>
        toggle
          .setValue(this.plugin.settings.showToggleExtensionButton)
          .onChange(async (value) => {
            this.plugin.settings.showToggleExtensionButton = value;
            await this.plugin.saveSettings();
            (this.plugin as any).updateToggleExtensionButton();
          })
      );

    new Setting(containerEl)
      .setName("Show Notices | 显示通知")
      .setDesc("Show notification messages when encrypting/decrypting files | 加密/解密文件时显示通知消息")
      .addToggle(toggle =>
        toggle
          .setValue(this.plugin.settings.showNotice)
          .onChange(async (value) => {
            this.plugin.settings.showNotice = value;
            await this.plugin.saveSettings();
          })
      );

    new Setting(containerEl)
      .setName("Show Password Hint | 显示密码提示")
      .setDesc("Allow adding a hint when encrypting files | 允许在加密文件时添加密码提示")
      .addToggle(toggle =>
        toggle
          .setValue(this.plugin.settings.showHint)
          .onChange(async (value) => {
            this.plugin.settings.showHint = value;
            await this.plugin.saveSettings();
          })
      );
  }
}

import { App, PluginSettingTab, Setting } from "obsidian";
import EccEncryptPlugin from "../main";

export class EccEncryptSettingTab extends PluginSettingTab {
  plugin: EccEncryptPlugin;

  constructor(app: App, plugin: EccEncryptPlugin) {
    super(app, plugin);
    this.plugin = plugin;
  }

  display(): void {
    const { containerEl } = this;
    containerEl.empty();

    containerEl.createEl("h2", { text: "Eccidion Setting" });

    new Setting(containerEl)
      .setName("Encryption | 加密方式")
      .setDesc("Choose a method to use to encrypt the note content| 选择使用哪种方式加密笔记内容")
      .addDropdown(drop =>
        drop
          .addOption("AES", "AES-256（对称加密）")
          .addOption("ECC", "ECC（非对称加密）")
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
      .setDesc("Choose the icon style for the sidebar | 选择侧边栏图标样式")
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
  }
}

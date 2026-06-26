import { App, Modal, Setting, Notice, moment } from "obsidian";
import type EccEncryptPlugin from "../main";
import { t } from "../i18n";

export class PasswordModal extends Modal {
  password: string = "";
  confirmPassword: string = "";
  hint: string = "";
  onSuccess: (password: string, encryptionMethod: "AES" | "ECC", hint?: string, encryptionMode?: "temporary" | "permanent") => void;
  onCancel: () => void;
  encryptionMode: "temporary" | "permanent" = "temporary";
  encryptionMethod: "AES" | "ECC" = "AES";
  private isSubmitted: boolean = false;
  private isDecrypt: boolean = false;
  private requirePasswordConfirmation: boolean = false;
  private showHint: boolean = false;
  private showModeSelection: boolean = true;
  private existingHint?: string;
  private plugin: EccEncryptPlugin;
  private locale: string;

  constructor(
    app: App,
    onSuccess: (password: string, encryptionMethod: "AES" | "ECC", hint?: string, encryptionMode?: "temporary" | "permanent") => void,
    onCancel: () => void,
    defaultMode: "temporary" | "permanent" = "temporary",
    isDecrypt: boolean = false,
    requirePasswordConfirmation: boolean = false,
    showHint: boolean = false,
    defaultEncryptionMethod: "AES" | "ECC" = "AES",
    plugin: EccEncryptPlugin,
    showModeSelection: boolean = true,
    existingHint?: string
  ) {
    super(app);
    this.onSuccess = onSuccess;
    this.onCancel = onCancel;
    this.encryptionMode = defaultMode;
    this.isDecrypt = isDecrypt;
    this.requirePasswordConfirmation = requirePasswordConfirmation;
    this.showHint = showHint;
    this.encryptionMethod = defaultEncryptionMethod;
    this.plugin = plugin;
    this.showModeSelection = showModeSelection;
    this.existingHint = existingHint;
    this.locale = moment.locale();
  }

  onOpen() {
    const { contentEl } = this;
    contentEl.empty();
    this.titleEl.setText(t('modalPasswordTitle', this.locale));

    // Show existing hint when decrypting
    if (this.isDecrypt && this.existingHint) {
      const hintContainer = contentEl.createDiv({ cls: "setting-item" });
      const hintInfo = hintContainer.createDiv({ cls: "setting-item-info" });
      hintInfo.createDiv({ cls: "setting-item-name", text: t('modalPasswordHintLabel', this.locale) });
      const hintControl = hintContainer.createDiv({ cls: "setting-item-control" });
      hintControl.createEl("code", { 
        text: this.existingHint,
        cls: "eccirian-hint-code"
      });
    }

    if (!this.isDecrypt) {
      new Setting(contentEl)
        .setName(t('modalEncryptionMethod', this.locale))
        .setDesc(t('modalEncryptionMethodDesc', this.locale))
        .addDropdown(drop =>
          drop
            .addOption("AES", t('encryptionMethodAES', this.locale))
            .addOption("ECC", t('encryptionMethodECC', this.locale))
            .setValue(this.encryptionMethod)
            .onChange(value => {
              this.encryptionMethod = value as "AES" | "ECC";
            })
        );

      // Only show mode selection if enabled (hidden for folder encryption)
      if (this.showModeSelection) {
        new Setting(contentEl)
          .setName(t('modalEncryptionMode', this.locale))
          .setDesc(t('modalEncryptionModeDesc', this.locale))
          .addDropdown(drop =>
            drop
              .addOption("temporary", t('encryptionModeTemporary', this.locale))
              .addOption("permanent", t('encryptionModePermanent', this.locale))
              .setValue(this.encryptionMode)
              .onChange(value => {
                this.encryptionMode = value as "temporary" | "permanent";
              })
          );
      }
    }

    new Setting(contentEl)
      .setName(t('modalPassword', this.locale))
      .addText(text => {
        text
          .setPlaceholder(t('modalPasswordPlaceholder', this.locale))
          .setValue(this.password)
          .onChange(value => {
            this.password = value;
          });
        text.inputEl.type = "password";
        text.inputEl.addEventListener('keypress', (e) => {
          if (e.key === 'Enter' && this.password) {
            if (!this.requirePasswordConfirmation || this.confirmPassword) {
              void this.submit();
            }
          }
        });
      });

    if (!this.isDecrypt && this.requirePasswordConfirmation) {
      new Setting(contentEl)
        .setName(t('modalConfirmPassword', this.locale))
        .addText(text => {
          text
            .setPlaceholder(t('modalConfirmPasswordPlaceholder', this.locale))
            .setValue(this.confirmPassword)
            .onChange(value => {
              this.confirmPassword = value;
            });
          text.inputEl.type = "password";
          text.inputEl.addEventListener('keypress', (e) => {
            if (e.key === 'Enter' && this.password && this.confirmPassword) {
              void this.submit();
            }
          });
        });
    }

    if (!this.isDecrypt && this.showHint) {
      new Setting(contentEl)
        .setName(t('modalPasswordHintLabel', this.locale))
        .setDesc(t('modalPasswordHintDesc', this.locale))
        .addText(text => {
          text
            .setPlaceholder(t('modalPasswordHintPlaceholder', this.locale))
            .setValue(this.hint)
            .onChange(value => {
              this.hint = value;
            });
        });
    }

    new Setting(contentEl)
      .setClass("eccirian-password-modal-actions")
      .addButton(button => {
        button
          .setButtonText(t('buttonConfirm', this.locale))
          .setCta()
          .onClick(() => {
            void this.submit();
          });
      })
      .addButton(button => {
        button
          .setButtonText(t('buttonCancel', this.locale))
          .onClick(() => {
            this.close();
            this.onCancel();
          });
      });
  }

  private async submit() {
    if (!this.password) {
      if (this.plugin.settings.showNotice) new Notice(t('noticeEnterPassword', this.locale));
      return;
    }

    if (!this.isDecrypt && this.requirePasswordConfirmation) {
      if (!this.confirmPassword) {
        if (this.plugin.settings.showNotice) new Notice(t('noticeConfirmPasswordRequired', this.locale));
        return;
      }
      if (this.password !== this.confirmPassword) {
        if (this.plugin.settings.showNotice) new Notice(t('noticePasswordsDoNotMatch', this.locale));
        return;
      }
    }

    if (!this.isDecrypt) {
      const extension = this.encryptionMode === "permanent" ? "peccirian" : "eccirian";
      this.plugin.settings.fileExtension = extension;
      await this.plugin.saveSettings();
    }

    this.isSubmitted = true;
    this.close();
    this.onSuccess(this.password, this.encryptionMethod, this.hint, this.encryptionMode);
  }

  onClose() {
    const { contentEl } = this;
    contentEl.empty();
    if (!this.isSubmitted) {
      this.onCancel();
    }
  }
}

import { App, Modal, Setting, Notice } from "obsidian";

export class PasswordModal extends Modal {
  password: string = "";
  confirmPassword: string = "";
  hint: string = "";
  onSuccess: (password: string, encryptionMethod: "AES" | "ECC", hint?: string) => void;
  onCancel: () => void;
  encryptionMode: "temporary" | "permanent" = "temporary";
  encryptionMethod: "AES" | "ECC" = "AES";
  private isSubmitted: boolean = false;
  private isDecrypt: boolean = false;
  private requirePasswordConfirmation: boolean = false;
  private showHint: boolean = false;
  private plugin: any;

  constructor(
    app: App,
    onSuccess: (password: string, encryptionMethod: "AES" | "ECC", hint?: string) => void,
    onCancel: () => void,
    defaultMode: "temporary" | "permanent" = "temporary",
    isDecrypt: boolean = false,
    requirePasswordConfirmation: boolean = false,
    showHint: boolean = false,
    defaultEncryptionMethod: "AES" | "ECC" = "AES",
    plugin: any
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
  }

  onOpen() {
    const { contentEl } = this;
    contentEl.empty();

    contentEl.createEl("h2", { text: "Eccirian Encryption" });

    if (!this.isDecrypt) {
      new Setting(contentEl)
        .setName("Encryption Method")
        .setDesc("Choose encryption method")
        .addDropdown(drop =>
          drop
            .addOption("AES", "AES-256 (Symmetric)")
            .addOption("ECC", "ECC+AES (Asymmetric)")
            .setValue(this.encryptionMethod)
            .onChange(value => {
              this.encryptionMethod = value as "AES" | "ECC";
            })
        );

      new Setting(contentEl)
        .setName("Encryption Mode")
        .setDesc("Choose encryption mode")
        .addDropdown(drop =>
          drop
            .addOption("temporary", "Temporary (Single Use)")
            .addOption("permanent", "Permanent (Repeatable)")
            .setValue(this.encryptionMode)
            .onChange(value => {
              this.encryptionMode = value as "temporary" | "permanent";
            })
        );
    }

    new Setting(contentEl)
      .setName("Password")
      .addText(text => {
        text
          .setPlaceholder("Enter password")
          .setValue(this.password)
          .onChange(value => {
            this.password = value;
          });
        text.inputEl.type = "password";
        text.inputEl.addEventListener('keypress', (e) => {
          if (e.key === 'Enter' && this.password) {
            if (!this.requirePasswordConfirmation || this.confirmPassword) {
              this.submit();
            }
          }
        });
      });

    if (!this.isDecrypt && this.requirePasswordConfirmation) {
      new Setting(contentEl)
        .setName("Confirm Password")
        .addText(text => {
          text
            .setPlaceholder("Confirm password")
            .setValue(this.confirmPassword)
            .onChange(value => {
              this.confirmPassword = value;
            });
          text.inputEl.type = "password";
          text.inputEl.addEventListener('keypress', (e) => {
            if (e.key === 'Enter' && this.password && this.confirmPassword) {
              this.submit();
            }
          });
        });
    }

    if (!this.isDecrypt && this.showHint) {
      new Setting(contentEl)
        .setName("Password Hint")
        .setDesc("Optional hint to help remember the password")
        .addText(text => {
          text
            .setPlaceholder("Enter password hint (optional)")
            .setValue(this.hint)
            .onChange(value => {
              this.hint = value;
            });
        });
    }

    new Setting(contentEl)
      .addButton(button => {
        button
          .setButtonText("Confirm")
          .setCta()
          .onClick(() => {
            this.submit();
          });
      })
      .addButton(button => {
        button
          .setButtonText("Cancel")
          .onClick(() => {
            this.close();
            this.onCancel();
          });
      });
  }

  private async submit() {
    if (!this.password) {
      if (this.plugin.settings.showNotice) {
        new Notice("Please enter a password");
      }
      return;
    }

    if (!this.isDecrypt && this.requirePasswordConfirmation) {
      if (!this.confirmPassword) {
        if (this.plugin.settings.showNotice) {
          new Notice("Please confirm your password");
        }
        return;
      }
      if (this.password !== this.confirmPassword) {
        if (this.plugin.settings.showNotice) {
          new Notice("Passwords do not match");
        }
        return;
      }
    }

    if (!this.isDecrypt) {
      const extension = this.encryptionMode === "permanent" ? "peccidian" : "eccirian";
      this.plugin.settings.fileExtension = extension;
      await this.plugin.saveSettings();
    }

    this.isSubmitted = true;
    this.close();
    this.onSuccess(this.password, this.encryptionMethod, this.hint);
  }

  onClose() {
    const { contentEl } = this;
    contentEl.empty();
    if (!this.isSubmitted) {
      this.onCancel();
    }
  }
}

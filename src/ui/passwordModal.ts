import { App, Modal, Setting, Notice } from "obsidian";

export class PasswordModal extends Modal {
  password: string = "";
  confirmPassword: string = "";
  onSuccess: (password: string, encryptionMethod: "AES" | "ECC") => void;
  onCancel: () => void;
  encryptionMode: "temporary" | "permanent" = "temporary";
  encryptionMethod: "AES" | "ECC" = "AES";
  private isSubmitted: boolean = false;
  private isDecrypt: boolean = false;
  private requirePasswordConfirmation: boolean = false;

  constructor(
    app: App,
    onSuccess: (password: string, encryptionMethod: "AES" | "ECC") => void,
    onCancel: () => void,
    defaultMode: "temporary" | "permanent" = "temporary",
    isDecrypt: boolean = false,
    requirePasswordConfirmation: boolean = false
  ) {
    super(app);
    this.onSuccess = onSuccess;
    this.onCancel = onCancel;
    this.encryptionMode = defaultMode;
    this.isDecrypt = isDecrypt;
    this.requirePasswordConfirmation = requirePasswordConfirmation;
  }

  onOpen() {
    const { contentEl } = this;
    contentEl.empty();

    contentEl.createEl("h2", { text: "Eccidian Encryption" });

    if (!this.isDecrypt) {
      new Setting(contentEl)
        .setName("Encryption Method")
        .setDesc("Choose encryption method")
        .addDropdown(drop =>
          drop
            .addOption("AES", "AES-256 (Symmetric)")
            .addOption("ECC", "ECC (Asymmetric)")
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
            .addOption("permanent", "Permanent (Not Implemented)")
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

  private submit() {
    if (!this.password) {
      new Notice("Please enter a password");
      return;
    }

    if (!this.isDecrypt && this.requirePasswordConfirmation) {
      if (!this.confirmPassword) {
        new Notice("Please confirm your password");
        return;
      }
      if (this.password !== this.confirmPassword) {
        new Notice("Passwords do not match");
        return;
      }
    }

    this.isSubmitted = true;
    this.close();
    this.onSuccess(this.password, this.encryptionMethod);
  }

  onClose() {
    const { contentEl } = this;
    contentEl.empty();
    if (!this.isSubmitted) {
      this.onCancel();
    }
  }
}

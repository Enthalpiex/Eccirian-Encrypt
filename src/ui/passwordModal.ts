import { App, Modal, Setting, Notice } from "obsidian";

export class PasswordModal extends Modal {
  password: string = "";
  onSuccess: (password: string) => void;
  onCancel: () => void;
  encryptionMode: "temporary" | "permanent" = "temporary";
  private isSubmitted: boolean = false;
  private isDecrypt: boolean = false;

  constructor(
    app: App,
    onSuccess: (password: string) => void,
    onCancel: () => void,
    defaultMode: "temporary" | "permanent" = "temporary",
    isDecrypt: boolean = false
  ) {
    super(app);
    this.onSuccess = onSuccess;
    this.onCancel = onCancel;
    this.encryptionMode = defaultMode;
    this.isDecrypt = isDecrypt;
  }

  onOpen() {
    const { contentEl } = this;
    contentEl.empty();

    contentEl.createEl("h2", { text: "Enter Password" });

    if (!this.isDecrypt) {
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
            this.submit();
          }
        });
      });

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
    this.isSubmitted = true;
    this.close();
    this.onSuccess(this.password);
  }

  onClose() {
    const { contentEl } = this;
    contentEl.empty();
    if (!this.isSubmitted) {
      this.onCancel();
    }
  }
}

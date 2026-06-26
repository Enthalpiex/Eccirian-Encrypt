import { FileView, WorkspaceLeaf, ViewStateResult, TFile, Notice } from "obsidian";
import { PasswordModal } from "../ui/passwordModal";
import { decryptWithPassword } from "../encryption/aesWithPassword";
import { decryptWithPassword as eccDecrypt } from "../encryption/eccWithPassword";
import { DecryptionHelper } from "../utils/decryptionHelper";
import EccEncryptPlugin from "../main";
import { AttachmentHelper } from "../utils/attachmentHelper";
import { FolderHelper } from "../utils/folderHelper";
import { confirmActionModal, confirmChoiceModal } from "../ui/confirmActionModal";
import { FileDataHelper, JsonFileEncoding } from "../types/fileData";
import { base64ToArrayBuffer } from "../utils/base64";
import { ProgressModal } from "../ui/progressModal";

export const ECCIDIAN_VIEW_TYPE = "eccirian-encrypt-view";

type EccidianViewState = {
  file?: TFile | string;
  type?: string;
};

export class EccidianView extends FileView {
  private static readonly PROGRESS_SHOW_THRESHOLD_MS = 100;
  filePath: string;
  private loadingFile: boolean = false;
  private displayName: string = "Encrypted Note";
  private plugin: EccEncryptPlugin;

  private estimateAttachmentWorkMs(files: TFile[]): number {
    const totalBytes = files.reduce((sum, f) => sum + (f.stat?.size || 0), 0);
    return files.length * 25 + totalBytes / (64 * 1024);
  }

  private shouldShowProgressByEstimate(estimatedMs: number): boolean {
    return estimatedMs >= EccidianView.PROGRESS_SHOW_THRESHOLD_MS;
  }

  constructor(leaf: WorkspaceLeaf, plugin: EccEncryptPlugin) {
    super(leaf);
    this.filePath = "";
    this.navigation = true;
    this.plugin = plugin;
  }

  updateTitle(newTitle: string) {
    this.displayName = newTitle;
  }

  getViewType(): string {
    return ECCIDIAN_VIEW_TYPE;
  }

  getDisplayText(): string {
    if (this.file) {
      return this.file.basename;
    }
    return this.displayName;
  }

  getIcon(): string {
    return "lock";
  }

  async setState(state: EccidianViewState, result: ViewStateResult): Promise<void> {
    await super.setState(state, result);

    if (state?.file) {
      if (state.file instanceof TFile) {
        this.file = state.file;
        this.filePath = state.file.path;
        this.updateTitle(state.file.basename);
      } else if (typeof state.file === 'string') {
        // Handle file path string
        this.filePath = state.file;
        const file = this.app.vault.getAbstractFileByPath(this.filePath);
        if (file instanceof TFile) {
          this.file = file;
          this.updateTitle(file.basename);
        }
      }
    }

    await this.onOpen();
  }

  getState(): EccidianViewState {
    return {
      file: this.filePath,
      type: ECCIDIAN_VIEW_TYPE
    };
  }

  async onOpen() {
    const container = this.containerEl.children[1];
    
    const containerEl = this.containerEl;
    containerEl.addClass('eccirian-view-container');
    containerEl.addClass('eccirian-lock-active');

    const contentContainer = container;
    contentContainer.addClass('eccirian-view-content');

    // Check if this is a folder encryption
    let isFolder = false;
    if (this.file) {
      try {
        const content = await this.app.vault.read(this.file);
        const isFolderMatch = content.match(/IS_FOLDER:(.+)/);
        isFolder = !!(isFolderMatch && isFolderMatch[1] === "true");
        
        if (isFolder) {
          // Try to get folder metadata from decrypted content (if possible)
          // For now, just show folder icon
        }
      } catch {
        // file read failure: fall back to non-folder lock view
      }
    }

    const iconMap = {
      lock: "🔒",
      shield: "🛡️",
      key: "🔑",
      padlock: "🔐"
    };

    const icon = iconMap[this.plugin.settings.iconStyle] || "🔒";
    const displayIcon = isFolder ? "📁" : icon;

    const lockView = container.createDiv({ cls: 'eccirian-lock-view' });
    
    lockView.addEventListener('keydown', (e) => {
      e.stopPropagation();
      e.preventDefault();
    });
    
    lockView.addEventListener('keyup', (e) => {
      e.stopPropagation();
      e.preventDefault();
    });
    
    lockView.addEventListener('keypress', (e) => {
      e.stopPropagation();
      e.preventDefault();
    });
    
    lockView.addEventListener('mousedown', (e) => {
      if ((e.target as HTMLElement).tagName !== 'BUTTON') {
        e.stopPropagation();
      }
    });

    const lockIcon = lockView.createDiv({ cls: 'eccirian-lock-icon' });
    lockIcon.setText(displayIcon);

    const message = lockView.createEl('p', { cls: 'eccirian-message' });
    message.setText(
      this.file
        ? `"${this.file.basename}" ${this.plugin.i18n.lockViewMessage || "is encrypted. Click below to unlock."}`
        : this.plugin.i18n.lockViewMessage || "is encrypted. Click below to unlock."
    );

    const unlockBtn = lockView.createEl('button', { cls: 'eccirian-unlock-button' });
    unlockBtn.setText(this.plugin.i18n.lockViewUnlockButton || 'Unlock');

    unlockBtn.addEventListener('mouseenter', () => {
      lockView.addClass('eccirian-unlock-hover');
    });

    unlockBtn.addEventListener('mouseleave', () => {
      lockView.removeClass('eccirian-unlock-hover');
    });

    unlockBtn.addEventListener('click', () => {
      void this.handleUnlockClick();
    });
  }

  private async handleUnlockClick(): Promise<void> {
    if (this.filePath) {
      const file = this.app.vault.getAbstractFileByPath(this.filePath);
      if (file instanceof TFile) {
        this.file = file;
      }
    }

    if (!this.file) {
      if (this.plugin.settings.showNotice) {
        new Notice(this.plugin.i18n.messageFileDoesNotExist || "File does not exist");
      }
      return;
    }

    try {
      const encContent = await this.app.vault.read(this.file);
      const looksJson = encContent.trim().startsWith("{") && encContent.includes("encodedData");
      if (!encContent.includes("%%ENC") && !looksJson) {
        if (this.plugin.settings.showNotice) {
          new Notice(this.plugin.i18n.messageNotEncryptedFile || "This is not an encrypted file");
        }
        await this.leaf.openFile(this.file, { state: { mode: "source" } });
        return;
      }

      const isFolderMatch0 = encContent.match(/IS_FOLDER:(.+)/);
      const isFolder0 = isFolderMatch0 && isFolderMatch0[1] === "true";

      if (!encContent.includes("%%ENC") && looksJson) {
          try {
            const dataObj = JsonFileEncoding.decode(encContent);
            const originalExt = (dataObj.originalExt || "md").toLowerCase();
            const encoded = String(dataObj.encodedData || "");
            new PasswordModal(
              this.app,
              (password) => {
                void (async () => {
                  try {
                    const metadata = DecryptionHelper.parseEncodedMetadata(encoded);
                    
                    if (!DecryptionHelper.validateEncryptedData(metadata.salt, metadata.iv, metadata.data)) {
                      if (this.plugin.settings.showNotice) new Notice(this.plugin.i18n.messageInvalidJsonFormat || "Invalid JSON format");
                      return;
                    }

                    // Build KDF options from embedded metadata
                    const kdfOpts = DecryptionHelper.buildKdfOptions(
                      metadata.kdfLine,
                      dataObj.kdf,
                      dataObj
                    );

                    if (originalExt !== "md") {
                      const encryptedSourceFile = this.file;
                      if (!encryptedSourceFile) {
                        if (this.plugin.settings.showNotice) new Notice(this.plugin.i18n.messageFileDoesNotExist || "File not found");
                        return;
                      }
                      let arrayBuffer: ArrayBuffer;
                      if (DecryptionHelper.isBinaryFormat(metadata.format)) {
                        const { decryptBytesWithPassword } = await import("../encryption/aesWithPassword");
                        const bytes = await decryptBytesWithPassword(password, metadata.salt, metadata.iv, metadata.data, this.plugin?.getKeyCache?.() || undefined, kdfOpts);
                        arrayBuffer = bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength);
                      } else {
                        const txt = await FileDataHelper.decrypt(dataObj, password, this.plugin?.getKeyCache?.() || undefined, kdfOpts);
                        if (!txt) {
                          if (this.plugin.settings.showNotice) new Notice(this.plugin.i18n.messageDecryptionFailed || "Decryption failed");
                          return;
                        }
                        arrayBuffer = base64ToArrayBuffer(txt);
                      }

                      // Ensure we have a proper extension (not a bare filename)
                      const basePath = encryptedSourceFile.path
                        .replace(/\.eccirian$/, '')
                        .replace(/\.peccirian$/, '');
                      const normalizedOriginalExt = originalExt.replace(/^\./, '');
                      const originalPath = basePath.toLowerCase().endsWith(`.${normalizedOriginalExt}`)
                        ? basePath
                        : `${basePath}.${normalizedOriginalExt}`;

                      // Check if file already exists before overwriting
                      const existing = this.app.vault.getAbstractFileByPath(originalPath);
                      if (existing instanceof TFile) {
                        const filename = originalPath.split('/').pop() || originalPath;
                        const shouldOverwrite = await confirmActionModal(this.app, {
                          title: this.plugin.i18n.dialogFileAlreadyExists || "File Already Exists",
                          lines: [
                            (this.plugin.i18n.dialogFileAlreadyExistsDesc1 || "A file named \"{filename}\" already exists.").replace("{filename}", filename),
                            this.plugin.i18n.dialogFileAlreadyExistsDesc2 || "Decrypting will overwrite the existing file.",
                            this.plugin.i18n.dialogFileAlreadyExistsDesc3 || "Do you want to continue?",
                          ],
                          warningLineIndexes: [1],
                          cancelText: this.plugin.i18n.buttonCancel || "Cancel",
                          confirmText: this.plugin.i18n.buttonContinue || "Continue",
                          isWarningConfirm: true,
                        });
                        
                        if (!shouldOverwrite) {
                          return;
                        }
                        
                        // Delete the existing file before overwriting
                        await this.app.fileManager.trashFile(existing);
                      }
                      
                      await this.app.vault.createBinary(originalPath, arrayBuffer);

                      // Open restored file in the current leaf BEFORE deleting source file.
                      // Deleting the currently opened file first can cause Obsidian to route openFile to a new tab.
                      const restored = this.app.vault.getAbstractFileByPath(originalPath);
                      if (restored instanceof TFile) {
                        await this.leaf.openFile(restored);
                        await this.app.fileManager.trashFile(encryptedSourceFile);
                        if (this.plugin.settings.showNotice) new Notice(this.plugin.i18n.messageFileDecrypted || "File decrypted");
                      }
                      return;
                    }
                  } catch {
                    if (this.plugin.settings.showNotice) new Notice(this.plugin.i18n.messageDecryptionFailed || "Decryption failed");
                  }
                })();
              },
              () => {},
              this.plugin.settings.defaultEncryptionMode,
              true,
              this.plugin.settings.requirePasswordConfirmation,
              this.plugin.settings.showHint,
              this.plugin.settings.encryptionMethod,
              this.plugin,
              true,
              undefined
            ).open();
            return;
          } catch {
            // JSON parse failed -> fall through to %%ENC handling
          }
        }
        
        if (isFolder0) {
          const saltMatch = encContent.match(/SALT:(.+)/);
          const ivMatch = encContent.match(/IV:(.+)/);
          const dataMatch = encContent.match(/DATA:(.+)/);
          const hintMatch = encContent.match(/HINT:(.+)/);
          const hint = hintMatch ? hintMatch[1] : undefined;
          
          if (!saltMatch || !ivMatch || !dataMatch) {
            if (this.plugin.settings.showNotice) new Notice(`${this.plugin.i18n.messageDecryptionFailed || "Decryption failed"}: ${this.plugin.i18n.messageInvalidFileFormat || "Invalid file format"}`);
            return;
          }
          
          new PasswordModal(
            this.app,
            (password) => {
              void (async () => {
                try {
                // ECC or AES decrypt
                let decrypted: string;
                const metadata = DecryptionHelper.parseEncodedMetadata(encContent);

                // Build KDF options from %%ENC metadata
                const kdfOpts = DecryptionHelper.buildKdfOptions(metadata.kdfLine, undefined);

                if (DecryptionHelper.isEccEncrypted(metadata.publicKey)) {
                  decrypted = await eccDecrypt(
                    password,
                    metadata.salt,
                    metadata.iv,
                    metadata.data,
                    metadata.publicKey!,
                    metadata.ephemeralPublicKey,
                    metadata.wrappedPrivateKey,
                    metadata.wrapIv,
                    this.plugin?.getKeyCache?.() || undefined,
                    kdfOpts
                  );
                } else {
                  decrypted = await decryptWithPassword(
                    password,
                    metadata.salt,
                    metadata.iv,
                    metadata.data,
                    this.plugin?.getKeyCache?.() || undefined,
                    kdfOpts
                  );
                }
                
                // Restore to original folder path with explicit conflict confirmation.
                let originalPath = encContent.match(/ORIGINAL_PATH:(.+)/)?.[1] || null;
                if (!originalPath) {
                  // Try to recover original path from decrypted JSON (back-compat)
                  try {
                    const parsed = JSON.parse(decrypted);
                    if (parsed && parsed.isFolder && parsed.folderPath) {
                      originalPath = parsed.folderPath;
                    }
                  } catch {
                    // ignore parse errors
                  }
                }
                if (!originalPath) {
                  if (this.plugin.settings.showNotice) new Notice(this.plugin.i18n.messageMissingOriginalPath || "Missing ORIGINAL_PATH");
                  return;
                }

                const existingFolderTarget = this.app.vault.getAbstractFileByPath(originalPath);
                if (existingFolderTarget) {
                  const folderName = originalPath.split('/').pop() || originalPath;
                  const folderAction = await confirmChoiceModal<"cancel" | "overwrite" | "merge">(this.app, {
                    title: this.plugin.i18n.dialogFolderAlreadyExists || "Folder Already Exists",
                    lines: [
                      (this.plugin.i18n.dialogFolderAlreadyExistsDesc1 || "A folder named \"{filename}\" already exists.").replace("{filename}", folderName),
                      this.plugin.i18n.dialogFolderAlreadyExistsDesc2 || "Choose how to restore decrypted files into this folder.",
                      this.plugin.i18n.dialogFolderAlreadyExistsDesc3 || "Overwrite: replace entire folder. Merge: write into existing folder and overwrite same-name files.",
                    ],
                    warningLineIndexes: [2],
                    options: [
                      {
                        value: "cancel",
                        text: this.plugin.i18n.buttonCancel || "Cancel",
                      },
                      {
                        value: "overwrite",
                        text: this.plugin.i18n.buttonOverwrite || "Overwrite",
                        isWarning: true,
                      },
                      {
                        value: "merge",
                        text: this.plugin.i18n.buttonMerge || "Merge",
                        isCta: true,
                      },
                    ],
                  });
                  if (folderAction === "cancel") {
                    return;
                  }
                  if (folderAction === "overwrite") {
                    await this.app.fileManager.trashItem(existingFolderTarget);
                  }
                }

                const targetPath = originalPath;
                await FolderHelper.unpackFolder(this.app.vault, decrypted, targetPath);
                
                // Delete encrypted file (guard against null)
                if (this.file) {
                  this.plugin.clearFolderIndex(this.file.path);
                  await this.plugin.saveSettings();
                  await this.app.fileManager.trashFile(this.file);
                }
                
                if (this.plugin.settings.showNotice) {
                  new Notice(`${this.plugin.i18n.messageFolderDecrypted} → ${targetPath}`);
                }
                } catch (error) {
                  if (this.plugin.settings.showNotice) {
                    new Notice(`${this.plugin.i18n.messageDecryptionFailed || "Decryption failed"}: ` + (error instanceof Error ? error.message : "Unknown error"));
                  }
                }
              })();
            },
            () => {},
            this.plugin.settings.defaultEncryptionMode,
            true,
            this.plugin.settings.requirePasswordConfirmation,
            this.plugin.settings.showHint,
            this.plugin.settings.encryptionMethod,
            this.plugin,
            true,
            hint
          ).open();
          return;
        }

        // Not a folder: keep original extension until password is verified.
        const encryptedFile = this.file;
        const content = encContent;
        
        if (!content.includes("%%ENC")) {
          if (this.plugin.settings.showNotice) new Notice(this.plugin.i18n.messageNotEncryptedFile || "This is not an encrypted file");
          return;
        }

        const saltMatch = content.match(/SALT:(.+)/);
        const ivMatch = content.match(/IV:(.+)/);
        const dataMatch = content.match(/DATA:(.+)/);
        const typeMatch = content.match(/TYPE:(.+)/);
        const isFolderMatch = content.match(/IS_FOLDER:(.+)/);
        const isFolder = isFolderMatch && isFolderMatch[1] === "true";
        
        // For folder encryption, ORIGINAL_EXT is not required
        const originalExtMatch = content.match(/ORIGINAL_EXT:(.+)/);

        if (!saltMatch || !ivMatch || !dataMatch || !typeMatch) {
          if (this.plugin.settings.showNotice) {
            new Notice(`${this.plugin.i18n.messageDecryptionFailed || "Decryption failed"}: ${this.plugin.i18n.messageInvalidFileFormat || "Invalid file format"}`);
          }
          return;
        }
        
        // For regular files, ORIGINAL_EXT is required
        if (!isFolder && !originalExtMatch) {
          if (this.plugin.settings.showNotice) {
            new Notice(`${this.plugin.i18n.messageDecryptionFailed || "Decryption failed"}: ${this.plugin.i18n.messageInvalidFileFormat || "Invalid file format"}`);
          }
          return;
        }

        const encryptionType = typeMatch[1];
        
        // Extract hint if exists
        const hintMatch = content.match(/HINT:(.+)/);
        const hint = hintMatch ? hintMatch[1] : undefined;
        
        this.plugin.settings.defaultEncryptionMode = encryptionType as "temporary" | "permanent";
        await this.plugin.saveSettings();
        
        new PasswordModal(
          this.app, 
          (password) => {
            void (async () => {
              try {
              // Unified path: decode and decrypt via FileDataHelper (auto-detects ECC)
              const dataObj = JsonFileEncoding.decode(content);
              const decrypted = await FileDataHelper.decrypt(dataObj, password, this.plugin?.getKeyCache?.() || undefined);
              if (!decrypted) {
                if (this.plugin.settings.showNotice) new Notice(`${this.plugin.i18n.messageDecryptionFailed || "Decryption failed"}: ${this.plugin.i18n.messagePasswordIncorrect || "Password may be incorrect"}`);
                return;
              }

              try {
                // Check if this is a folder encryption
                const isFolderMatch = content.match(/IS_FOLDER:(.+)/);
                const isFolder = isFolderMatch && isFolderMatch[1] === "true";
                
                if (isFolder) {
                  // Handle folder decryption
                  let originalPath = content.match(/ORIGINAL_PATH:(.+)/)?.[1] || null;
                  // Fallback: try to get folder path from decrypted JSON (back-compat)
                  if (!originalPath) {
                    try {
                      const parsed = JSON.parse(decrypted);
                      if (parsed && parsed.isFolder && parsed.folderPath) originalPath = parsed.folderPath;
                    } catch {
                      // ignore
                    }
                  }
                  
                  if (originalPath) {
                    const existingFolderTarget = this.app.vault.getAbstractFileByPath(originalPath);
                    if (existingFolderTarget) {
                      const folderName = originalPath.split('/').pop() || originalPath;
                      const folderAction = await confirmChoiceModal<"cancel" | "overwrite" | "merge">(this.app, {
                        title: this.plugin.i18n.dialogFolderAlreadyExists || "Folder Already Exists",
                        lines: [
                          (this.plugin.i18n.dialogFolderAlreadyExistsDesc1 || "A folder named \"{filename}\" already exists.").replace("{filename}", folderName),
                          this.plugin.i18n.dialogFolderAlreadyExistsDesc2 || "Choose how to restore decrypted files into this folder.",
                          this.plugin.i18n.dialogFolderAlreadyExistsDesc3 || "Overwrite: replace entire folder. Merge: write into existing folder and overwrite same-name files.",
                        ],
                        warningLineIndexes: [2],
                        options: [
                          {
                            value: "cancel",
                            text: this.plugin.i18n.buttonCancel || "Cancel",
                          },
                          {
                            value: "overwrite",
                            text: this.plugin.i18n.buttonOverwrite || "Overwrite",
                            isWarning: true,
                          },
                          {
                            value: "merge",
                            text: this.plugin.i18n.buttonMerge || "Merge",
                            isCta: true,
                          },
                        ],
                      });
                      if (folderAction === "cancel") {
                        return;
                      }
                      if (folderAction === "overwrite") {
                        await this.app.fileManager.trashItem(existingFolderTarget);
                      }
                    }

                    const targetPath = originalPath;
                    let estimatedMs = 0;
                    try {
                      const parsed = JSON.parse(decrypted);
                      const count = Array.isArray(parsed?.files) ? parsed.files.length : 0;
                      estimatedMs = count * 20;
                    } catch {
                      estimatedMs = 120;
                    }

                    const showProgress = this.shouldShowProgressByEstimate(estimatedMs);
                    const progress = showProgress
                      ? new ProgressModal(this.app, "Decrypting Folder", "Restoring folder files...")
                      : null;
                    progress?.open();
                    try {
                      await FolderHelper.unpackFolder(
                        this.app.vault,
                        decrypted,
                        targetPath,
                        (current, total, currentPath) => {
                          progress?.setMessage(currentPath ? `Restoring: ${currentPath}` : "Restoring folder files...");
                          progress?.setProgress(current, total || 1);
                        }
                      );
                    } finally {
                      progress?.close();
                    }
                    
                    // Delete encrypted file
                    this.plugin.clearFolderIndex(encryptedFile.path);
                    await this.plugin.saveSettings();
                    await this.app.fileManager.trashFile(encryptedFile);
                    
                    if (this.plugin.settings.showNotice) {
                      new Notice(`${this.plugin.i18n.messageFolderDecrypted} → ${targetPath}`);
                    }
                    
                    return;
                  }
                }

                let processedText = decrypted.trim() === "$·-·$" ? "" : decrypted;
                
                // Decrypt attachments if enabled and in temporary mode
                const decodedType = JsonFileEncoding.decode(content).type;
                if (this.plugin.settings.encryptAttachments && decodedType === "temporary") {
                  const attachmentLinks = AttachmentHelper.extractAttachmentLinks(processedText);

                  const resolvedAttachments = attachmentLinks
                    .map((link) => AttachmentHelper.resolveAttachmentPath(this.app.vault, encryptedFile.path, link))
                    .filter((f): f is TFile => f instanceof TFile);

                  const showProgress = this.shouldShowProgressByEstimate(
                    this.estimateAttachmentWorkMs(resolvedAttachments)
                  );

                  const progress = showProgress
                    ? new ProgressModal(this.app, "Decrypting Attachments", "Decrypting linked attachments...")
                    : null;
                  progress?.open();
                  try {
                    let done = 0;
                    const total = resolvedAttachments.length;
                    progress?.setProgress(done, total || 1);

                    for (const encryptedAttachment of resolvedAttachments) {
                      try {
                        await AttachmentHelper.decryptBinaryFile(
                          this.app.vault,
                          encryptedAttachment,
                          password
                        );
                      } catch {
                        // Best-effort attachment decryption — skip on failure
                      }

                      done += 1;
                      progress?.setProgress(done, total || 1);
                    }
                  } finally {
                    progress?.close();
                  }
                  
                  // Update attachment links back to original
                  processedText = AttachmentHelper.updateAttachmentLinks(
                    processedText,
                    "decrypt",
                    "temporary"
                  );
                }

                const decoded = JsonFileEncoding.decode(content);
                const originalExt = (decoded.originalExt || "md").replace(/^\./, "");
                const basePath = encryptedFile.path
                  .replace(/\.eccirian$/i, "")
                  .replace(/\.peccirian$/i, "");
                const targetPath = basePath.toLowerCase().endsWith(`.${originalExt.toLowerCase()}`)
                  ? basePath
                  : `${basePath}.${originalExt}`;
                
                // Check if file with original extension already exists
                const existingOriginalFile = this.app.vault.getAbstractFileByPath(targetPath);
                
                if (existingOriginalFile instanceof TFile) {
                  const filename = targetPath.split('/').pop() || targetPath;
                  const continueRestore = await confirmActionModal(this.app, {
                    title: this.plugin.i18n.dialogFileAlreadyExists || "File Already Exists",
                    lines: [
                      (this.plugin.i18n.dialogFileAlreadyExistsDesc1 || "A file named \"{filename}\" already exists.").replace("{filename}", filename),
                      this.plugin.i18n.dialogFileAlreadyExistsDesc2 || "Decrypting will overwrite the existing file.",
                      this.plugin.i18n.dialogFileAlreadyExistsDesc3 || "Do you want to continue?",
                    ],
                    warningLineIndexes: [1],
                    cancelText: this.plugin.i18n.buttonCancel || "Cancel",
                    confirmText: this.plugin.i18n.buttonContinue || "Continue",
                    isWarningConfirm: true,
                  });
                  
                  if (!continueRestore) {
                    return;
                  }
                  
                  // Delete existing file before proceeding
                  await this.app.fileManager.trashFile(existingOriginalFile);
                }

                const outputFile = await this.app.vault.create(targetPath, processedText);
                await this.leaf.openFile(outputFile, { state: { mode: "source" } });
                await this.app.fileManager.trashFile(encryptedFile);
                if (this.plugin.settings.showNotice) new Notice(this.plugin.i18n.messageFileDecrypted || "File decrypted");
              } catch {
                return;
              }

              } catch {
                if (this.plugin.settings.showNotice) {
                  new Notice(`${this.plugin.i18n.messageDecryptionFailed || "Decryption failed"}: ${this.plugin.i18n.messageUnexpectedError || "Unexpected error"}`);
                }
                return;
              }
            })();
          },
          () => {},
          this.plugin.settings.defaultEncryptionMode,
          true,
          this.plugin.settings.requirePasswordConfirmation,
          this.plugin.settings.showHint,
          this.plugin.settings.encryptionMethod,
          this.plugin,
          true,  // Show mode selection
          hint   // Pass the hint to display
        ).open();
      } catch {
        if (this.plugin.settings.showNotice) new Notice(this.plugin.i18n.messageFailedToOpenDecryptDialog || "Failed to open decrypt dialog");
      }
    }

  async onClose() {
    await super.onClose();
  }
}

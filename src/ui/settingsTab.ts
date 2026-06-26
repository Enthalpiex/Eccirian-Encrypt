import { App, PluginSettingTab, Setting, Modal, Notice, moment } from "obsidian";
import EccEncryptPlugin from "../main";
import { t } from "../i18n";
import { DEFAULT_SETTINGS } from "../settings";
import logoDataText from "./eccirianlogo.txt";

const EMBEDDED_LOGO_SOURCES =
  logoDataText.match(/data:image\/png;base64,[A-Za-z0-9+/=]+/g) ?? [];
const LIGHT_THEME_LOGO_SRC = EMBEDDED_LOGO_SOURCES[0] ?? "";
const DARK_THEME_LOGO_SRC = EMBEDDED_LOGO_SOURCES[1] ?? LIGHT_THEME_LOGO_SRC;

class ConfirmModal extends Modal {
  private locale: string;
  private readonly githubRepoUrl = "https://github.com/Enthalpiex/eccirian-encrypt";

  constructor(app: App, locale: string) {
    super(app);
    this.locale = locale;
  }

  onOpen() {
    const { contentEl } = this;
    contentEl.addClass("eccirian-github-modal-content");
    this.titleEl.setText(t('modalGithubVisitTitle', this.locale));

    const githubLinks = [
      {
        title: `⭐ ${t('githubLinkRepositoryStarTitle', this.locale)}`,
        desc: t('githubLinkRepositoryStarDesc', this.locale),
        url: this.githubRepoUrl,
      },
      {
        title: `🚀 ${t('githubLinkReleaseTitle', this.locale)}`,
        desc: t('githubLinkReleaseDesc', this.locale),
        url: "https://github.com/Enthalpiex/eccirian-encrypt/releases",
      },
      {
        title: `🐞 ${t('githubLinkIssueTitle', this.locale)}`,
        desc: t('githubLinkIssueDesc', this.locale),
        url: "https://github.com/Enthalpiex/eccirian-encrypt/issues/new/choose",
      },
    ];

    const linksContainer = contentEl.createDiv({ cls: "eccirian-github-links" });

    githubLinks.forEach((item) => {
      const row = linksContainer.createDiv({ cls: "eccirian-github-link-row" });
      const info = row.createDiv({ cls: "eccirian-github-link-info" });
      info.createDiv({ cls: "eccirian-github-link-title", text: item.title });
      info.createDiv({ cls: "eccirian-github-link-desc", text: item.desc });

      const actions = row.createDiv({ cls: "eccirian-github-link-actions" });
      const openBtn = actions.createEl("button", {
        cls: "mod-cta eccirian-github-open-btn",
        text: t('buttonOpen', this.locale),
      });
      openBtn.addEventListener("click", () => {
        window.open(item.url, "_blank");
      });
    });

    new Setting(contentEl)
      .setClass("eccirian-github-modal-actions")
      .addButton((button) => {
        button
          .setButtonText(t('buttonCancel', this.locale))
          .onClick(() => {
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
  private themeObserver: MutationObserver | null = null;

  constructor(app: App, plugin: EccEncryptPlugin) {
    super(app, plugin);
    this.plugin = plugin;
  }

  private getLogoSrcForCurrentTheme(): string {
    return activeDocument.body.classList.contains("theme-dark")
      ? DARK_THEME_LOGO_SRC
      : LIGHT_THEME_LOGO_SRC;
  }

  private attachThemeLogoAutoSwitch(logoEl: HTMLImageElement): void {
    const updateLogo = () => {
      logoEl.src = this.getLogoSrcForCurrentTheme();
    };

    updateLogo();
    this.themeObserver?.disconnect();
    this.themeObserver = new MutationObserver(updateLogo);
    this.themeObserver.observe(activeDocument.body, {
      attributes: true,
      attributeFilter: ["class"],
    });
  }

  hide(): void {
    this.themeObserver?.disconnect();
    this.themeObserver = null;
    super.hide();
  }

  display(): void {
    const { containerEl } = this;
    containerEl.empty();
    
    // Get Obsidian's locale
    const locale = moment.locale();

    const logoContainer = containerEl.createDiv('eccirian-logo-container');

    logoContainer.createEl('img', {
      attr: {
        src: this.getLogoSrcForCurrentTheme(),

        alt: 'Eccirian Logo'
      }
    });
    const logo = logoContainer.querySelector('img');
    if (logo) {
      logo.addClass('eccirian-logo-image');
      this.attachThemeLogoAutoSwitch(logo);
    }
    logoContainer.addEventListener('click', () => {
      new ConfirmModal(this.app, locale).open();
    });

    // General
    new Setting(containerEl)
      .setName(t('settingsSectionGeneral', locale))
      .setHeading();

    new Setting(containerEl)
      .setName(t('settingsDefaultEncryptionMethod', locale))
      .setDesc(t('settingsDefaultEncryptionMethodDesc', locale))
      .addDropdown(drop =>
        drop
          .addOption("AES", t('encryptionMethodAES', locale))
          .addOption("ECC", t('encryptionMethodECC', locale))
          .setValue(this.plugin.settings.encryptionMethod)
          .onChange((value) => {
            void (async () => {
              this.plugin.settings.encryptionMethod = value as "AES" | "ECC";
              await this.plugin.saveSettings();
            })();
          })
      );

    new Setting(containerEl)
      .setName(t('settingsDefaultEncryptionMode', locale))
      .setDesc(t('settingsDefaultEncryptionModeDesc', locale))
      .addDropdown(drop =>
        drop
          .addOption("temporary", t('encryptionModeTemporary', locale))
          .addOption("permanent", t('encryptionModePermanent', locale))
          .setValue(this.plugin.settings.defaultEncryptionMode)
          .onChange((value) => {
            void (async () => {
              this.plugin.settings.defaultEncryptionMode = value as "temporary" | "permanent";
              await this.plugin.saveSettings();
            })();
          })
      );

    // UI
    new Setting(containerEl)
      .setName(t('settingsSectionUI', locale))
      .setHeading();

    new Setting(containerEl)
      .setName(t('settingsIconStyle', locale))
      .setDesc(t('settingsIconStyleDesc', locale))
      .addDropdown(drop =>
        drop
          .addOption("lock", t('iconStyleLock', locale))
          .addOption("shield", t('iconStyleShield', locale))
          .addOption("key", t('iconStyleKey', locale))
          .addOption("padlock", t('iconStylePadlock', locale))
          .setValue(this.plugin.settings.iconStyle)
          .onChange((value) => {
            void (async () => {
              this.plugin.settings.iconStyle = value as "lock" | "shield" | "key" | "padlock";
              await this.plugin.saveSettings();
            })();
          })
      );

    new Setting(containerEl)
      .setName(t('settingsRequirePasswordConfirmation', locale))
      .setDesc(t('settingsRequirePasswordConfirmationDesc', locale))
      .addToggle(toggle =>
        toggle
          .setValue(this.plugin.settings.requirePasswordConfirmation)
          .onChange((value) => {
            void (async () => {
              this.plugin.settings.requirePasswordConfirmation = value;
              await this.plugin.saveSettings();
            })();
          })
      );

    new Setting(containerEl)
      .setName(t('settingsShowToggleExtensionButton', locale))
      .setDesc(t('settingsShowToggleExtensionButtonDesc', locale))
      .addToggle(toggle =>
        toggle
          .setValue(this.plugin.settings.showToggleExtensionButton)
          .onChange((value) => {
            void (async () => {
              this.plugin.settings.showToggleExtensionButton = value;
              await this.plugin.saveSettings();
              this.plugin.updateToggleExtensionButton();
            })();
          })
      );

    new Setting(containerEl)
      .setName(t('settingsShowNotices', locale))
      .setDesc(t('settingsShowNoticesDesc', locale))
      .addToggle(toggle =>
        toggle
          .setValue(this.plugin.settings.showNotice)
          .onChange((value) => {
            void (async () => {
              this.plugin.settings.showNotice = value;
              await this.plugin.saveSettings();
            })();
          })
      );

    new Setting(containerEl)
      .setName(t('settingsShowHint', locale))
      .setDesc(t('settingsShowHintDesc', locale))
      .addToggle(toggle =>
        toggle
          .setValue(this.plugin.settings.showHint)
          .onChange((value) => {
            void (async () => {
              this.plugin.settings.showHint = value;
              await this.plugin.saveSettings();
            })();
          })
      );

    // Security
    new Setting(containerEl)
      .setName(t('settingsSectionSecurity', locale))
      .setHeading();

    new Setting(containerEl)
      .setName(t('settingsEncryptAttachments', locale))
      .setDesc(t('settingsEncryptAttachmentsDesc', locale))
      .addToggle(toggle =>
        toggle
          .setValue(this.plugin.settings.encryptAttachments)
          .onChange((value) => {
            void (async () => {
              this.plugin.settings.encryptAttachments = value;
              await this.plugin.saveSettings();
            })();
          })
      );

    // KDF type selection
    new Setting(containerEl)
      .setName(t('settingsKdfType', locale))
      .setDesc(t('settingsKdfTypeDesc', locale))
      .addDropdown(drop =>
        drop
          .addOption('PBKDF2', t('kdfOptionPBKDF2', locale))
          .addOption('Argon2id', t('kdfOptionArgon2id', locale))
          .setValue(this.plugin.settings.kdfType)
          .onChange((value) => {
            void (async () => {
              const prevScroll = containerEl.scrollTop;
              this.plugin.settings.kdfType = value as 'PBKDF2' | 'Argon2id';
              await this.plugin.saveSettings();
              this.display();
              // Restore scroll to avoid jump
              window.setTimeout(() => { containerEl.scrollTop = prevScroll; }, 0);
            })();
          })
      );

    if (this.plugin.settings.kdfType === 'PBKDF2') {
      new Setting(containerEl)
        .setName(t('settingsPbkdf2Iterations', locale))
        .setDesc(t('settingsPbkdf2IterationsDesc', locale))
        .addDropdown(drop =>
          drop
            .addOption('100000', `100,000 (${t('labelFast', locale)})`)
            .addOption('600000', `600,000 (${t('labelBalanced', locale)})`)
            .addOption('1000000', `1,000,000 (${t('labelStrong', locale)})`)
            .setValue(String(this.plugin.settings.pbkdf2Iterations))
            .onChange((value) => {
              void (async () => {
                const v = parseInt(value, 10) as 100000 | 600000 | 1000000;
                this.plugin.settings.pbkdf2Iterations = v;
                await this.plugin.saveSettings();
              })();
            })
        );
    }

    if (this.plugin.settings.kdfType === 'Argon2id') {
      new Setting(containerEl)
        .setName(t('settingsArgon2Memory', locale))
        .setDesc(t('settingsArgon2MemoryDesc', locale))
        .addDropdown(drop =>
          drop
            .addOption('19456', `19,456 (${t('labelFast', locale)})`)
            .addOption('24576', `24,576 (${t('labelBalanced', locale)})`)
            .addOption('65536', `65,536 (${t('labelStrong', locale)})`)
            .setValue(String(this.plugin.settings.argon2MemoryKB))
            .onChange((value) => {
              void (async () => {
                const v = parseInt(value, 10) || 24576;
                this.plugin.settings.argon2MemoryKB = v;
                await this.plugin.saveSettings();
              })();
            })
        );

      new Setting(containerEl)
        .setName(t('settingsArgon2Iterations', locale))
        .setDesc(t('settingsArgon2IterationsDesc', locale))
        .addDropdown(drop =>
          drop
            .addOption('1', `1 (${t('labelFast', locale)})`)
            .addOption('2', `2 (${t('labelBalanced', locale)})`)
            .addOption('3', `3 (${t('labelStrong', locale)})`)
            .setValue(String(this.plugin.settings.argon2Iterations))
            .onChange((value) => {
              void (async () => {
                const v = parseInt(value, 10) || 2;
                this.plugin.settings.argon2Iterations = v;
                await this.plugin.saveSettings();
              })();
            })
        );

      new Setting(containerEl)
        .setName(t('settingsArgon2Parallelism', locale))
        .setDesc(t('settingsArgon2ParallelismDesc', locale))
        .addDropdown(drop =>
          drop
            .addOption('1', '1')
            .addOption('2', '2')
            .addOption('4', '4')
            .setValue(String(this.plugin.settings.argon2Parallelism))
            .onChange((value) => {
              void (async () => {
                const v = parseInt(value, 10) || 1;
                this.plugin.settings.argon2Parallelism = v;
                await this.plugin.saveSettings();
              })();
            })
        );

      new Setting(containerEl)
        .setName(t('settingsArgon2HashLen', locale))
        .setDesc(t('settingsArgon2HashLenDesc', locale))
        .addDropdown(drop =>
          drop
            .addOption('16', '16')
            .addOption('32', '32 (Aes-256)')
            .addOption('64', '64')
            .setValue(String(this.plugin.settings.argon2HashLen))
            .onChange((value) => {
              void (async () => {
                const v = parseInt(value, 10) || 32;
                this.plugin.settings.argon2HashLen = v;
                await this.plugin.saveSettings();
              })();
            })
        );
    }

    // Advanced
    new Setting(containerEl)
      .setName(t('settingsSectionAdvanced', locale))
      .setHeading();

    // Key Cache Settings
    new Setting(containerEl)
      .setName(t('settingsEnableKeyCache', locale))
      .setDesc(t('settingsEnableKeyCacheDesc', locale))
      .addToggle(toggle =>
        toggle
          .setValue(this.plugin.settings.enableKeyCache)
          .onChange((value) => {
            void (async () => {
              this.plugin.settings.enableKeyCache = value;
              await this.plugin.saveSettings();
              // Reinitialize cache if needed
              if (value && !this.plugin.keyCache) {
                const { KeyCache } = await import('../encryption/keyCache');
                this.plugin.keyCache = new KeyCache(
                  this.plugin.settings.keyCacheTTL,
                  this.plugin.settings.keyCacheMaxSize
                );
              } else if (!value && this.plugin.keyCache) {
                this.plugin.keyCache.clear();
                this.plugin.keyCache = null;
              }
              this.display(); // Refresh to show/hide dependent settings
            })();
          })
      );

    if (this.plugin.settings.enableKeyCache) {
      new Setting(containerEl)
        .setName(t('settingsKeyCacheTTL', locale))
        .setDesc(t('settingsKeyCacheTTLDesc', locale))
        .addSlider(slider =>
          slider
            .setLimits(1, 30, 1)
            .setValue(this.plugin.settings.keyCacheTTL)
            .setDynamicTooltip()
            .onChange((value) => {
              void (async () => {
                this.plugin.settings.keyCacheTTL = value;
                await this.plugin.saveSettings();
                // Reinitialize cache with new TTL
                if (this.plugin.keyCache) {
                  const { KeyCache } = await import('../encryption/keyCache');
                  const oldCache = this.plugin.keyCache;
                  oldCache.clear();
                  this.plugin.keyCache = new KeyCache(value, this.plugin.settings.keyCacheMaxSize);
                }
              })();
            })
        );

      new Setting(containerEl)
        .setName(t('settingsKeyCacheMaxSize', locale))
        .setDesc(t('settingsKeyCacheMaxSizeDesc', locale))
        .addSlider(slider =>
          slider
            .setLimits(5, 50, 5)
            .setValue(this.plugin.settings.keyCacheMaxSize)
            .setDynamicTooltip()
            .onChange((value) => {
              void (async () => {
                this.plugin.settings.keyCacheMaxSize = value;
                await this.plugin.saveSettings();
                // Reinitialize cache with new size
                if (this.plugin.keyCache) {
                  const { KeyCache } = await import('../encryption/keyCache');
                  const oldCache = this.plugin.keyCache;
                  oldCache.clear();
                  this.plugin.keyCache = new KeyCache(this.plugin.settings.keyCacheTTL, value);
                }
              })();
            })
        );

      new Setting(containerEl)
        .setName(t('settingsClearKeyCache', locale))
        .setDesc(t('settingsClearKeyCacheDesc', locale))
        .addButton(button =>
          button
            .setButtonText(t('buttonClearCache', locale))
            .setWarning()
            .onClick(() => {
              if (this.plugin.settings.showNotice) {
                if (this.plugin.keyCache) {
                  this.plugin.keyCache.clear();
                  new Notice(t('messageKeyCacheCleared', locale));
                } else {
                  new Notice(t('messageKeyCacheNotEnabled', locale));
                }
              }
            })
        );
    }

    new Setting(containerEl)
        .setName(t('settingsRestoreDefaults', locale))
        .setDesc(t('settingsRestoreDefaultsDesc', locale))
        .addButton(button =>
          button
            .setButtonText(t('buttonRestoreDefaults', locale))
            .setWarning()
            .onClick(() => {
              void (async () => {
                this.plugin.settings = { ...DEFAULT_SETTINGS };
                await this.plugin.saveSettings();

                if (this.plugin.keyCache) {
                  this.plugin.keyCache.clear();
                  this.plugin.keyCache = null;
                }

                if (this.plugin.settings.enableKeyCache) {
                  const { KeyCache } = await import('../encryption/keyCache');
                  this.plugin.keyCache = new KeyCache(
                    this.plugin.settings.keyCacheTTL,
                    this.plugin.settings.keyCacheMaxSize
                  );
                }

                if (this.plugin.settings.showNotice) {
                  new Notice(t('messageSettingsRestored', locale));
                }
                this.display();
              })();
            })
        );
  }
}

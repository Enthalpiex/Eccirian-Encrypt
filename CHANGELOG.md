# Changelog

## [1.0.3] - 2025-11-24

- Fixed attachment encryption links breaking due to unhandled spaces, encoded paths, and query params. 

- Preventing broken images.

- Fixed folder unlock logic. Restores to safe paths `Name (Restored)` without overwriting.

## [1.0.2] - 2025-11-10

* Fixed a bug that caused ECC mode encryption to fail.

* Fixed a bug in the Web Crypto API key passing mechanism.

* Added an ECIES implementation from the forward compatibility plan.

## [1.0.0] - 2025-11-07

- Core Features
  
  - Implemented `.peccfile` extension for permanently encrypted attachments
  - In-memory decryption architecture for `.peccirian` files
  - Convert to Markdown support with attachment decryption and link updates
  - Fixed `encryptionMode` parameter propagation from `PasswordModal` to encryption callbacks
  - Encryption mode selection in password dialog applied to file and attachments
  - Password hint support for encrypted folders
  - Overwrite confirmation dialog when decrypting to existing folder path
  - Consistent UX with file encryption workflows

- Technical Implementation
  
  - `AttachmentHelper.encryptBinaryFile()` accepts `type: "temporary" | "permanent"` parameter
  - `AttachmentHelper.updateAttachmentLinks()` bidirectional link transformation
  - `PEccidianView.save()` updates links without re-encrypting attachments
  - `PEccidianView.handlePasswordInput()` updates links without decrypting attachments
  - `PEccidianView.onunload()` null safety check before final save
  - `PasswordModal.onSuccess` extended callback with `encryptionMode` parameter
  - `EccEncryptPlugin.handleEncryptDecrypt()` unified method for ribbon and command palette

- Code Quality Improvements
  
  - Eliminated code duplication in encryption/decryption workflow
  - Enhanced null safety in async operations

- Bug Fixes
  
  - **Fixed attachment extension mismatch** - Permanent mode now correctly uses `.peccfile` instead of `.eccfile`
  - **Fixed Convert to Markdown link cleanup** - Properly removes `.peccfile` extension from links in converted markdown files
  - **Fixed encryption mode propagation** - Selection in password dialog could applies to attachment encryption correctly
  - **Fixed null reference error in save operations** - Additional null checks are added to prevent `Cannot read properties of null (reading 'saving')` error during async operations
  - **Fixed race condition**: File reference is validated before `vault.modify()` calls to handle cases where file is closed during encryption

## [0.9.8] - 2025-10-28

- Major Update
  
  - Automatically **encrypts linked attachments** (images, PDFs, documents) when encrypting notes
  - Supports multiple file types: images (png, jpg, gif, svg), documents (pdf, docx, xlsx), media files, and more
  - **Currently supports Temporary mode only** - Permanent mode attachment encryption coming in future releases
  - Toggle on/off via settings: "Encrypt Attachments"

- Refactored
  
  - **Fixed backlink restoration issue** - Encrypted notes now properly restore to original extension when decrypted
  - **Fixed "RangeError: Field is not present in this state"** when canceling password input
  - **Fixed "Uncaught UserCancelled"** error when canceling password input
  - **Fixed file switching logic** - Removed forced close/reopen behavior

- File Handling Improvements
  
  - Improved `originalExt` handling all types of file 
  - Improved view lifecycle management

- Architecture
  
  - Base64 encoding for binary files
  - Improved path resolution for attachments (relative paths and common attachment folders)

- Code Quality
  
  - Refactored file switching logic in `peccirianView`
  - Removed redundant `handlePeccirianFile` method and merged the logic into `onLoadFile`
  - Added `onUnloadFile` override
  - Enhanced attachment link detection with regex patterns for both wiki and markdown links

- Performance
  
  - Optimized file encryption workflow
  - Better memory management during view transitions
  - Reduced unnecessary file operations

- UI/UX Improvements
  
  - New settings option "Encrypt Attachments"
  - Improved error messages
  - Smoother file switching experience
  - Better handling of edge cases

- Localization
  
  - Updated English translations
  - Updated Chinese translations

## [0.9.1] - 2025-08-10

- Permanent encrypted files cannot be opened

- UI displays failure

- UI conflict

## [0.9.0] - 2025-07-19

- Added permanent encryption

- Added notifications

- Added inner page overlay mode

- Added a new view
  
  

## [0.1.0] - 2025-04-16

- Initial release for Eccirian Encrypt

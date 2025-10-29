# Changelog


## [0.9.8] - 2025-10-28

- Major Update

- Automatically **encrypts linked attachments** (images, PDFs, documents) when encrypting notes
- Supports multiple file types: images (png, jpg, gif, svg), documents (pdf, docx, xlsx), media files, and more
- **Currently supports Temporary mode only** - Permanent mode attachment encryption coming in future releases
- Toggle on/off via settings: "Encrypt Attachments"


## Refactored

- **Fixed backlink restoration issue** - Encrypted notes now properly restore to original extension when decrypted
- **Fixed "RangeError: Field is not present in this state"** when canceling password input
- **Fixed "Uncaught UserCancelled"** error when canceling password input
- **Fixed file switching logic** - Removed forced close/reopen behavior

### File Handling Improvements
- Improved `originalExt` handling all types of file 
- Improved view lifecycle management

### Architecture
- Base64 encoding for binary files
- Improved path resolution for attachments (relative paths and common attachment folders)

### Code Quality
- Refactored file switching logic in `peccirianView`
- Removed redundant `handlePeccirianFile` method and merged the logic into `onLoadFile`
- Added `onUnloadFile` override
- Enhanced attachment link detection with regex patterns for both wiki and markdown links

### Performance
- Optimized file encryption workflow
- Better memory management during view transitions
- Reduced unnecessary file operations

## UI/UX Improvements
- New settings option "Encrypt Attachments"
- Improved error messages
- Smoother file switching experience
- Better handling of edge cases

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

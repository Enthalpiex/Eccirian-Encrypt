import { Vault, TFile } from "obsidian";

/**
 * 修改文件扩展名
 * @param vault Obsidian 的 Vault 实例
 * @param file 当前文件
 * @param newExt 新的扩展名（不含点）
 */
export async function changeFileExtension(vault: Vault, file: TFile, newExt: string): Promise<TFile> {
  console.log("Changing file extension", {
    originalPath: file.path,
    file: file,
    newExt: newExt
  });

  const pathParts = file.path.split("/");
  const fileName = pathParts.pop()!;
  const baseName = fileName.replace(/\.[^/.]+$/, ""); // 去掉扩展名
  const newPath = [...pathParts, `${baseName}.${newExt}`].join("/");

  console.log("New path calculated:", {
    pathParts,
    fileName,
    baseName,
    newPath
  });

  const result = await vault.rename(file, newPath);
  console.log("Rename result:", result);
  
  const newFile = vault.getAbstractFileByPath(newPath) as TFile;
  console.log("New file reference:", newFile);
  
  return newFile;
}

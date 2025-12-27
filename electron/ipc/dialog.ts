import { ipcMain, dialog, BrowserWindow } from "electron";

export function setupDialogHandlers() {
  // フォルダ選択ダイアログの表示
  ipcMain.handle("handle-select-directory", async (event) => {
    const win = BrowserWindow.fromWebContents(event.sender);
    if (!win) {
      return { error: "Main window not available" };
    }
    const result = await dialog.showOpenDialog(win, {
      properties: ["openDirectory"],
    });
    if (result.canceled) {
      return { canceled: true };
    } else {
      return { filePath: result.filePaths[0] };
    }
  });
}

const { execSync } = require("child_process");
const path = require("path");
const fs = require("fs");

// 色付きログ出力のための関数
function logInfo(message) {
  console.log("\x1b[36m%s\x1b[0m", message);
}

function logSuccess(message) {
  console.log("\x1b[32m%s\x1b[0m", message);
}

function logError(message) {
  console.log("\x1b[31m%s\x1b[0m", message);
}

function logWarning(message) {
  console.log("\x1b[33m%s\x1b[0m", message);
}

// 必要なファイルの存在チェック
function checkRequiredFiles() {
  logInfo("必要なファイルの存在チェックを行っています...");

  const requiredFiles = ["electron/main.js", "electron/preload.js"];

  let allFilesExist = true;

  for (const file of requiredFiles) {
    const filePath = path.join(process.cwd(), file);
    if (!fs.existsSync(filePath)) {
      logError(`エラー: ${file} が見つかりません。`);
      allFilesExist = false;
    }
  }

  if (allFilesExist) {
    logSuccess("すべての必要なファイルが存在します。");
  } else {
    logError("一部のファイルが見つかりません。ビルドを実行してください。");
    process.exit(1);
  }
}

// アイコンファイルの存在チェック
function checkIconFiles() {
  logInfo("アイコンファイルの存在チェックを行っています...");

  const iconFiles = ["public/logo.png", "public/logo.ico", "public/logo.icns"];

  let allIconsExist = true;

  for (const file of iconFiles) {
    const filePath = path.join(process.cwd(), file);
    if (!fs.existsSync(filePath)) {
      logWarning(
        `警告: ${file} が見つかりません。アイコン生成スクリプトを実行してください。`
      );
      allIconsExist = false;
    }
  }

  if (allIconsExist) {
    logSuccess("すべてのアイコンファイルが存在します。");
  } else {
    logWarning(
      "一部のアイコンファイルが見つかりません。npm run create-icons を実行してください。"
    );
  }
}

// Electronアプリケーションのテスト実行
function testElectronApp() {
  try {
    logInfo("Electronアプリケーションをテスト実行しています...");

    // 開発モードでElectronを起動
    execSync("npx electron .", { stdio: "inherit" });

    logSuccess("Electronアプリケーションのテスト実行が完了しました。");
  } catch (error) {
    logError("Electronアプリケーションのテスト実行中にエラーが発生しました:");
    console.error(error);
    process.exit(1);
  }
}

// メイン処理
function main() {
  logInfo("===== Electronアプリケーションのテスト =====");

  // 必要なファイルの存在チェック
  checkRequiredFiles();

  // アイコンファイルの存在チェック
  checkIconFiles();

  // Electronアプリケーションのテスト実行
  testElectronApp();
}

// スクリプトを実行
main();

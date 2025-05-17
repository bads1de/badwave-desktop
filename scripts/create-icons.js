const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// アイコン変換に必要なパッケージをインストール
console.log('アイコン変換に必要なパッケージをインストールしています...');
try {
  execSync('npm install --save-dev sharp png2icons');
  console.log('パッケージのインストールが完了しました。');
} catch (error) {
  console.error('パッケージのインストールに失敗しました:', error);
  process.exit(1);
}

// モジュールを読み込み
const sharp = require('sharp');
const png2icons = require('png2icons');

// パスの設定
const SVG_PATH = path.join(__dirname, '../public/logo.svg');
const PNG_PATH = path.join(__dirname, '../public/logo.png');
const ICO_PATH = path.join(__dirname, '../public/logo.ico');
const ICNS_PATH = path.join(__dirname, '../public/logo.icns');

// SVGをPNGに変換（高解像度）
async function convertSvgToPng() {
  console.log('SVGをPNGに変換しています...');
  try {
    // 1024x1024の高解像度PNGを生成
    await sharp(SVG_PATH)
      .resize(1024, 1024)
      .png()
      .toFile(PNG_PATH);
    console.log(`PNGファイルを作成しました: ${PNG_PATH}`);
    return true;
  } catch (error) {
    console.error('SVGからPNGへの変換に失敗しました:', error);
    return false;
  }
}

// PNGをICOに変換
function convertPngToIco(pngBuffer) {
  console.log('PNGをICOに変換しています...');
  try {
    const icoBuffer = png2icons.createICO(pngBuffer, png2icons.BILINEAR, false);
    if (icoBuffer) {
      fs.writeFileSync(ICO_PATH, icoBuffer);
      console.log(`ICOファイルを作成しました: ${ICO_PATH}`);
      return true;
    }
    return false;
  } catch (error) {
    console.error('PNGからICOへの変換に失敗しました:', error);
    return false;
  }
}

// PNGをICNSに変換
function convertPngToIcns(pngBuffer) {
  console.log('PNGをICNSに変換しています...');
  try {
    const icnsBuffer = png2icons.createICNS(pngBuffer, png2icons.BILINEAR, false);
    if (icnsBuffer) {
      fs.writeFileSync(ICNS_PATH, icnsBuffer);
      console.log(`ICNSファイルを作成しました: ${ICNS_PATH}`);
      return true;
    }
    return false;
  } catch (error) {
    console.error('PNGからICNSへの変換に失敗しました:', error);
    return false;
  }
}

// メイン処理
async function main() {
  try {
    // SVGをPNGに変換
    const svgToPngSuccess = await convertSvgToPng();
    if (!svgToPngSuccess) {
      console.error('アイコン変換プロセスを中止します。');
      process.exit(1);
    }

    // PNGファイルを読み込み
    const pngBuffer = fs.readFileSync(PNG_PATH);

    // PNGをICOに変換
    const pngToIcoSuccess = convertPngToIco(pngBuffer);
    if (!pngToIcoSuccess) {
      console.error('ICOファイルの作成に失敗しました。');
    }

    // PNGをICNSに変換
    const pngToIcnsSuccess = convertPngToIcns(pngBuffer);
    if (!pngToIcnsSuccess) {
      console.error('ICNSファイルの作成に失敗しました。');
    }

    console.log('アイコン変換プロセスが完了しました。');
  } catch (error) {
    console.error('アイコン変換プロセス中にエラーが発生しました:', error);
    process.exit(1);
  }
}

// スクリプトを実行
main();

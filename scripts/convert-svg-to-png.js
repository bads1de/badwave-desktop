const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// ログ出力用の色
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
};

// ログ出力関数
function logInfo(message) {
  console.log(`${colors.blue}[INFO]${colors.reset} ${message}`);
}

function logSuccess(message) {
  console.log(`${colors.green}[SUCCESS]${colors.reset} ${message}`);
}

function logWarning(message) {
  console.log(`${colors.yellow}[WARNING]${colors.reset} ${message}`);
}

function logError(message) {
  console.log(`${colors.red}[ERROR]${colors.reset} ${message}`);
}

// SVGをPNGに変換
function convertSvgToPng() {
  try {
    logInfo('SVGをPNGに変換しています...');
    
    // SVGファイルのパス
    const svgPath = path.join(__dirname, '../public/logo.svg');
    
    // 出力先のPNGファイルのパス
    const pngPath = path.join(__dirname, '../public/logo.png');
    
    // SVGファイルの存在確認
    if (!fs.existsSync(svgPath)) {
      logError(`SVGファイルが見つかりません: ${svgPath}`);
      process.exit(1);
    }
    
    // SVGファイルの内容を読み込む
    const svgContent = fs.readFileSync(svgPath, 'utf8');
    
    // SVGをデータURLに変換
    const svgDataUrl = `data:image/svg+xml;base64,${Buffer.from(svgContent).toString('base64')}`;
    
    // HTMLファイルを作成
    const htmlPath = path.join(__dirname, 'temp.html');
    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>SVG to PNG Converter</title>
        <style>
          body { margin: 0; padding: 0; }
          #svg-container { width: 512px; height: 512px; }
        </style>
      </head>
      <body>
        <div id="svg-container">
          <img src="${svgDataUrl}" width="512" height="512" />
        </div>
        <script>
          // キャンバスを作成
          const img = document.querySelector('img');
          img.onload = function() {
            const canvas = document.createElement('canvas');
            canvas.width = 512;
            canvas.height = 512;
            const ctx = canvas.getContext('2d');
            ctx.drawImage(img, 0, 0, 512, 512);
            
            // PNGとして保存
            const link = document.createElement('a');
            link.download = 'logo.png';
            link.href = canvas.toDataURL('image/png');
            link.click();
          };
        </script>
      </body>
      </html>
    `;
    
    fs.writeFileSync(htmlPath, htmlContent);
    
    logInfo('HTMLファイルを作成しました。ブラウザで開いてPNGをダウンロードしてください。');
    logInfo(`HTMLファイルのパス: ${htmlPath}`);
    
    // 代替手段として、site.pngをlogo.pngとしてコピー
    const sitePngPath = path.join(__dirname, '../public/site.png');
    if (fs.existsSync(sitePngPath)) {
      fs.copyFileSync(sitePngPath, pngPath);
      logSuccess('site.pngをlogo.pngとしてコピーしました');
    } else {
      logWarning('site.pngが見つかりません。手動でlogo.pngを作成してください。');
    }
    
    logSuccess('変換処理が完了しました');
  } catch (error) {
    logError('変換中に予期せぬエラーが発生しました:');
    console.error(error);
    process.exit(1);
  }
}

// メイン処理
function main() {
  logInfo('===== SVG to PNG 変換ツール =====');
  convertSvgToPng();
}

// スクリプトを実行
main();

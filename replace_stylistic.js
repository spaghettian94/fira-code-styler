const promisify = require('util').promisify;
const fs = require('fs');

const exec = promisify(require('child_process').exec);
const TTXObject = require('./ttx_object');

if (process.argv.length < 3) {
  console.log('usage: $ node replace_stylistic.js {fontfile.ttf / fontfile.otf}');
  process.exit(0);
}

// ファイル名
const originFilePath = process.argv[2];
const originFileName = originFilePath.split('/').pop();

const originFileType = originFileName.replace(/^.*\.(.+)$/, '$1').toLowerCase();
const fontFileName = originFileName.replace(/^(.+)\..+$/, '$1');

const ttxFilePath = `./temp/${fontFileName}`;
const outputPath = originFilePath.replace(/^.*\/(.+)$/, './outputs/$1');

main();

async function main() {
  // TTXファイル生成
  const commandDecompile = `ttx -f -t CFF -o ${ttxFilePath}.ttx ${originFilePath}`;
  //commandDecompile = `ttx -f -t glyf -o ${ttxFilePath}.ttx ${originFilePath}`
  await exec(commandDecompile)
    .then(({stdout, stderr}) => {
      console.log(commandDecompile);
      console.log(stdout, stderr);
    })
    .catch((error) => {
      console.log(error);
      process.exit(1);
    });
  
  // TTXファイル読込
  let ttxContent = fs.readFileSync(`${ttxFilePath}.ttx`) + '';
  ttxContent = ttxContent.replace(/\r/g, '').replace(/\uFEFF/g, '').replace(/\n*$/, '');

  const ttxObject = new TTXObject(ttxContent, originFileType);
  await ttxObject.ready;
  
  // 文字の置き換え
  enableStylisticSet01(ttxObject);
  enableStylisticSet02(ttxObject);
  enableStylisticSet19(ttxObject);
  
  // JSONデータをXML書式に書き戻し～TTXファイルに保存
  ttxContent = await ttxObject.toString();
  fs.writeFileSync(`${ttxFilePath}_new.ttx`, ttxContent);
  
  // 変更したTTXファイルと元フォントを合成
  const commandCompile = `ttx -o ${outputPath} -m ${originFilePath} ${ttxFilePath}_new.ttx`;
  await exec(commandCompile)
  .then(({stdout, stderr}) => {
    console.log(commandCompile);
    console.log(stdout, stderr);
  })
  .catch((error) => {
    console.log(error);
    process.exit(1);
  });
}

// ss01 rの字形を置き換える
function enableStylisticSet01(ttxObject) {
  const glyphs = ttxObject.getGlyphs(['r', 'r.ss01']);

  glyphs['r'].$.name = 'r.ss01';
  glyphs['r.ss01'].$.name = 'r';

  ttxObject.setGlyphs(glyphs);
}

// ss02 >= <= を数式記号に近い形にする
function enableStylisticSet02(ttxObject) {
  const glyphs = ttxObject.getGlyphs([
    'greater_equal.liga',
    'greater_equal.ss02',
    'less_equal.liga',
    'less_equal.ss02'
  ]);

  glyphs['greater_equal.liga'].$.name = 'greater_equal.ss02';
  glyphs['greater_equal.ss02'].$.name = 'greater_equal.liga';

  glyphs['less_equal.liga'].$.name = 'less_equal.ss02';
  glyphs['less_equal.ss02'].$.name = 'less_equal.liga';

  ttxObject.setGlyphs(glyphs);
}

// zero, ss19 スラッシュゼロからドットゼロに置換
function enableStylisticSet19(ttxObject) {
  const glyphs = ttxObject.getGlyphs([
    'zero',
    'zero.zero',
    'zero.tosf',
    'zero.tosf.zero',
    'zero.zero.tosf'
  ]);

  // 通常スタイル数字の置換
  glyphs['zero'].$.name = 'zero.zero';
  glyphs['zero.zero'].$.name = 'zero';

  // 旧字体スタイル数字の置換
  glyphs['zero.zero.tosf'] = JSON.parse(JSON.stringify(glyphs['zero.tosf']));
  glyphs['zero.zero.tosf'].$.name = 'zero.zero.tosf';
  glyphs['zero.tosf.zero'].$.name = 'zero.tosf';
  glyphs['zero.tosf'].$.name = 'zero.tosf.zero';

  ttxObject.setGlyphs(glyphs);
}


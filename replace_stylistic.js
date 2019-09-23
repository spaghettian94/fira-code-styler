var fs = require('fs');
var exec = require('child_process').exec;
var { Parser, Builder } = require('xml2js');

if (process.argv.length < 3) {
  console.log('usage: $ node replace_stylistic.js {fontfile.ttf / fontfile.otf}');
  process.exit(0);
}

// ファイル名
const originFilePath = process.argv[2];
const originFileName = originFilePath.replace(/^.*\/(.+)\..+$/, '$1');
const ttxFilePath = `./temp/${originFileName}`;
const outputPath = originFilePath.replace(/^.*\/(.+)$/, './outputs/$1');

// TTXファイル生成
const commandDecompile = `ttx -f -x CFF -o ${ttxFilePath}.ttx ${originFilePath}`;
exec(commandDecompile, async (err, stdout, stderr) => {
  console.log(commandDecompile);
  console.log(stdout, stderr);

  // TTXファイル読込
  let ttxContent = fs.readFileSync(`${ttxFilePath}.ttx`) + '';
  ttxContent = ttxContent.replace(/\r/g, '').replace(/\uFEFF/g, '').replace(/\n*$/, '');

  // XML書式からJSONデータに加工
  const parser = new Parser();
  const ttxObject = await parser.parseStringPromise(ttxContent);

  // 文字の置き換え
  enableStylisticSet01(ttxObject);

  // JSONデータをXML書式に書き戻し～TTXファイルに保存
  const builder = new Builder();
  ttxContent = builder.buildObject(ttxObject);
  fs.writeFileSync(`${ttxFilePath}_new.ttx`, ttxContent);

  // 変更したTTXファイルと元フォントを合成
  const commandCompile = `ttx -o ${outputPath} -m ${originFilePath} ${ttxFilePath}_new.ttx`;
  exec(commandCompile, function(err, stdout, stderr){
    console.log(commandCompile);
    console.log(stdout+stderr);
  });
});

function getCharStrings(ttxObject) {
  try {
    return ttxObject.ttFont.CFF[0].CFFFont[0].CharStrings[0].CharString;
  } catch (err) {
    console.log("TTX File Parsing Error");
  }
}

// ss01 rの字形を置き換える
function enableStylisticSet01(ttxObject) {
  const charStrings = getCharStrings(ttxObject);

  charStrings.forEach((item) => {
    if (item.$.name === 'r') {
      item.$.name = 'r.ss01';
      return;
    }
    if (item.$.name === 'r.ss01') {
      item.$.name = 'r';
      return;
    }
  });
}

var fs = require('fs');
var exec = require('child_process').exec;

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

  // TTXファイルに保存
  fs.writeFileSync(`${ttxFilePath}_new.ttx`, ttxContent);

  // 変更したTTXファイルと元フォントを合成
  const commandCompile = `ttx -o ${outputPath} -m ${originFilePath} ${ttxFilePath}_new.ttx`;
  exec(commandCompile, function(err, stdout, stderr){
    console.log(commandCompile);
    console.log(stdout+stderr);
  });
});
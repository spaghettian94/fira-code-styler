const { Parser, Builder } = require('xml2js');

module.exports = class TTXObject {
  constructor(ttxContent, fontType) {
    this.ready = this.parse(ttxContent);

    // フォント拡張子を保存
    this.type = fontType.toLowerCase();
  }

  async parse(content) {
    // XML書式からJSONデータに加工
    const parser = new Parser();
    this.object = await parser.parseStringPromise(content);
  }

  async toString() {
    const builder = new Builder();
    return await builder.buildObject(this.object);
  }

  get glyphSet() {
    try {
      if (this.type === 'otf') return this.object.ttFont.CFF[0].CFFFont[0].CharStrings[0].CharString;
    } catch (err) {
      console.log("TTX File Parsing Error");
    }
    return null;
  }

  getGlyphs(names) {
    return names.reduce((acc, name) => {
      acc[name] = this.getGlyph(name);
      return acc
    }, {}); 
  }

  getGlyph(name) {
    return this.glyphSet.find((item) => item.$.name === name);
  }

  setGlyphs(glyphs) {
    Object.keys(glyphs).forEach((key) => this.setGlyph(glyphs[key]));
  }

  setGlyph(glyph) {
    this.glyphSet.some((item, index) => {
      if (item.$.name !== glyph.$.name) return false;
      this.glyphSet[index] = glyph;
      return true;
    });
  }
}
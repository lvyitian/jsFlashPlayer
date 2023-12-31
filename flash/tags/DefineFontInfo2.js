class DefineFontInfo2 extends genericTag{
	read(){
		let o = {};

		o.fontID = this.read_UI16();

		if(!this.core.dictionary.has(o.fontID)){
			let m='error, font_id "'+o.fontID+'" not found in dictianary';
			console.log(m);
			alert(m);
			return false;
		}

		let len=this.read_UI8();
		let decoder = new TextDecoder('utf-8');
		o.fontName = decoder.decode(this.read_sub_array(len));

		let t=this.read_UI8();
		
		o.fontFlagsSmallText = (t&0b00100000)>0;
		o.fontFlagsShiftJIS = (t&0b00010000)>0;
		o.fontFlagsANSI = (t&0b00001000)>0;
		o.fontFlagsItalic = (t&0b00000100)>0;
		o.fontFlagsBold = (t&0b00000010)>0;
		o.fontFlagsWideCodes = (t&0b00000001)>0;

		o.languageCode = this.read_UI8();		

		o.codeTable = [];

		while(this.cur < this.raw_data.length){
			o.codeTable.push(this.read_UI16());
		}

		let font = this.core.dictionary.get(o.fontID);

		font.set_font_info(o);
		return true;
	}
}

tag_list[62] = DefineFontInfo;
class DefineText extends genericTag{
	read(){
		let o = {};

		o.characterID = this.read_UI16();
		o.textBounds = this.read_RECT();

		o.textMatrix = this.read_MATRIX();

		o.glyphBits = this.read_UI8();
		o.advanceBits = this.read_UI8();

		this.glyphBits = o.glyphBits;
		this.advanceBits = o.advanceBits;

		o.textRecords = [];

		let rec;
		while(rec = this.read_TEXTRECORD()){
			o.textRecords.push(rec);
		}

		//console.log(o.textRecords);
		
		
		let t = new Text(this.header.code, o, this.core);

		this.core.dictionary.add(o.characterID,t);
		return true;
	}

	read_TEXTRECORD(define_text2=false){

		let o = {};
		let t = this.read_UI8();

		if(t==0)
			return false;

		if(((t>>4)&0b1111) != 0b1000){
			console.log('error reading TEXTRECORD');
			console.log(this.read_sub_array(this.raw_data.length - this.cur));
			this.error=true;
			return false;
		}
		

		o.styleFlagsHasFont    = (t&0b1000) > 0;
		o.styleFlagsHasColor   = (t&0b0100) > 0;
		o.styleFlagsHasYOffset = (t&0b0010) > 0;
		o.styleFlagsHasXOffset = (t&0b0001) > 0;

		if(o.styleFlagsHasFont){
			o.fontID = this.read_UI16();
		}
		if(o.styleFlagsHasColor){
			if(define_text2){
				o.textColor = this.read_RGBA();
			}else{
				o.textColor = this.read_RGB();
			}
		}

		if(o.styleFlagsHasXOffset){
			o.xOffset = this.read_SI16();
		}

		if(o.styleFlagsHasYOffset){
			o.yOffset = this.read_SI16();
		}

		if(o.styleFlagsHasFont){
			o.textHeight = this.read_UI16();
		}

		o.glyphCount = this.read_UI8();

		o.glyphEntries = [];

		t = {shift:0};
		for(let i=0;i<o.glyphCount;i++){
			let g = {};
			t = this.read_UB(t.shift,this.glyphBits);
			g.glyphIndex = t.value;

			t = this.read_UB(t.shift,this.advanceBits);
			g.glyphAdvance = t.value;


			o.glyphEntries.push(g);
		}
		if(t.shift>0)
			this.cur++;

		//console.log(o);
		//console.log('byte:',this.read_UI8());
		return o;
	}

}

tag_list[11] = DefineText;
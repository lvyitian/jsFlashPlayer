

class DefineFont2 extends DefineShape{
	read(){
		let o = {};
		
		o.fontID = this.read_UI16();
		
		let t=this.read_UI8();
		
		o.fontFlagsHasLayout  = (t&0b10000000) > 0;
		o.fontFlagsShiftJIS  = (t&0b01000000) > 0;
		o.fontFlagsSmallText  = (t&0b00100000) > 0;
		o.fontFlagsANSI  = (t&0b00010000) > 0;
		o.fontFlagsWideOffsets  = (t&0b00001000) > 0;
		o.fontFlagsWideCodes  = (t&0b00000100) > 0;
		o.fontFlagsItalic  = (t&0b00000010) > 0;
		o.fontFlagsBold  = (t&0b00000001) > 0;
	    
		o.languageCode = this.read_UI8();
		
		let len=this.read_UI8();
		let decoder = new TextDecoder('utf-8');
		o.fontName = decoder.decode(this.raw_data.slice(this.cur,this.cur+len));
		this.cur+=len;
		
		o.numGlyphs = this.read_UI16();
		o.offsetTable =[];
		
		for(let i=0;i<o.numGlyphs;i++){
			if(o.fontFlagsWideOffsets){
				o.offsetTable.push(this.read_UI32());
			}else{
				o.offsetTable.push(this.read_UI16());
			}
        }
        
        if(o.fontFlagsWideOffsets){
            o.codeTableOffset = this.read_UI32();
        }else{
        	o.codeTableOffset = this.read_UI16();
        }
        
        
        this.set_constants();
        
	    t=this.read_ShapeRecords(false, true);
	    if(t===false)
	        return false;
	
		o.glyphShapeTable = t;
		//debug.obj(t);
		
		o.codeTable = [];
		
		for(let i=0;i<o.numGlyphs;i++){
			if(o.fontFlagsWideCodes){
				o.codeTable.push(this.read_UI16());
			}else{
				o.codeTable.push(this.read_UI8());
			}
		}
		
		if(o.fontFlagsHasLayout){
			o.fontAscent = this.read_SI16();
			o.fontDescent = this.read_SI16();
			o.fontLeading = this.read_SI16();
			
			o.fontAdvanceTable = [];
			for(let i=0;i<o.numGlyphs;i++){
				o.fontAdvanceTable.push(this.read_SI16());
			}
			
			o.fontBoundsTable = [];
			for(let i=0;i<o.numGlyphs;i++){
				o.fontBoundsTable.push(this.read_RECT());
			}
			
			o.kerningCount = this.read_UI16();
			if(o.kerningCount>0){
				let m = 'TODO: read font kerning table';
				console.log(m);
				alert(m);
				return  false;
			}
		}
		//debug.obj(o,false);
		
		o.type=this.header.code;
		t = new Font(this.core,o);
		
		this.core.dictionary.add(o.fontID, t);
	    

		//debug.obj(t.data);
		//console.log(t.data.fontID);
		return true;
		
	}
}
	

class DefineEditText extends genericTag{
	read(){
		let o = {};
		
		o.characterID = this.read_UI16();
		o.bounds = this.read_RECT();
		
		let t=this.read_UI8();
		
		o.hasText = (t&0b10000000)>0;
		o.wordWrap = (t&0b1000000)>0;
		o.multiline = (t&0b100000)>0;
		o.password = (t&0b10000)>0;
		o.readOnly = (t&0b1000)>0;
		o.hasTextColor = (t&0b100)>0;
		o.hasMaxLength = (t&0b10)>0;
		o.hasFont = (t&0b1)>0;
		
		t = this.read_UI8();
		
		o.hasFontClass = (t&0b10000000)>0;
		o.autoSize = (t&0b1000000)>0;
		o.hasLayout = (t&0b100000)>0;
		o.noSelect = (t&0b10000)>0;
		o.border = (t&0b1000)>0;
		o.wasStatic = (t&0b100)>0;
		o.HTML = (t&0b10)>0;
		o.useOutlines = (t&0b1)>0;
		
		if(o.hasFont){
			o.fontID = this.read_UI16();
		}
		if(o.hasFontClass){
			o.fontClass = this.read_STRING();
		}
		
		if(o.hasFont){
			o.fontHeight = this.read_UI16();
		}

		if(o.hasTextColor){
			o.textColor = this.read_RGBA();
		}

		if(o.hasMaxLength){
			o.maxLength = this.read_UI16();
		}

		if(o.hasLayout){
			o.align = this.read_UI8();
			o.leftMargin = this.read_UI16();
			o.rightMargin = this.read_UI16();
			o.indent = this.read_UI16();
			o.leading = this.read_UI16();
		}

		o.variableName = this.read_STRING();

		if(o.hasText){
			o.initialText = this.read_STRING();
		}

		this.core.dictionary.add(o.characterID,o)
		return true;
	}
}
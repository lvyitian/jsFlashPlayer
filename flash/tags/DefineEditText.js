
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
		
		debug.obj(o);
		return false;
	}
}
class Font {
	constructor(core,data){
		this.core = core;
		this.data = data;
		this.type = data.type;

		this.font_info = null;
		
	}
	
	set_font_info(font_info){
		this.font_info = font_info;
	}

	get_shape(index){
		//console.log(this.data);
		return this.data.glyphShapeTable[index];
	}
}
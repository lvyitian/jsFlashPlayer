class DefineFontName extends genericTag{
	read(){
		let obj = {};

		obj.fontID = this.read_UI16();

		if(!this.core.dictionary.has(obj.fontID)){
			console.error('element '+obj.fontID+" was not found in dictionary!");
			return false;
		}

		obj.fontName = this.read_STRING();
		obj.fontCopyright = this.read_STRING();

		let font = this.core.dictionary.get(obj.fontID);
		font.font_name = obj;
		return true;
	}
}

tag_list[88] = DefineFontName;
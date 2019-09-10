class DefineBitsLossless extends genericTag{

	read(){
		let obj = {};

		obj.type = this.header.code;

		obj.characterID = this.read_UI16();
		if(this.core.dictionary.has(obj.characterID))
			return true;

		obj.bitmapFormat = this.read_UI8();

		obj.bitmapWidth = this.read_UI16();
		obj.bitmapHeight = this.read_UI16();

		if(obj.bitmapFormat==3){ //8-bit colormapped image
			obj.bitmapColorTableSize = this.read_UI8();
		}
		let data;
		try {
			data = this.core.pako.inflate(this.read_sub_array(this.raw_data.length-this.cur));
		} catch(e) {
			// statements
			console.log(e);
			return false;
		}
		
		data = new FlashParser(data);

		if(obj.bitmapFormat==3){ //8-bit colormapped image
			let colors = [];
			for(let i=0; i<=obj.bitmapColorTableSize; i++){
				colors.push(data.read_RGB());
			}
			let w = obj.bitmapWidth;
			let h = obj.bitmapHeight;
			let image = new Uint8ClampedArray(w*h*4);
			for(let i=0;i<w*h;i++){
				let color = data.read_UI8();
				image[i*4+0] = colors[color].r;
				image[i*4+1] = colors[color].g;
				image[i*4+2] = colors[color].b;
				image[i*4+3] = 255;
			}
			image = this.core.bug_create_image_from_array(image,w,h);
			obj.image = image;
		}else{
			console.log("TODO: reading 15-bit RGB and 24-bit rgb!");
			alert("TODO: reading 15-bit RGB and 24-bit rgb");
			return false;
		}

		//console.log(obj);

		this.core.dictionary.add(obj.characterID, obj);
		return true;
	}
}
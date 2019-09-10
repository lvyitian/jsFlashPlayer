class DefineBitsLossless2 extends genericTag{
	read(){
		let o={};

		o.characterID = this.read_UI16();
		o.bitmapFormat = this.read_UI8(); // 3 = 8-bit colormapped image / 5 = 32-bit ARGB

		o.bitmapWidth = this.read_UI16();
		o.bitmapHeight = this.read_UI16();

		if(o.bitmapFormat == 3){
			o.bitmapColorTableSize = this.read_UI8()+1;
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

		if(o.bitmapFormat==3){
			let colors = [];

			for(let i=0;i<o.bitmapColorTableSize;i++){
				colors.push(data.read_RGBA());
			}

			let w = o.bitmapWidth;
			let h = o.bitmapHeight;
			let image = new Uint8ClampedArray(w*h*4);

			for(let i=0;i<w*h;i++){
				let color = data.read_UI8();
				image[i*4+0] = colors[color].r;
				image[i*4+1] = colors[color].g;
				image[i*4+2] = colors[color].b;
				image[i*4+3] = colors[color].a;
			}
			image = this.core.bug_create_image_from_array(image,w,h);
			o.image = image;
			//debug.stop();
			//let c=this.core.canvas.getContext('2d');
			//c.drawImage(image,0,0);
			//this.core.save_blob(o.image.src);

		}else{
			let m="Reading 32-bit ARGB image!";
			console.log(m);
			alert(m);
			return false;
		}

		this.core.dictionary.add(o.characterID, o);
		return true;
	}
}

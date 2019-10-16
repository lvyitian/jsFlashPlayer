class DefineBitsLossless2 extends genericTag{
	read(){
		let o={};

		o.characterID = this.read_UI16();
		if(this.core.dictionary.has(o.characterID))
			return true;
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

			let w = this.align_width(o.bitmapWidth);
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

			/*if(![
					10,12,14,16,18,20,22,24,26,28,30,32,34,36,38,40,42,44,46,48,50,52,54,56,58,60,62,
					65,67,69,71,
					74,76,78,80,82,84,
					100,102,104,106,108,110,112,114,116,118,120,122,124,126,128,130,132,134,136,138,
					141,143,145,147,149,151,153,155,157,159,161,
					164,166,168,170,172,174,176,178,180,182,184,186,188,190,192,194,
					197,199,201
				].includes(o.characterID)){
				console.log(o);
				this.debug_img(image, this.core);
				return false;
			}*/
			//debug.stop();
			//let c=this.core.canvas.getContext('2d');
			//c.drawImage(image,0,0);
			//this.core.save_blob(o.image.src);

		}else{
			let w = o.bitmapWidth;
			let h = o.bitmapHeight;

			let image = new Uint8ClampedArray(w*h*4);

			for(let i=0;i<w*h;i++){
				image[i*4+3] = data.read_UI8();
				image[i*4+0] = data.read_UI8();
				image[i*4+1] = data.read_UI8();
				image[i*4+2] = data.read_UI8();
			}

			image = this.core.bug_create_image_from_array(image,w,h);
			o.image = image;
		}

		this.core.dictionary.add(o.characterID, o);
		if(!o.image.complete){
			//console.log('image not loaded!');
			let core = this.core;
			o.image.onload = function(){
				//console.log('image loaded!');
				core.continue_processing();
			}
			return false;
		}
		return true;
	}

	align_width(width){
		while((width&3)>0){
			width++;
		}
		return width;
	}

	debug_img(img,core){
		core.ctx.setTransform(1,0,0,1,0,0);
		console.log('debug draw');
		if(!img.complete){
			console.log('not loaded');
			img.onload = function(){
				console.log('loaded');
				core.ctx.drawImage(img,0,0);
			}
		}else{
			core.ctx.drawImage(img,0,0);
		}

	}
}

tag_list[36] = DefineBitsLossless2;
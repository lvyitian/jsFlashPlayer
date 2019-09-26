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
			let w = this.align_width(obj.bitmapWidth);
			let h = obj.bitmapHeight;
			let image = new Uint8ClampedArray(w*h*4);
			for(let i=0;i<w*h;i++){
				let color_id = data.read_UI8();
				if(color_id>=colors.length){
					/*console.log('error, color_id is larger than colors array!');
					console.log(color_id,colors);
					return false;*/
					color_id = colors.length-1;
				}
				let color = colors[color_id];

				image[i*4+0] = color.r;
				image[i*4+1] = color.g;
				image[i*4+2] = color.b;
				image[i*4+3] = 255;
			}
			image = this.core.bug_create_image_from_array(image,w,h);
			obj.image = image;
			/*if(![
					87,89,91,93,95,97
				].includes(obj.characterID)){
				console.log(obj);
				this.debug_img(image, this.core);
				return false;
			}*/

		}else if(obj.bitmapFormat==5){ //24-bit format
			let w = this.align_width(obj.bitmapWidth);
			let h = obj.bitmapHeight;

			let image = new Uint8ClampedArray(w*h*4);
			for(let i=0;i<w*h;i++){
				let t = data.read_UI8();
				image[i*4+0] = data.read_UI8();
				image[i*4+1] = data.read_UI8();
				image[i*4+2] = data.read_UI8();
				image[i*4+3] = 255;
			}

			image = this.core.bug_create_image_from_array(image,w,h);
			obj.image = image;

			//this.debug_img(image, this.core);

		}else {	
			console.log("TODO: reading 15-bit RGB!");
			console.log(obj);
			alert("TODO: reading 15-bit RGB");
			return false;
		}

		//console.log(obj);

		this.core.dictionary.add(obj.characterID, obj);

		if(!obj.image.complete){
			console.log('image not loaded!');
			let core = this.core;
			obj.image.onload = function(){
				console.log('image loaded!');
				core.continue_processing();
			}
			return false;
		}
		return true;
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

	align_width(width){
		while((width&3)>0){
			width++;
		}
		return width;
	}
}
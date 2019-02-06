"use strict";

class Dictionary{
	constructor(core){
		this.dict = [];
		this.core = core;

		//constants or some like them
		this.TypeVideoStream = 60;
	}

	add(characterID, object){
		this.dict[characterID] = object;
	}

	get(characterID){
		return this.dict[characterID];
	}

	draw(ctx,characterID,ratio){
		let el = this.dict[characterID];
		//console.log(el);
		switch (el.type) {
			case this.TypeVideoStream:

				if(el.codecID!=2){
					alert("TODO: Draw VideoStream codecID:"+el.codecID);
					return false;
				}

				if(el.img_data === undefined){
					el.img_data = ctx.createImageData(el.width,el.height);


					let canvas = document.createElement('canvas');
					let context = canvas.getContext('2d');
					let img = document.getElementById('myimg');
					canvas.width = el.width;
					canvas.height = el.height;
					el.context=context;
				}

				let imdat = Libav.decode_frame(el.frames[ratio],el.width,el.height);
				if(imdat===false)
					return false;
				
				let imd = el.context.createImageData(el.width,el.height);
				try {
					imd.data.set(imdat);
				} catch(e) {
					// statements
					console.log('exception:',e.message, e.name, e.type);
					return false;
				}
				
				console.log(imd);





				//el.img_data.data.set(imdat);

				ctx.putImageData(el.img_data,0,0);

				break;
			default:
				alert("TODO: Draw character "+el.type);
				return false;
		}

		return true;
	}
}
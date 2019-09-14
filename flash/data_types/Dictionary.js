"use strict";

class Dictionary{
	constructor(core){
		this.dict = [];
		this.core = core;

		//constants or some like them
		this.TypeShape = 2;
		this.TypeBitsLossless = 20;
		this.TypeVideoStream = 60;
	}

	add(characterID, object){
		if(characterID in this.dict)
			return false;
		this.dict[characterID] = object;
		return true;
	}

	get(characterID){
		return this.dict[characterID];
	}

	has(characterID){
		return characterID in this.dict;
	}

	draw(ctx,characterID,ratio,matrix){
		let el = this.dict[characterID];
		if(!el){
			console.log("Character #"+characterID+' not found!');
			console.log(el);
			return false;
		}
		//console.log(el);
		switch (el.type) {
			case this.TypeVideoStream:

				if(el.codecID!=2){
					alert("TODO: Draw VideoStream codecID:"+el.codecID);
					return false;
				}

				if(ratio==undefined){
					console.log((new Error()).stack);
					return false;
				}
				let imdat = false;
				if(el.frames[ratio]==undefined){
					if(el.last_frame)
						imdat = el.last_frame;
				}else{
					imdat = Libav.decode_frame(el.frames[ratio],el.width,el.height);
				}
				if(imdat===false){
					console.log('len:',el.frames.length);
					console.log('ratio:',ratio);
					console.log('frame:',el.frames);
					return false;
				}

				el.last_frame = imdat;

				var d1 = new Date();

				//workaround a bug
				let obj = {
					canvas_id : this.core.canvas.id,
					bitmap  : imdat,
					width	: el.width,
					height	: el.height
				}
				window.wrappedJSObject.__flashplayer_draw_data=cloneInto(obj,window);
				let script = document.createElement('script');
				script.innerHTML='__flashplayer_draw_bitmap_on_canvas();';
				document.head.appendChild(script);
    			script.remove();

    			/*var d2 = new Date();
		        console.log("drawing on canvas time:",(d2-d1));
		        var d2 = d1;*/
		        
				//return false;
				/*let imd = ctx.createImageData(el.width,el.height);
				imd.data.set(imdat);
				console.log(imd);
				ctx.putImageData(el.img_data,0,0);*/

			break;

			/*case this.TypeShape:
				return el.draw();
			break;*/
			default:

				if('draw' in el){
					return el.draw(matrix);
				}

				let m = "TODO: Draw character "+el.type + ' (' + el.constructor.name+') ';
				//alert(m);
				console.log(m);
				console.log(el);
				return false;
		}

		return true;
	}
}
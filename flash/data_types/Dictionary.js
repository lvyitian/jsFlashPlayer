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
				
				let imdat = Libav.decode_frame(el.frames[ratio],el.width,el.height);
				if(imdat===false)
					return false;
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

    			var d2 = new Date();
		        console.log("drawing on canvas time:",(d2-d1));
		        var d2 = d1;
		        
				//return false;
				/*let imd = ctx.createImageData(el.width,el.height);
				imd.data.set(imdat);
				console.log(imd);
				ctx.putImageData(el.img_data,0,0);*/

				break;
			default:
				alert("TODO: Draw character "+el.type);
				return false;
		}

		return true;
	}
}
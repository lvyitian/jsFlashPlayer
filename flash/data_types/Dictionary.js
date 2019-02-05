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

				let rgb_data = Libav.decode_frame(el.frames[ratio]);
				return false;

				break;
			default:
				alert("TODO: Draw character "+el.type);
				return false;
		}

		return true;
	}
}
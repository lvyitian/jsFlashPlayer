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
		//console.log('adding ',characterID,'to dictionary');
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

	draw(ctx,characterID,ratio,matrix,options){
		let el = this.dict[characterID];
		if(!el){
			console.error("Character #"+characterID+' not found!');
			console.log(el);
			return false;
		}

		if(!('set_draw_options' in el)){
			let m = "TODO: set_draw_options for character "+el.type + ' (' + el.constructor.name+') ';
			console.log(m);
			console.log(el);
			return false;
		}

		if(!el.set_draw_options(options)){
			return false;
		}

		if('draw' in el){
			el.ctx = ctx;
			return el.draw(matrix,ratio);
		}

		let m = "TODO: Draw character "+el.type + ' (' + el.constructor.name+') ';
		console.log(m);
		console.log(el);
		return false;
	}

	replace_core(new_core){
	    this.core = new_core;
		let ell = Object.keys(this.dict);
		for(let i=0;i<ell.length;i++){
		    let e = this.dict[ell[i]];
            e.core = new_core;
        }
	}
}
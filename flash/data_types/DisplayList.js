"use strict";

class DisplayList{
	constructor(canvas,dictionary,sprite_mode=false){
		this.list = [];

		this.canvas = canvas;
		this.dictionary = dictionary;
		this.sprite_mode = sprite_mode;
		this.core = dictionary.core;
		//this.parent_matrix = parent_matrix;

		this.background_color = 'white';

		this.ctx = canvas.getContext('2d');

		this.actions = [];

		//constants
		this.TYPE_PlaceObject2 = 26;
	}
	add(depth, object){
		this.list[depth] = object;
	}

	remove_by_depth(depth){
		delete this.list[depth];
	}

	add_actions(new_actions){
		this.actions.push(new_actions);
		//console.log(this.actions);
	}

	set_background_color(r,g,b){
		this.background_color="rgb("+r+","+g+","+b+")";
	}

	get_by_depth(depth){
		return this.list[depth];
	}

	draw(parent_matrix=null){

		if(this.actions.length){
			/*console.log('TODO: execute actions');
			console.log(this.actions);*/
			if(!this.core.avm.execute(this.actions)){
				console.log('fail to execute actions')
				return false;
			}
			this.actions.length=0;
		}

		//console.log(parent_matrix);
		//this.ctx.clearRect(0,0,this.canvas.width,this.canvas.height);
		if(!this.sprite_mode){
			this.ctx.setTransform(1,0,0,1,0,0);
			this.ctx.fillStyle = this.background_color;
			this.ctx.fillRect(0,0,this.canvas.width,this.canvas.height);
		}
		//console.log(this.list);
		for(let i=0;i<this.list.length;i++){
			let el = this.list[i];
			if(!el) continue;
			//console.log(el);
			switch (el.type) {
				case this.TYPE_PlaceObject2:
					if(el.hasClipActions){
						alert("TODO: DisplayList PlaceObject2 hasClipActions");
						return false;
					}
					if(el.hasClipDepth){
						alert("TODO: DisplayList PlaceObject2 hasClipDepth");
						return false;
					}
					if(el.hasColorTransform){
						alert("TODO: DisplayList PlaceObject2 hasColorTransform");
						return false;
					}
					
					//console.log('element:',el);*/
					let matrix = new DOMMatrix();
					if(el.matrix){
						let m = el.matrix.matrix;
						if(parent_matrix){
							matrix.multiplySelf(parent_matrix);
						}
						matrix.multiplySelf(m);
					}else{
						if(parent_matrix){
							matrix.multiplySelf(parent_matrix);
						}
					}
					
					this.ctx.setTransform(
						matrix.a, matrix.b, 
						matrix.c, matrix.d,
						matrix.e, matrix.f
					);
					
					/*if(el.ratio==1){
						console.log(parent_matrix);
						return false
					}*/
					//this.ctx.setTransform(1,0,0,1,300,0);
					//if(this.sprite_mode){
					/*	console.log(i);
						console.log(parent_matrix);
						console.log(el);
						console.log(matrix);
						*/
					//}
					if(!this.dictionary.draw(this.ctx,el.characterID,el.ratio, matrix)){
						console.log('dictionary draw fails!');
						console.log(this.list);
						console.log(this.dictionary);
						return false;
					}
					break;
				default:
					alert("TODO: Draw DisplayList type:"+el.type);
					return false;
			}
		}

		

		return true;
	}
}
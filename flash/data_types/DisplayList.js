"use strict";

class DisplayList{
	constructor(canvas,dictionary){
		this.list = [];

		this.canvas = canvas;
		this.dictionary = dictionary;

		this.background_color = 'white';

		this.ctx = canvas.getContext('2d');

		//constants
		this.TYPE_PlaceObject2 = 26;
	}
	add(depth, object){
		this.list[depth] = object;
	}

	set_background_color(r,g,b){
		this.background_color="rgb("+r+","+g+","+b+")";
	}

	get_by_depth(depth){
		return this.list[depth];
	}

	draw(){
		//this.ctx.clearRect(0,0,this.canvas.width,this.canvas.height);
		this.ctx.fillStyle = this.background_color;
		this.ctx.fillRect(0,0,this.canvas.width,this.canvas.height);
		for(let i=0;i<this.list.length;i++){
			let el = this.list[i];
			if(!el) continue;
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
					let scaleX = 1;
					let scaleY = 1;
					let rotate0 = 0;
					let rotate1 = 0;
					if(el.hasMatrix){
						if(el.matrix.has_scale){
							scaleX=el.matrix.scaleX;
							scaleY=el.matrix.scaleY;
						}
						if(el.matrix.has_rotate){
							rotate0 = el.matrix.rotateSkew0;
							rotate1 = el.matrix.rotateSkew1;
						}
					}
					//console.log('element:',el);
					this.ctx.setTransform(scaleX,rotate1,rotate0,scaleY,el.matrix.translateX,el.matrix.translateY);
					if(!this.dictionary.draw(this.ctx,el.characterID,el.ratio))
						return false;
					break;
				default:
					alert("TODO: Draw DisplayList type:"+el.type);
					return false;
			}
		}
		return true;
	}
}
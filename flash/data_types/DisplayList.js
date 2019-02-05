"use strict";

class DisplayList{
	constructor(canvas,dictionary){
		this.list = [];

		this.canvas = canvas;
		this.dictionary = dictionary;

		this.ctx = canvas.getContext('2d');
		this.ctx.fillStyle = "white";

		//constants
		this.TYPE_PlaceObject2 = 26;
	}
	add(depth, object){
		this.list[depth] = object;
	}

	draw(){
		//this.ctx.clearRect(0,0,this.canvas.width,this.canvas.height);
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
					if(el.hasMatrix){
						let scaleX = 1;
						let scaleY = 1;
						let rotate0 = 0;
						let rotate1 = 0;
						if(el.matrix.has_scale){
							scaleX=el.matrix.scaleX;
							scaleY=el.matrix.scaleY;
						}
						if(el.matrix.has_rotate){
							rotate0 = el.matrix.rotateSkew0;
							rotate1 = el.matrix.rotateSkew1;
						}
						this.ctx.setTransform(scaleX,rotate1,rotate0,scaleY,el.matrix.translateX,el.matrix.translateY);
					}
					if(!this.dictionary.draw(this.ctx,el.characterID,el.ratio))
						return false;
					break;
				default:
					alert("TODO: Draw DisplayList type:"+el.type);
					return false;
			}
		}
	}
}
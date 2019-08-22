class Shape{
	constructor(core, data){
		this.core = core;
		this.data = data;
		this.type = data.type;

		this.x = 0;
		this.y = 0;

		this.ctx = this.core.canvas.getContext('2d');

		this.FILLTYPE_SOLID_FILL = 0x00;
		this.FILLTYPE_LINEAR_GRADIENT_FILL = 0x10;
		this.FILLTYPE_RADIAL_GRADIENT_FILL = 0x12;
		this.FILLTYPE_FOCAL_RADIAL_GRADIENT_FILL = 0x13;
		this.FILLTYPE_REPEATING_BITMAP_FILL = 0x40;
		this.FILLTYPE_CLIPPED_BITMAP_FILL = 0x41;
		this.FILLTYPE_NON_SMOOTHED_REPEATING_BITMAP_FILL = 0x42;
		this.FILLTYPE_NON_SMOOTHED_CLIPPED_BITMAP_FILL = 0x43;
	}

	fill_path(fill_style, path){
		if(!fill_style)
			return true;

		//console.log(fill_style);
		this.ctx.beginPath();

		switch (fill_style.type) {
			case this.FILLTYPE_CLIPPED_BITMAP_FILL:{
				let matrix = fill_style.bitmapMatrix;
				if	(
						matrix.has_rotate || 
						matrix.translateX ||
						matrix.translateY ||
						!matrix.has_scale ||
						matrix.scaleX != 20 ||
						matrix.scaleY != 20
					){
					alert("TODO: wrong matrix for fill");
					console.log("wrong matrix for fill");
					return false;
				}
				let char_id = fill_style.bitmapId;
				let img = this.core.dictionary.get(char_id).image;
				let pattern = this.ctx.createPattern(img, 'no-repeat');
				this.ctx.fillStyle = pattern;

			}break;
			default:
				alert("TODO: Fill type:"+fill_style.type);
				console.log("TODO: Fill type:"+fill_style.type);
				return false;
				break;
		}

		for( let i=0; i< path.length ; i++){
			let e = path[i];
			//console.log(e);

			if(e.straightFlag){
				if(e.generalLineFlag){
					this.x+=e.deltaX;
					this.y+=e.deltaY;
				}else{
					if(e.vertLineFlag){
						this.y+=e.deltaY;
					}else{
						this.x+=e.deltaX;
					}
				}
				this.ctx.lineTo(this.x/20, this.y/20);
				//console.log('lineTo:',this.x/20,this.y/20);
			}else{
				alert("TODO: non straight edges");
				console.log("non straight edges");
				return false;
			}
		}

		this.ctx.fill();
		
		return true;
	}

	draw(){

		this.x=0;
		this.y=0;

		let shapes = this.data.shapes;

		for(let k=0; k<shapes.shapeRecords.length; k++){
			let shape = shapes.shapeRecords[k];

			let fill_0_edges = [];
			let fill_1_edges = [];

			let last_fill_0 = 0;
			let last_fill_1 = 0;

			this.x=0;
			this.y=0;			

			for(let i=0;i<shape.length;i++){
				let e = shape[i];

				if(e.typeFlag==0){ //move / change style
					if(e.stateFillStyle0){
						if(!this.fill_path(shapes.fillStyles[last_fill_0],fill_0_edges))
							return false;
						last_fill_0=e.fillStyle0;
						fill_0_edges = [];
					}
					if(e.stateFillStyle1){
						if(!this.fill_path(shapes.fillStyles[last_fill_1],fill_1_edges))
							return false;
						last_fill_1=e.fillStyle1;
						fill_1_edges = [];
					}
					if(e.stateLineStyle){
						console.log("TODO: change line style");
						alert("TODO: change line style");
						return false;
					}
					if(e.stateMoveTo){
						console.log("TODO: stateMoveTo");
						alert("TODO: stateMoveTo");
						return false;
					}
					if(e.stateNewStyles){
						console.log("TODO: stateNewStyles");
						alert("TODO: stateNewStyles");
						return false;
					}
				}else{
					if(last_fill_0!=0){
						fill_0_edges.push(e);
					}
					if(last_fill_1!=0){
						fill_1_edges.push(e);
					}
				}
			}

			if(!this.fill_path(shapes.fillStyles[last_fill_0], fill_0_edges))
				return false;
			if(!this.fill_path(shapes.fillStyles[last_fill_1], fill_1_edges))
				return false;
		}

		//console.log(this.data);

		return true;
	}
}

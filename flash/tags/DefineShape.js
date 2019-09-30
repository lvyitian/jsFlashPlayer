class DefineShape extends genericTag{

	constructor(core,data){
		super(core,data);
		this.set_constants();
	}
	
	set_constants(){
		if(this.constant_was_set != undefined)
			return;

		this.constant_was_set = true;

		this.FILLTYPE_SOLID_FILL = 0x00;
		this.FILLTYPE_LINEAR_GRADIENT_FILL = 0x10;
		this.FILLTYPE_RADIAL_GRADIENT_FILL = 0x12;
		this.FILLTYPE_FOCAL_RADIAL_GRADIENT_FILL = 0x13;
		this.FILLTYPE_REPEATING_BITMAP_FILL = 0x40;
		this.FILLTYPE_CLIPPED_BITMAP_FILL = 0x41;
		this.FILLTYPE_NON_SMOOTHED_REPEATING_BITMAP_FILL = 0x42;
		this.FILLTYPE_NON_SMOOTHED_CLIPPED_BITMAP_FILL = 0x43;
	}

	read_FILLSTYLEARRAY(shape3mode){
		this.set_constants();
		let obj = [];
		obj.push(null);
		let count = this.read_UI8();
		//console.log(count);
		if(count==0xFF){
			count = this.read_UI16();
		}

		for(let i=0; i<count; i++){
			let o = {};
			o.type = this.read_UI8();

			if(o.type==this.FILLTYPE_SOLID_FILL){
				if(shape3mode)
					o.color = this.read_RGBA();
				else
					o.color = this.read_RGB();
			}

			if	(
					(o.type == this.FILLTYPE_LINEAR_GRADIENT_FILL) || 
					(o.type == this.FILLTYPE_RADIAL_GRADIENT_FILL) || 
					(o.type == this.FILLTYPE_FOCAL_RADIAL_GRADIENT_FILL)
				){

				o.gradientMatrix = this.read_MATRIX();

				
				if(o.type == this.FILLTYPE_FOCAL_RADIAL_GRADIENT_FILL){
					let t = this.read_UI8();
					o.gradient = {};
					o.gradient.spreadMode = (t>>6) & 0b11;
					o.gradient.interpolationMode = (t>>4) & 0b11;
					o.gradient.numGradients = (t & 0b1111);
					o.gradient.gradientRecord = [];
					for(let i=0;i<o.gradient.numGradients;i++){
						t = {};
						t.ratio = this.read_UI8();
						if(shape3mode)
							t.color = this.read_RGBA();
						else
							t.color = this.read_RGB();
						o.gradient.gradientRecord.push(t);
					}
					o.gradient.focalPoint = this.read_FIXED8();
					
				}else{
					// o.gradient =
					alert("TODO: read gradient fill!");
					return null;
				}
				

			}

			if	(
					(o.type == this.FILLTYPE_REPEATING_BITMAP_FILL) || 
					(o.type == this.FILLTYPE_CLIPPED_BITMAP_FILL) || 
					(o.type == this.FILLTYPE_NON_SMOOTHED_REPEATING_BITMAP_FILL) ||
					(o.type == this.FILLTYPE_NON_SMOOTHED_CLIPPED_BITMAP_FILL) 
				){

				o.bitmapId = this.read_UI16();
				//console.log('id:',o.bitmapId);
				//console.log(this.core.dictionary.has(o.bitmapId));
				//console.log(this.character_id);

				o.bitmapMatrix = this.read_MATRIX();
			}

			obj.push(o);
		}

		return obj;
	}

	read_LINESTYLEARRAY(shape3mode){
		let obj = [];
		obj.push(null);
		let count = this.read_UI8();
		if(count==0xFF){
			count = this.read_UI16();
		};
		for(let i=0; i<count; i++){
			obj.push(this.read_LINESTYLE(shape3mode))
		}
		return obj;
	}

	read_LINESTYLE(shape3mode){
		let obj = {};
		obj.width = this.read_UI16();
		if(shape3mode)
			obj.color = this.read_RGBA();
		else
			obj.color = this.read_RGB();
		return obj;
	}

	read_ShapeRecords(shape3mode){

		var debug_draw=false;
		if(debug_draw){
			this.core.ctx.fillStyle = '#FFFFFF';
			this.core.ctx.fillRect(-100,-100,this.core.canvas.width,this.core.canvas.height);
			this.core.ctx.setTransform(1,0,0,1,100,100);
			debug.stop();
		}
		//this.cur--;
		let t2 = this.read_UI8();
		let numFillBits = (t2 >> 4) & 0b1111;
		let numLineBits = t2 & 0b1111;
		
		//console.log(numFillBits);
		//console.log(numLineBits);

		//console.log(this.raw_data.slice(this.cur));

		let ar = [];

		let ctx = null;
		let debug_draw_scale=30;
		if(debug_draw){
			ctx = document.getElementsByTagName("CANVAS")[0].getContext('2d');
			ctx.fillStyle = '#00FF00';

			ctx.beginPath();
			//ctx.moveTo(0,0);
		}
		let cur_x=0, cur_y=0;

		let shapes = [];

		let cou2=0;
		//while(this.cur<this.raw_data.length){
			cou2++;
			//if(cou2>100) {console.log('limit');break;}


			let count = 0;
			let end = false;
			let start_cur;
			let t={shift:0};
			while(!end){
				start_cur=this.cur;
				count++;
				//if(count>20) break;
				let obj={};
				//console.log(t);
				//console.log(this.raw_data[this.cur]);
				t = this.read_UB(t.shift,1);
				obj.typeFlag = t.value;
				//console.log(t);
				//console.log(this.raw_data[this.cur]);

				if(obj.typeFlag==0){
					// Non-edge records
					//checking is end record
					let cur_before = this.cur;
					let t2 = this.read_UB(t.shift,5);
					if(t2.value==0){
						//console.log('end!!');
						end=true;

						break;
					}
					this.cur=cur_before;
					
					//StyleChangeRecord
					//console.log("stateNewStyles: shift: "+t.shift+", size: "+(1)+", byte: "+this.raw_data[this.cur]);

					t = this.read_UB(t.shift,1);
					obj.stateNewStyles = t.value;
					
					t = this.read_UB(t.shift,1);
					obj.stateLineStyle = t.value;
					t = this.read_UB(t.shift,1);
					obj.stateFillStyle1 = t.value;
					t = this.read_UB(t.shift,1);
					obj.stateFillStyle0 = t.value;
					t = this.read_UB(t.shift,1);
					obj.stateMoveTo = t.value;
					if(obj.stateMoveTo){
						t = this.read_UB(t.shift,5);
						let MoveBits = t.value;
						t = this.read_SB(t.shift,MoveBits);
						obj.moveDeltaX = t.value;
						t = this.read_SB(t.shift,MoveBits);
						obj.moveDeltaY = t.value;

						if(debug_draw){
							cur_x=(obj.moveDeltaX/debug_draw_scale);
							cur_y=(obj.moveDeltaY/debug_draw_scale);
							ctx.moveTo(cur_x,cur_y);
						}
					}
					if(obj.stateFillStyle0){
						t = this.read_UB(t.shift,numFillBits);
						obj.fillStyle0 = t.value;
					}
					if(obj.stateFillStyle1){
						t = this.read_UB(t.shift,numFillBits);
						obj.fillStyle1 = t.value;
					}
					if(obj.stateLineStyle){
						t = this.read_UB(t.shift,numLineBits);
						obj.lineStyle = t.value;	
					}
					
					if(obj.stateNewStyles){
						//ctx.fill();
						if(debug_draw)
							ctx.stroke();
						/*
						alert("TODO: stateNewStyles read!");
						console.log("error");
						debug.obj(obj);
						console.log(this.raw_data.slice(start_cur,this.cur));
						console.log(shapes);
						return false;
						break;*/

						//console.log(t);
						if(t.shift>0){
							t.shift=0;
							this.cur++;
						}

						obj.fillStyles = this.read_FILLSTYLEARRAY(shape3mode);
						//console.log(obj.fillStyles);
						//return false;
						if(obj.fillStyles == null)
							return false;
						obj.lineStyles = this.read_LINESTYLEARRAY(shape3mode);
						
						
						let t2 = this.read_UI8();
						obj.newStylesNumFillBits = (t2 >> 4) & 0b1111;
						obj.newStylesNumLineBits = t2 & 0b1111;
						numFillBits = obj.newStylesNumFillBits;
						numLineBits = obj.newStylesNumLineBits;
						//console.log(obj);
						//return false;
					}
					
					
					
				}else{
					// Edge records
					// stright
					t = this.read_UB(t.shift,1);
					obj.straightFlag = t.value;
					t = this.read_UB(t.shift,4);
					let NumBits = t.value;

					if(obj.straightFlag){
						t = this.read_UB(t.shift,1);
						obj.generalLineFlag = t.value;
						if(obj.generalLineFlag==0){
							t = this.read_UB(t.shift,1);
							obj.vertLineFlag = t.value;
						}
						if( obj.generalLineFlag==1 || obj.vertLineFlag==0 ){
							//console.log("deltaX: shift: "+t.shift+", size: "+(NumBits+2)+", byte: "+this.raw_data[this.cur]);
							t = this.read_SB(t.shift,NumBits+2);
							obj.deltaX = t.value;
							//console.log('value: '+t.value);

							if(debug_draw)
								cur_x+=obj.deltaX/debug_draw_scale;
						}
						if( obj.generalLineFlag==1 || obj.vertLineFlag==1 ){
							//console.log("deltaY: shift: "+t.shift+", size: "+(NumBits+2)+", byte: "+this.raw_data[this.cur]);
							t = this.read_SB(t.shift,NumBits+2);
							obj.deltaY = t.value;
							//console.log('value: '+t.value);

							if(debug_draw) cur_y+=obj.deltaY/debug_draw_scale;
						}


						if(debug_draw) ctx.lineTo(cur_x,cur_y);
					}else{
						//curved
						t = this.read_SB(t.shift,NumBits+2);
						obj.controlDeltaX = t.value;
						t = this.read_SB(t.shift,NumBits+2);
						obj.controlDeltaY = t.value;
						t = this.read_SB(t.shift,NumBits+2);
						obj.anchorDeltaX = t.value;
						t = this.read_SB(t.shift,NumBits+2);
						obj.anchorDeltaY = t.value;

						if(debug_draw){
							cur_x+=obj.controlDeltaX/debug_draw_scale;
							cur_y+=obj.controlDeltaY/debug_draw_scale;
							ctx.lineTo(cur_x,cur_y);
							cur_x+=obj.anchorDeltaX/debug_draw_scale;
							cur_y+=obj.anchorDeltaY/debug_draw_scale;
							ctx.lineTo(cur_x,cur_y);
						}
					}
					
				}
				
				ar.push(obj);
			}
			

			if(debug_draw)
				ctx.stroke();
			//ctx.fill();
			//return false;

			shapes.push(ar);
			ar=[];

			if(t.shift>0) this.cur++;
			

		return shapes;
	}

	read(){
		this.set_constants();
		let obj = {};

		obj.shapeID = this.read_UI16();
		if(this.core.dictionary.has(obj.shapeID)){
			return true;
		}
		obj.shapeBounds = this.read_RECT();


		//SHAPEWITHSTYLE
		let shapes = {}
		
		let fillStyles = this.read_FILLSTYLEARRAY(false);
		if (!fillStyles)
			return false;
		

		shapes.fillStyles = fillStyles;
		shapes.lineStyles = this.read_LINESTYLEARRAY(false);

		shapes.shapeRecords = this.read_ShapeRecords(false);
		if(!shapes.shapeRecords)
			return false;

		obj.shapes = shapes;
		
		obj.type = this.header.code;
		
		let shape_id = obj.shapeID

		obj = new Shape(this.core,obj);

		if(obj.error)
			return false;

		this.core.dictionary.add(shape_id,obj);

		return true;
	}

}

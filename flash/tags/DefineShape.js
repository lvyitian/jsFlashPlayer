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

				alert("TODO: read gradient fill!");
				return null;
				if(o.type == this.FILLTYPE_FOCAL_RADIAL_GRADIENT_FILL){
					//o.gradient = 	
				}else{
					// o.gradient =
				}
				

			}

			if	(
					(o.type == this.FILLTYPE_REPEATING_BITMAP_FILL) || 
					(o.type == this.FILLTYPE_CLIPPED_BITMAP_FILL) || 
					(o.type == this.FILLTYPE_NON_SMOOTHED_REPEATING_BITMAP_FILL) ||
					(o.type == this.FILLTYPE_NON_SMOOTHED_CLIPPED_BITMAP_FILL) 
				){

				o.bitmapId = this.read_UI16();
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
		//this.cur--;
		let t2 = this.read_UI8();
		let numFillBits = (t2 >> 4) & 0b1111;
		let numLineBits = t2 & 0b1111;

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
		while(this.cur<this.raw_data.length){
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
							cur_x+=(obj.moveDeltaX/debug_draw_scale);
							cur_y+=(obj.moveDeltaY/debug_draw_scale);
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
						alert("TODO: stateNewStyles read!");
						console.log("error");
						console.log(obj);
						console.log(this.raw_data.slice(start_cur,this.cur));
						break;
						obj.fillStyles = this.read_FILLSTYLEARRAY(shape3mode);
						if(obj.fillStyles == null)
							break;
						obj.lineStyles = this.read_LINESTYLEARRAY(shape3mode);
						let t2 = this.read_UI8();
						obj.newStylesNumFillBits = (t2 >> 4) & 0b1111;
						obj.newStylesNumLineBits = t2 & 0b1111;
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
				

				//console.log(this.raw_data.slice(start_cur,this.cur));
				/*if(8-t.shift >0){
					console.log(this.raw_data[this.cur]);
					let t2 = this.read_UB(t.shift,8-t.shift);
					console.log('t2:',t2);
					console.log(obj);
					console.log(this.raw_data.slice(start_cur,this.cur));
					if(t2.value>0){
						console.log("error2");
						break;
					}
				}*/
				ar.push(obj);
			}
			

			if(debug_draw)
			ctx.stroke();
			//ctx.fill();

			shapes.push(ar);
			ar=[];

			if(t.shift>0) this.cur++;
			//console.log(this.cur,this.raw_data.length);
			if(this.cur>=this.raw_data.length) break;
		}
		

		if(this.raw_data.length>this.cur){
			console.log(this.cur,this.raw_data.length);
			alert("Size mismatch!");
			console.log("Size mismatch!");
			return false;
		}

		return shapes;
	}

	read(){
		this.set_constants();
		let obj = {};

		obj.shapeID = this.read_UI16();
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

		this.core.dictionary.add(shape_id,obj);

		return true;
	}

}

class Shape{
	constructor(core, data){
		this.core = core;
		this.data = data;
		this.type = data.type;

		this.x = 0;
		this.y = 0;
		this.base_x = 0;
		this.base_y = 0;

		this.ctx = this.core.ctx;
		this.fill_shapes = null;
		this.lines = null;

		this.avm_obj = new AVM_Object(this);

		this.FILLTYPE_SOLID_FILL = 0x00;
		this.FILLTYPE_LINEAR_GRADIENT_FILL = 0x10;
		this.FILLTYPE_RADIAL_GRADIENT_FILL = 0x12;
		this.FILLTYPE_FOCAL_RADIAL_GRADIENT_FILL = 0x13;
		this.FILLTYPE_REPEATING_BITMAP_FILL = 0x40;
		this.FILLTYPE_CLIPPED_BITMAP_FILL = 0x41;
		this.FILLTYPE_NON_SMOOTHED_REPEATING_BITMAP_FILL = 0x42;
		this.FILLTYPE_NON_SMOOTHED_CLIPPED_BITMAP_FILL = 0x43;


		this.error = (!this.init_shapes());

		if(this.error){
			console.error('error while initialize ', this);
		}
	}

	//convert coordinate
	cc(coord){
		if(this.font_size){
			//console.log('with font_size');
			return (coord*this.font_size/1024);
		}
		else{
			return coord;
		}
	}

	cc20(coord){
		//return Math.floor(coord/20);
		return coord/20;
	}

	set_draw_options(options){
		if('color_transform' in options){
			console.log("TODO: color_transform in Shape ",options);
			return false;
		}
		return true;
	}

	fill_path(ctx, path, state={x:this.base_x, y:this.base_y}){

		/*this.base_x=1000;
		this.base_y=1000;*/
		var cc20 = this.cc20;


		let x = state.x;
		let y = state.y;
		
		for( let i=0; i< path.length ; i++){
			/*if(i==10){
				console.log(path[i-1]);

				break;
			}*/
			let e = path[i];
			//console.log(e);
			if(e.typeFlag==0){
				if(e.stateMoveTo){
					x = this.cc(e.moveDeltaX)+this.base_x;
					y = this.cc(e.moveDeltaY)+this.base_y;
					/*console.log(x/20);
					console.log(y/20);*/
					//ctx.closePath();
					ctx.moveTo(cc20(x), cc20(y));
					//ctx.lineTo(x/20, y/20);
				}
			}else if(e.straightFlag){
				if(e.generalLineFlag){
					x+=this.cc(e.deltaX);
					y+=this.cc(e.deltaY);
				}else{
					if(e.vertLineFlag){
						y+=this.cc(e.deltaY);
					}else{
						x+=this.cc(e.deltaX);
					}
				}
				ctx.lineTo(cc20(x), cc20(y));
				//console.log('lineTo:',this.x/20,this.y/20);
			}else{
				

				x+=this.cc(e.controlDeltaX);
				y+=this.cc(e.controlDeltaY);

				let tx = cc20(x); 
				let ty = cc20(y);
				
				x+=this.cc(e.anchorDeltaX);
				y+=this.cc(e.anchorDeltaY);
				
				ctx.quadraticCurveTo(tx,ty,cc20(x),cc20(y));

				//return false;
			}
		}

		//state.x = x;
		//state.y = y;
		ctx.closePath();
		
		return true;
	}

	init_shapes(){
		//stateFillStyle0 counter clockwise
		//stateFillStyle1 clockwise

		let shapes = this.data.shapes.shapeRecords;

		//console.log(this.data.shapes.fillStyles);

		let fill_0=[];
		let fill_1=[];

		//for(let k=0;k<shapes.length;k++){
			let shape = shapes[0];

			let fill_styles = this.data.shapes.fillStyles;//.slice(0);
			let line_styles = this.data.shapes.lineStyles;//.slice(0);
			if(!line_styles){
				line_styles = [null];
			}

			let fill_shapes = [];
			let lines = [];

			fill_styles.forEach( function(element, index) {
				fill_shapes[index]={
					style : element,
					fill_0 : [],
					fill_1 : [],
					cache_path : null,
					order: 0
				};
			});



			line_styles.forEach( function(element, index) {
				lines[index]={
					style : element,
					path : [],
					cache_path : null,
				};
			});

			//console.log(fill_shapes);


			let cur_fill_0=0;
			let cur_fill_1=0;
			let cur_line_style=0;

			let fill_style_skip=0;
			let line_style_skip=0;

			let t;
			let x=0;
			let y=0;

			for(let i=0; i<shape.length; i++){
				let e = shape[i];

				if(e.typeFlag == 0){
					if(e.stateNewStyles){
						//console.log(lines);
						fill_style_skip=fill_shapes.length;
						e.fillStyles.forEach( function(element, index) {
							fill_shapes[index+fill_style_skip]={
								style : element,
								fill_0 : [],
								fill_1 : [],
								cache_path : null,
								order: 0
							};
						});

						line_style_skip = lines.length;
						e.lineStyles.forEach( function(element, index) {
							lines[index+line_style_skip]={
								style : element,
								path : [],
								cache_path : null,
							};
						});
						//console.log(lines);
						//console.log(i,e);
						//return false;
					}
					if(e.stateLineStyle){
						cur_line_style = e.lineStyle;
						//console.log(e.lineStyle);

						lines[cur_line_style+line_style_skip].path.push({
							typeFlag : 0,
							stateMoveTo : true,
							moveDeltaX : x,
							moveDeltaY : y
						});
					}

					if(e.stateFillStyle0){
						cur_fill_0 = e.fillStyle0;
						fill_shapes[cur_fill_0+fill_style_skip].fill_0.push({
							typeFlag : 0,
							stateMoveTo : true,
							moveDeltaX : x,
							moveDeltaY : y
						});

					}
					if(e.stateFillStyle1){
						cur_fill_1 = e.fillStyle1;
						fill_shapes[cur_fill_1+fill_style_skip].fill_1.push({
							typeFlag : 0,
							stateMoveTo : true,
							moveDeltaX : x,
							moveDeltaY : y
						});
					}
					if(e.stateMoveTo){
						x = e.moveDeltaX;
						y = e.moveDeltaY;
					}
				}else if(e.straightFlag){
					if(e.generalLineFlag){
						x+=e.deltaX;
						y+=e.deltaY;
					}else{
						if(e.vertLineFlag){
							y+=e.deltaY;
						}else{
							x+=e.deltaX;
						}
					}
				}else{
					x+=e.controlDeltaX;
					y+=e.controlDeltaY;
					
					x+=e.anchorDeltaX;
					y+=e.anchorDeltaY;
				}

				if(cur_fill_0>0){
					t = fill_shapes[cur_fill_0+fill_style_skip];
					if(t===undefined){
						console.error('fill style beyond styles array')
						return false
					}
					t.fill_0.push(e);
					t.order = i;
				}

				if(cur_fill_1>0){
					t = fill_shapes[cur_fill_1+fill_style_skip];
					if(t===undefined){
						console.error('fill style beyond styles array')
						return false
					}
					t.fill_1.push(e);
					t.order = i;
				}

				if(cur_line_style>0){
					t = lines[cur_line_style+line_style_skip];
					if(t===undefined){
						console.error('line style beyond styles array')
						console.log(i,shapes);
						return false
					}
					t.path.push(e);
				}

			}

		//}
		this.fill_shapes = fill_shapes;
		this.lines = lines;


		//sort fill_shapes
		fill_shapes.sort(function(a,b){
			if(a.order>b.order)
				return 1;
			else if(a.order<b.order)
				return -1;
			else
				return 0;
		});


		for(let i=0; i<fill_shapes.length; i++){
			let st = fill_shapes[i];
			st.path = [];
			st.path = st.path.concat(st.fill_0,st.fill_1);
			/*st.fill_1 = this.normalize_path(st.fill_1);
			st.fill_0 = this.normalize_path(st.fill_0);*/
			//if(i==47)
			st.path = this.normalize_path(st.path);
			if(st.path===false)
				return false;
		}

		return true;
	}

	draw(matrix,x=0,y=0,font_size=false){
		this.base_x=x;
		this.base_y=y;
		this.font_size=font_size;
		
		

		if(!this.draw_fill_shapes(this.fill_shapes))
			return false;

		if(!this.draw_lines(this.lines))
			return false;
		

		/*if (![1,2,3,4,6].includes(this.data.shapeID)) {
			console.log('id:',this.data.shapeID);
			return false;
		}*/

		//return false;

		return true;
	}

	set_fill_style(fill_style){
		switch (fill_style.type) {
			case this.FILLTYPE_SOLID_FILL:{
				let color = fill_style.color;
				this.ctx.fillStyle = "rgb("+color.r+","+color.g+","+color.b+")";
				//console.log();
			}break;
			
			case this.FILLTYPE_NON_SMOOTHED_CLIPPED_BITMAP_FILL:  //I can not find the right solving for this...
			case this.FILLTYPE_REPEATING_BITMAP_FILL:
			case this.FILLTYPE_CLIPPED_BITMAP_FILL:{
				let matrix = fill_style.bitmapMatrix;
				matrix.resize_for_background_fill();
				//console.log("shape_id: "+this.data.shapeID,matrix);
				let char_id = fill_style.bitmapId;
				let img = this.core.dictionary.get(char_id);
				if(img===undefined){
					console.log(fill_style);
					console.log('no image!');
					return false;
				}

				img = img.image;
				let pattern;
				if(fill_style.type == this.FILLTYPE_REPEATING_BITMAP_FILL)
					pattern = this.ctx.createPattern(img, 'repeat');
				else
					pattern = this.ctx.createPattern(img, 'no-repeat');

				pattern.setTransform(matrix.svgMatrix);
				this.ctx.fillStyle = pattern;

			}break;
			/*case this.FILLTYPE_RADIAL_GRADIENT_FILL:{
				console.log(fill_style);
			}break;*/

			default:
				alert("TODO: Fill type:"+fill_style.type);
				console.log("TODO: Fill type:"+fill_style.type.toString(16));
				return false;
				break;
		}
		//this.ctx.closePath();
		return true;
	}

	draw_fill_shapes(fill_shapes){
		let ctx = this.ctx;

		if(!fill_shapes){
			console.error("fill_shapes is",fill_shapes);
			console.log(this.error);
			return false;
		}

		//fill_0 counter clockwise
		//fill_1 clockwise

		for(let k=0;k<fill_shapes.length;k++){
			let st = fill_shapes[k];
			if(st.style === null)
				continue;

			/*if(k==16){
				ctx.fillStyle="white";
				ctx.fillRect(-400,-400,1300,1000);

				console.log(fill_shapes[k-1]);
			}*/
				//return false;

			//ctx.fillStyle="#507070";
			//ctx.fillRect(-400,-400,1300,1000);

			if(st.fill_0.length>0 || st.fill_1.length>0){
				if(!this.set_fill_style(st.style))
					return false;
			}
			
			if(st.cache_path===null || this.font_size !== undefined){
				//console.log('do cache!');
				let c = new Path2D();
				if(st.path.length>0)
					this.fill_path(c,st.path);
				st.cache_path = c;
			}
			//ctx.fillStyle="white";
			ctx.fill(st.cache_path);
			//ctx.stroke(st.cache_path);
			//console.log(k);
			/*if(k==47){
				console.log(st);
				return false;
			}*/
			
		}

		return true;
	}

	reverse_path(path){

		let x=0;
		let y=0;

		let absolute_path = [];

		let reverse = [];

		for( let i=0; i< path.length ; i++){
			let e = path[i];
			if(e.typeFlag==0){
				if(e.stateMoveTo){
					x = e.moveDeltaX;
					y = e.moveDeltaY;
					//absolute_path.push({x:x, y:y});
				}
			}else if(e.straightFlag){
				if(e.generalLineFlag){
					x+=e.deltaX;
					y+=e.deltaY;
				}else{
					if(e.vertLineFlag){
						y+=e.deltaY;
					}else{
						x+=e.deltaX;
					}
				}
				//absolute_path.push({x:x, y:y});
			}else{
				x+=e.controlDeltaX;
				y+=e.controlDeltaY;

				//absolute_path.push({x:x, y:y});
				
				x+=e.anchorDeltaX;
				y+=e.anchorDeltaY;
				
				//absolute_path.push({x:x, y:y});
			}
			absolute_path.push({x:x, y:y});
		}

		reverse.push({
			typeFlag : 0,
			stateMoveTo : true,
			moveDeltaX : x,
			moveDeltaY : y
		});


		for( let i=path.length-1; i>0; i--){
			let e = path[i];
			let t = JSON.parse(JSON.stringify(e));
			if(e.typeFlag==0){
				if(e.stateMoveTo){
					if(i<1)
						continue;
					if(absolute_path[i-1]==undefined){

						console.log(absolute_path);
						console.log(path);
						this.core.abort();
					}
					x = absolute_path[i-1].x
					y = absolute_path[i-1].y
					
					reverse.push({
						typeFlag : 0,
						stateMoveTo : true,
						moveDeltaX : x,
						moveDeltaY : y
					});
				}
			}else if(e.straightFlag){
				if(e.generalLineFlag){
					t.deltaX*=-1;
					t.deltaY*=-1;
				}else{
					if(e.vertLineFlag){
						t.deltaY*=-1;
					}else{
						t.deltaX*=-1;
					}
				}
				reverse.push(t);
			}else{
				let tx = t.controlDeltaX*=-1;
				let ty = t.controlDeltaY*=-1;
				
				t.controlDeltaX = t.anchorDeltaX*-1;
				t.controlDeltaY = t.anchorDeltaY*-1;

				t.anchorDeltaX=tx;
				t.anchorDeltaY=ty;
				
				reverse.push(t);
			}
		}

		return reverse;
	}

	is_clockwise(path){
		let x=0;
		let y=0;

		let absolute_path = [];

		for( let i=0; i< path.length ; i++){
			let e = path[i];
			if(e.typeFlag==0){
				if(e.stateMoveTo){
					x = e.moveDeltaX;
					y = e.moveDeltaY;
					absolute_path.push({x:x, y:y});
				}
			}else if(e.straightFlag){
				if(e.generalLineFlag){
					x+=e.deltaX;
					y+=e.deltaY;
				}else{
					if(e.vertLineFlag){
						y+=e.deltaY;
					}else{
						x+=e.deltaX;
					}
				}
				absolute_path.push({x:x, y:y});
			}else{
				x+=e.controlDeltaX;
				y+=e.controlDeltaY;

				absolute_path.push({x:x, y:y});
				
				x+=e.anchorDeltaX;
				y+=e.anchorDeltaY;
				
				absolute_path.push({x:x, y:y});
			}
		}

		let val = 0;
		// (x2 − x1)(y2 + y1)
		for(let i=0; i<absolute_path.length; i++){
			let e1 = absolute_path[i];
			let e2 = absolute_path[(i+1)%(absolute_path.length)];

			val+=(e2.x-e1.x)*(e2.y+e1.y);
		}
		return (val<0);
	}


	get_start_end_coord(o){
		let x = 0;
		let y = 0;
		
		let first=true;
		for( let i=0; i< o.path.length ; i++){
			let e = o.path[i];
			if(e.typeFlag==0){
				if(e.stateMoveTo){
					x = e.moveDeltaX;
					y = e.moveDeltaY;
					if(first){
						first=false;
						o.start.x=x;
						o.start.y=y;
					}
				}
			}else if(e.straightFlag){
				if(e.generalLineFlag){
					x+=e.deltaX;
					y+=e.deltaY;
				}else{
					if(e.vertLineFlag){
						y+=e.deltaY;
					}else{
						x+=e.deltaX;
					}
				}
			}else{
				x+=e.controlDeltaX;
				y+=e.controlDeltaY;

				x+=e.anchorDeltaX;
				y+=e.anchorDeltaY;
			}
			//console.log(i,x,y);
		}
		
		o.end.x=x;
		o.end.y=y;
	}

	convert_to_absolute_coord_poly(path){
		let x = 0;
		let y = 0;
		
		let besie = function(t,p1,p2,p3){
			return Math.pow(1-t,2)*p1+2*(1-t)*t*p2+t*t*p3;
		}

		let poly = [];

		for( let i=0; i< path.length ; i++){
			let e = path[i];
			if(e.typeFlag==0){
				if(e.stateMoveTo){
					x = e.moveDeltaX;
					y = e.moveDeltaY;
				}
			}else if(e.straightFlag){
				if(e.generalLineFlag){
					x+=e.deltaX;
					y+=e.deltaY;
				}else{
					if(e.vertLineFlag){
						y+=e.deltaY;
					}else{
						x+=e.deltaX;
					}
				}
			}else{
				let px1 = x;
				let py1 = y;
				x+=e.controlDeltaX;
				y+=e.controlDeltaY;
				let px2 = x;
				let py2 = y;
				x+=e.anchorDeltaX;
				y+=e.anchorDeltaY;
				let px3 = x;
				let py3 = y;
				let t=0;
				let pt = 1.0/11.0;
				for(let ii=0;ii<10;ii++){
					//console.log(t);
					let nx = besie(t, px1, px2, px3);
					let ny = besie(t, py1, py2, py3);
					poly.push({x:nx,y:ny});
					t+=pt;
				}
			}

			poly.push({x:x,y:y});
		}
		
		return poly;
	}

	debug_draw_poly(poly){
		let first = true;
		let cc20 = this.cc20;
		for( let i=0; i< poly.length ; i++){
			let p = poly[i];
			if(first){
				this.ctx.moveTo(cc20(p.x),cc20(p.y));
				first=false;
			}
			else
				this.ctx.lineTo(cc20(p.x),cc20(p.y));

		}
	}

	normalize_path(path){
		if(path.length==0)
			return path;


		let split_by_moveto = function(path){
			let lines = [];
			let t=-1;
			for(let i=0;i<path.length;i++){
				let e = path[i];
				if(e.typeFlag==0){
					if(e.stateMoveTo){
						t++;
						if(lines[t]===undefined)
						lines[t] = [];
					}	
				}
				
				lines[t].push(e);
			}
			return lines
		}

		let lines = split_by_moveto(path);
		//console.log(path);

		for(let k=0;k<lines.length;k++){
			let e = lines[k];
			let o = {};
			o.path = e;
			o.start = {x:0, y:0};
			o.end = {x:0, y:0};

			this.get_start_end_coord(o);

			lines[k] = o;
		}


		//

		for(let i=0;i<lines.length;i++){
			let e1 = lines[i];
			for(let j=0;j<lines.length;j++){
				if(i==j) continue;

				let e2 = lines[j];
				if((e1.start.x == e2.start.x) && (e1.start.y == e2.start.y)){
					e2.path = this.reverse_path(e2.path);
					this.get_start_end_coord(e2);
				}

				if((e1.start.x == e2.end.x) && (e1.start.y == e2.end.y)){
					e1.path = e2.path.concat(e1.path);
					e2.path=[];
					//console.log('connect',j,'to',i);
					this.get_start_end_coord(e1);
					this.get_start_end_coord(e2);
				}
			}
		}

		//join all lines into one array
		let result = [];
		for(let i=0;i<lines.length;i++){
			lines[i].path.forEach( function(element, index) {
				result.push(element);
			});
		}
		for(let i=0;i<lines.length;i++){
			let path = lines[i].path;
			lines[i]={
				path: path,
				poly: this.convert_to_absolute_coord_poly(path),
				in_list: [],
				clockwise : this.is_clockwise(path)
			}
		}

		//calculate 'in list'
		for(let i=0;i<lines.length;i++){
			let e1 = lines[i];
			for(let j=0;j<lines.length;j++){
				if(i==j)
					continue;
				
				let e2 = lines[j];
				if(this.is_poly_inside_poly(e1.poly, e2.poly)){
					if(! e1.in_list.includes(j)){
						e2.in_list.push(i);
					}else{
						console.warn('shape parts is overlapping!',i,j);
					}
				}

			}
		}
		let get_recursive_inlist=function(e,lines){
			let res = e.in_list;
			for(let i=0;i<e.in_list.length;i++){
				res = res.concat(get_recursive_inlist(lines[e.in_list[i]], lines));
			}
			return res;
		}

		let opt_inlist = function(e, lines){			
			let l = e.in_list;
			for(let i=0;i<l.length;i++){
				let l2 = get_recursive_inlist(lines[l[i]],lines);
				let l3 = [];
				for(let j=0;j<l.length;j++){
					if(!(l2.includes(l[j]))){
						l3.push(l[j]);
					}
				}
				l=l3;
			}
			e.in_list=l;
			return l;
		}
		for(let i=0;i<lines.length;i++){
			let e = lines[i];
			if(e.in_list.length>0){
				opt_inlist(e,lines);
			}
		}

		//calculate normals
		let reverse_recursive=function(e,lines){
			for(let i=0;i<e.in_list.length;i++){
				let t = lines[e.in_list[i]];
				if(t.clockwise == e.clockwise){
					t.clockwise = !t.clockwise;
					t.path = this.reverse_path(t.path);
				}
				reverse_recursive(t,lines);
			}
		}.bind(this);

		for(let i=0;i<lines.length;i++){
			reverse_recursive(lines[i], lines);
		}

		
		//joining lines into one array
		result = [];
		for(let i=0;i<lines.length;i++){
			result = result.concat(lines[i].path);	
		}

		
		return result;
	}

	set_line_style(ctx, style){
		let color = style.color;
		if('a' in color){
			ctx.strokeStyle = 'rgba('+color.r+','+color.g+','+color.b+','+color.a+')';			
		}else{
			ctx.strokeStyle = 'rgb('+color.r+','+color.g+','+color.b+')';
		}
		ctx.lineWidth = style.width/20;
	}

	draw_lines(lines){
		//return true;
		for(let k=0;k<lines.length;k++){
			let st = lines[k];
			if(st.style === null)
				continue;

			//this.ctx.fillStyle="white";
			//this.ctx.fillRect(-400,-400,1300,1000);

			this.set_line_style(this.ctx, st.style);
			this.ctx.beginPath();
			this.fill_path(this.ctx, st.path);
			this.ctx.stroke();

			//console.error('TODO: Draw Lines');
			//console.log(st);
			//return false;
		}
		return true;
	}

	is_point_in_polygon(point, poly){
		let x = point.x;
		let y = point.y;
		let result = false;
		let j = poly.length - 1;
		for(let i=0;i<poly.length;i++){
			if (
				(
					((poly[i].y<=y) && (y<poly[j].y)) || 
					((poly[j].y<=y) && (y<poly[i].y))
				) && 
				(
					x > (poly[j].x - poly[i].x) * (y - poly[i].y) / (poly[j].y - poly[i].y) + poly[i].x)
				) 
			{
	        	result = !result
	        }
	        j = i;
		}
		return result;
	}

	is_poly_inside_poly(poly, in_poly){
		for(let i=0;i<poly.length;i++){
			let point = poly[i];
			if(this.is_point_in_polygon(point, in_poly)){
				return true;
			}
		}
		return false;
	}
}



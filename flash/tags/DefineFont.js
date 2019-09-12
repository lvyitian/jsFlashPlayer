class DefineFont extends DefineShape{
	read(){

		let o = {};

		o.fontID = this.read_UI16();
		//o.data = this.read_sub_array(this.raw_data.length - this.cur);


		let offsetTable_addr = this.cur;
		let shape_addr = this.read_UI16()+offsetTable_addr;
		
		this.cur = offsetTable_addr;

		o.offsetTable = [];
		while (this.cur<shape_addr) {
			o.offsetTable.push(this.read_UI16());
		}

		o.numGlyphs = o.offsetTable.length;
		//console.log(this.cur);
		

		o.glyphShapeTable = [];

		this.set_constants();
		/*debug.stop();
		this.core.ctx.fillStyle = '#FFFFFF';
		this.core.ctx.fillRect(0,0,1000,1000);
		this.core.ctx.setTransform(1,0,0,1,100,100);*/
        
        for(let i = 0; i<o.numGlyphs; i++){
        	this.cur = offsetTable_addr+o.offsetTable[i];

        	let t=this.read_ShapeRecords(false);
		    if(t===false)
		        return false;	
		    t = new Shape(this.core,{
		    	shapes:{
		    		shapeRecords: t,
		    		fillStyles: [null,{
		    			type : 0,
		    			color : {r:0,g:0,b:0}
		    		}],
		    	}
			});
		    o.glyphShapeTable.push(t);
        }


		o.type=this.header.code;


		let t = new Font(this.core,o);
		this.core.dictionary.add(o.fontID, t);

		return true;
	}
}
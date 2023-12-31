class DefineShape2 extends DefineShape{
	read(){
		this.set_constants();
		let obj = {};

		obj.shapeID = this.read_UI16();
		if(this.core.dictionary.has(obj.shapeID)){
			return true;
		}
		obj.shapeBounds = this.read_RECT();

		this.character_id = obj.shapeID;

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

tag_list[22] = DefineShape2;
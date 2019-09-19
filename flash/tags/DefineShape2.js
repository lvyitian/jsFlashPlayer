class DefineShape2 extends DefineShape{
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
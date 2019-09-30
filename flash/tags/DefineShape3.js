class DefineShape3 extends DefineShape{
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
		
		let fillStyles = this.read_FILLSTYLEARRAY(true);
		if (!fillStyles)
			return false;


		shapes.fillStyles = fillStyles;
		shapes.lineStyles = this.read_LINESTYLEARRAY(true);

		shapes.shapeRecords = this.read_ShapeRecords(true);
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
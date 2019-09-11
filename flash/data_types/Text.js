class Text{
	constructor(type, data, core){
		this.data = data;
		this.type = type;

		this.core = core;
	}

	draw(parent_matrix){

		let matrix = parent_matrix.multiplySelf(this.data.textMatrix.matrix);



		console.log(this.data);
		return false;
	}
}
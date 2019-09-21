class VideoStream{
	constructor(core, data){
		this.type = data.type;
		this.core = core;

		this.codecID = data.codecID;
		this.numFrames = data.numFrames;
		this.width = data.width;
		this.height = data.height; 

		this.avm_obj = {};
	}
}
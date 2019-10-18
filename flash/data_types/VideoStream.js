class VideoStream extends genericDrawable{
	constructor(core, data){
		super();
		this.type = data.type;
		this.core = core;

		this.codecID = data.codecID;
		this.numFrames = data.numFrames;
		this.width = data.width;
		this.height = data.height; 

		this.avm_obj = {};
	}

	draw(matrix, ratio){
		if(this.codecID!=2){
			alert("TODO: Draw VideoStream codecID:"+this.codecID);
			return false;
		}

		if(ratio==undefined){
			console.log((new Error()).stack);
			return false;
		}
		let imdat = false;
		if(this.frames[ratio]==undefined){
			if(this.last_frame)
				imdat = this.last_frame;
		}else{
			imdat = Libav.decode_frame(this.frames[ratio],this.width,this.height);
		}
		if(imdat===false){
			console.log('len:',this.frames.length);
			console.log('ratio:',ratio);
			console.log('frame:',this.frames);
			return false;
		}

		this.last_frame = imdat;

		var d1 = new Date();

		this.core.bug_draw_image_data_to_canvas(imdat,this.width,this.height);
		
		return true;
	}
}
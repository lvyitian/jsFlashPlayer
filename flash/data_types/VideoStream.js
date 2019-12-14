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

		if(this.codecID===2) {

            if (ratio === undefined) {
                console.log((new Error()).stack);
                return false;
            }
            let imdat = false;
            if (this.frames[ratio] === undefined) {
                if (this.last_frame)
                    imdat = this.last_frame;
            } else {
                imdat = Libav.decode_frame(this.frames[ratio], this.width, this.height);
            }
            if (imdat === false) {
                console.log('len:', this.frames.length);
                console.log('ratio:', ratio);
                console.log('frame:', this.frames);
                return false;
            }

            this.last_frame = imdat;

            var d1 = new Date();

            this.core.bug_draw_image_data_to_canvas(imdat, this.width, this.height);

            return true;
        }else if (this.codecID===5){
			//vp6 with alpha
            ratio--;
            if(ratio<0) ratio=0;
            //let enc_frame =

            if (ratio === undefined) {
                console.log((new Error()).stack);
                return false;
            }
            let imdat = false;
            if(ratio===0){
                console.log('reset!');
                //Libav.reset_vp6_context();
            }
            if (this.frames[ratio] === undefined) {
                //return false;
                if (this.last_frame) {
                    imdat = this.last_frame;
                    //this.frames[ratio] = this.prev_encoded_frame;
                }

            } else {

                imdat = Libav.decode_frame_vp6(this.frames[ratio], this.width, this.height);
                this.prev_encoded_frame=this.frames[ratio];
            }
            if (imdat === false) {
                console.log('len:', this.frames.length);
                console.log('ratio:', ratio);
                console.log('frame:', this.frames);
                return false;
            }

            this.last_frame = imdat;


            var d1 = new Date();

            this.core.bug_draw_image_data_to_canvas(imdat, this.align_width(this.width), this.height);

            return true;

		}else{
            alert("TODO: Draw VideoStream codecID:"+this.codecID);
            return false;
		}
	}

    align_width(width){
        while((width&3)>0){
            width++;
        }
        return width;
    }
}
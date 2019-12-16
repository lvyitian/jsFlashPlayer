class VideoStream extends genericDrawable{
	constructor(core, data){
		super();
		this.type = data.type;
		this.core = core;

		this.codecID = data.codecID;
		this.numFrames = data.numFrames;
		this.width = data.width;
		this.height = data.height; 

		this.cached_frames = [];

		this.avm_obj = {};

		if(this.codecID === 5 && this.core.getCacheVideo()){
		    Libav.reset_vp6_context();
		    console.log('reset vp6');
		}
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
                imdat = this.decode_frame(ratio);
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
            /*ratio--;
            if(ratio<0) ratio=0;*/
            //let enc_frame =

            if (ratio === undefined) {
                console.log((new Error()).stack);
                return false;
            }
            let imdat = false;


            if (this.frames[ratio] === undefined) {
                //return false;
                if (this.last_frame) {
                    imdat = this.last_frame;
                }

            } else {
                if(this.core.getCacheVideo() && this.cached_frames[ratio]!==undefined) {
                    imdat = this.cached_frames[ratio];
                }else{
                    imdat = this.decode_frame(ratio);

                }
            }

            if(this.core.cacheVideo && this.cached_frames[ratio]===undefined){
                this.cached_frames[ratio]=imdat;
            }

            if (imdat === false && this.cached_frames[ratio]===undefined) {
                console.log('len:', this.frames.length);
                console.log('ratio:', ratio);
                console.log('frame:', this.frames);
                console.log(this.cached_frames[ratio]);
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

	decode_frame(ratio){
	    console.log('decode frame '+ratio);
        if(this.codecID===2) {
            return Libav.decode_frame(this.frames[ratio], this.width, this.height);
        }else if (this.codecID===5){
            return Libav.decode_frame_vp6(this.frames[ratio], this.width, this.height);
        }else{
            throw new Error('Codec '+this.codecID+' not supported!');
        }
    }

    add_frame(frame_data){
        if(this.frames[frame_data.frameNum] === undefined){
            this.frames[frame_data.frameNum] = frame_data.videoData;
            console.log(frame_data);
            if(this.core.getCacheVideo()){
                let data = this.decode_frame(frame_data.frameNum);
                this.cached_frames[frame_data.frameNum]=data.slice(0);
            }
        }
    }

    cache_frame(ratio){
	    if(this.cached_frames[ratio]!==undefined)
	        return;

        console.log('cache frame '+ratio+' this.codecID='+this.codecID);
	    let data = this.decode_frame(ratio);
        this.cached_frames[ratio]=data;


        /*let frames =  this.cached_frames;
        this.cached_frames[ratio].onload=function() {
            let canvas = document.getElementById('canvas');
            let ctx = canvas.getContext('2d');
            ctx.clearRect(0, 0, 800, 600);
            ctx.drawImage(frames[ratio], 0, 0);
            //throw new Error('stop~');
        }*/

    }

    align_width(width){
        while((width&3)>0){
            width++;
        }
        return width;
    }
}
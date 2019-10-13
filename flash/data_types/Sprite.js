class Sprite{
	constructor(type, data, core){
		this.type = type;
		this.data = data;
		this.core = core;
		this.dictionary = core.dictionary;
		this.display_list = new DisplayList(core.canvas,this.dictionary,true);

		this.cur_frame=0;
		this.cur_tag=0;

		this.avm_obj = {}
	}

	draw(matrix){
		this.matrix = matrix;
		let tags = this.data.tags;

		let tag;
		do{
			tag = tags[this.cur_tag];
			let tag_obj = tag;
			//console.log(tag);
			let r = true;
			switch (tag.code) {
				case 0:
					this.cur_tag=0;
					this.cur_frame=0;
				break;
				case 1:
					r = this.tag_ShowFrame();
				break;
				case 15:
					r = (new StartSound(this,tag_obj)).no_error;
				break;
				case 26:
	                r = (new PlaceObject2(this,tag_obj)).no_error;
        		break;
        		case 28:
        			r = (new RemoveObject2(this,tag_obj)).no_error; 
        		break;
				case 45:
					r = (new SoundStreamHead2(this,tag_obj)).no_error;
				break;
				case 61:
					r = (new VideoFrame(this,tag_obj)).no_error;
				break;
				default:
					console.log('sprite: unimplemented tag #'+tag.code);
					return false;
				break;
			}
			if(!r) return false;
			this.cur_tag++;
		}while(tag.code!=1);

		/*if(this.cur_frame == 4){
			if(![
					//125
				].includes(this.data.spriteID)){
				console.log(this.data.spriteID);
				console.log(this.matrix);
				console.log((new Error()).stack);

				return false;
			}
			
		}*/
		//console.log(this.data);
		return true;
	}

	tag_ShowFrame(){
		this.debug('tag ShowFrame');
		//console.log(this.matrix);
		let ret = this.display_list.draw(this.matrix);
		if(!ret){
			console.log(this.data.tags);
			console.log("frame:",this.cur_frame);
		}


		this.cur_frame++;
		return ret;
	}

	debug(...args){
    	if(this.core.debug_mode){
    		this.core.debug('sprite #'+this.data.spriteID+':',...args);
    	}
    }
}
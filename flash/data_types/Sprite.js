class Sprite{
	constructor(type, data, core){
		this.type = type;
		this.data = data;
		this.core = core;
		this.avm = core.avm;
		this.audio_ctx = this.core.audio_ctx;
		this.is_firefox = this.core.is_firefox;
		this.dictionary = core.dictionary;
		this.display_list = new DisplayList(core.canvas,this.dictionary,true);
		this.display_list.actions_this = this;
		this.has_color_transform = false;
		this.color_transform = null;

		this.bug_inject_script = core.bug_inject_script.bind(core);

		this.cur_frame=0;
		this.cur_tag=0;

		this.playing = true;
		this.timeline = data.timeline;
		this.frame_ready = false;

		this.avm_obj = {
			__degug: 'this is a sprite avm object'
		}
	}

	set_draw_options(options){

		if('color_transform' in options){
			//return false;
			this.color_transform = options.color_transform;
			if(!this.has_color_transform){
				this.has_color_transform = true;
				let canvas = document.createElement('canvas');
				canvas.width = this.core.canvas.width;
				canvas.height = this.core.canvas.height;
				this.display_list.replace_canvas(canvas);
			}
		}else {
			if(this.has_color_transform){
				this.has_color_transform = false;
				this.display_list.replace_canvas(this.core.canvas);	
			}
		}
		return true;
	}

	draw(matrix){

        this.matrix = matrix;

		if(!this.playing && this.frame_ready){
			return this.tag_ShowFrame();
		}


		let tags = this.data.tags;

		let tag;
		let tag_processor;

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
					this.frame_ready = true;
					r = this.tag_ShowFrame();
					if(this.display_list.do_abort_frame===true){
						continue;
					}
				break;
				default:


					tag_processor = tag_list[tag.code];
					if(typeof(tag_processor)=='undefined'){
						console.log('sprite: unimplemented tag #'+tag.code);
						return false;
					}
					r = (new tag_processor(this,tag)).no_error;
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

		let ret = this.display_list.draw(this.matrix, this.core.ctx);
		
		if(!ret){
			console.log(this.data.tags);
			console.log("frame:",this.cur_frame);
		}

		if(this.has_color_transform){
			if(!this.color_transform.apply(this.display_list.canvas))
				return false;
			this.core.ctx.setTransform(1,0,0,1,0,0);
			this.core.ctx.drawImage(this.display_list.canvas,0,0);
			//return false;
		}
		//return false;

		if(!this.playing){
            //if(!this.goto_frame(this.cur_frame)){
            //	return false;
            //}
            this.cur_frame--;
        }


		this.cur_frame++;
		return ret;
	}

	stop(){
		this.debug('stop');
        this.playing=false;
    }

    play(){
		this.debug('play');
        this.playing=true;
    }


    goto_frame(frame){
        this.debug('goto_frame: ',frame);
        /*this.debug('TODO: goto frame');
        console.log(this.timeline);
        console.log(this.data.tags);*/
        let addr = this.timeline.get_address(frame);
        if(addr<0){
        	this.debug('cannot find frame #'+frame);
        	return false;
        }
        this.cur_frame = frame - 1;
        this.cur_tag = addr;
        this.frame_ready = false;
        //this.display_list.abort_frame();
        return true;
    }

    register_avm_object(name, obj){
        this.debug('sprite register object "'+name+'"');
        this.avm_obj[name] = {type:this.avm.VARTYPE_OBJ, val: obj};
    }

    replace_canvas(canvas){
		this.debug('replace canvas');
		this.display_list.replace_canvas(canvas);
	}

	debug(...args){
    	if(this.core.debug_mode){
    		this.core.debug('sprite #'+this.data.spriteID+':',...args);
    	}
    }
}
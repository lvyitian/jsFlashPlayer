class Preloader {
	constructor(core, data){
		this.core = core;
		this.data = data;
		this.is_error = false;

		this.bug_create_image_from_array = core.bug_create_image_from_array.bind(core);
		this.dictionary = core.dictionary;
		this.audio_ctx = core.audio_ctx;
		this.pako = core.pako;
		this.canvas = core.canvas;
		this.ctx = core.ctx;

		let tl = [];
		for(let i=0;i<tag_list.length;i++){
			let tag = tag_list[i];
			if(!tag) continue;
			let name = tag.name;
			if(name.startsWith('Define'))
				tl[i] = tag;
		}
		this.tag_list = tl;

		setTimeout(this.process.bind(this),0);
	}

	get_position(){
		return this.data.cur;
	}

	process(){
		//this.is_error=false;
		let tl = this.tag_list;
		while(this.data.cur<this.data.raw_data.length){
			let tag = this.data.read_tag_data();
	        let tag_processor = tl[tag.code];

	        if(typeof(tag_processor) == "undefined")
	            continue;
	        
	        let ret = (new tag_processor(this,tag)).no_error;
	        if(!ret){
	        	//console.log("preloader stopped");
	        	//this.is_error=true;
	        	return;
    		}
        }

        console.log('preloader done');
	}

	continue_processing(){

		this.process();
	}

	debug(...args){
    	if(this.core.debug_mode){
    		console.debug('flash preloader:',...args);

            var argss = Array.prototype.slice.call(arguments);
            debug.log(argss.join(' '));
    	}
    }
}
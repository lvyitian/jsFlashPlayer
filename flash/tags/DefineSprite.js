class DefineSprite extends genericTag{
	
	read(){

		let o = {};

		o.spriteID = this.read_UI16();
		if(this.core.dictionary.has(o.spriteID))
			return true;
		
		o.frameCount = this.read_UI16();

		o.tags = [];

		let end = false;
		this.current_frame = 0;
		this.timeline = new Timeline();
		this.timeline.add_frame(0,this.current_frame);
		while(!end){
			let t = this.read_tag_data();
			o.tags.push(t);

			if(t.code==1){
                this.current_frame++;
				this.timeline.add_frame(o.tags.length, this.current_frame);
			}

			if(t.code == 43){
				let reader = new DefineFrameLabel(this,t);
				if(!reader.no_error){
					return false;
				}
			}

			if(t.code==0){
				end=true;
				break;
			}
		}
		o.timeline = this.timeline;

		//console.log(o);
		let spr = new Sprite(this.header.code,o, this.core);

		this.core.dictionary.add(o.spriteID,spr);

		return true;
	}

	debug(m){

	}
    set_frame_label(frame, label){
        this.timeline.add_label(frame, label);
    }
}

tag_list[39] = DefineSprite;
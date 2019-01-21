"use strict";

class FlashCore{
    constructor(url){

    	this.debug_mode = true;

        this.debug(url);
        this.raw_data = null;
        this.zipped = false;
        this.cur = 0;
        this.flash_version = 0;
        this.file_length = 0;
        this.frame_size = new Rect(0,0,0,0);
        this.frame_rate = 0;
        this.frames_count = 0;
        this.redraw_interval_id=0;
        this.redraw_timeout_id=0;

        this.skip_tags = [];
        this.sound_stream = null;

        this.dictionary = new Dictionary();
        this.display_list = new DisplayList();
        
        let me = this;
        send_query(url,[],function(data){
            me.raw_data = data;
        	me.process();
        });
    }

    read_UI8(){
        let out = this.raw_data[this.cur] & 0xff;
        this.cur++;
        return out;
    }

    read_UI16(){
    
        let out = 0;
        out  = this.raw_data[this.cur];      this.cur++; 
        out |= ((this.raw_data[this.cur]&0xff) << 8);  this.cur++;
        
        return out;
    }
    
    read_UI32(){
    
        let out = 0;
        out  = this.raw_data[this.cur];      this.cur++; 
        out |= ((this.raw_data[this.cur]&0xff) << 8);  this.cur++;
        out |= ((this.raw_data[this.cur]&0xff) << 16); this.cur++;
        out |= ((this.raw_data[this.cur]&0xff) << 24); this.cur++;
        
        return out;
    }


    read_SB(shift,bitsize){
        let out = 0;
        let temp = this.raw_data[this.cur]; this.cur++;
        let first = true;
        let is_negative=false;
        for(let i=0;i<bitsize-1;i++){

            out |= ((temp << shift) & 0b10000000) > 0 ? 1 : 0;

            //console.log(((temp << shift) & 0b10000000) > 0 ? 1 : 0);

            if(first){
                first=false;
                //checking is negative
                if(out==1){
                    out=-1;
                    is_negative=true;   
                }
            }

            out = out << 1;
            shift++;
            if(shift>7){
                temp = this.raw_data[this.cur]; this.cur++;
                shift = 0;
            }
        }
        shift=(shift+1)%8;
        if(shift!=0)
            this.cur--;
        return { shift : shift, value : out};
    }

    read_UB(shift,bitsize){
        let out = 0;
        let temp = this.raw_data[this.cur]; this.cur++;        
        for(let i=0;i<bitsize-1;i++){

            out |= ((temp << shift) & 0b10000000) > 0 ? 1 : 0;

			//this.debug(((temp << shift) & 0b10000000) > 0 ? 1 : 0);

            out = out << 1;
            shift++;
            if(shift>7){
                temp = this.raw_data[this.cur]; this.cur++;
                shift = 0;
            }
        }
        shift=(shift+1)%8;
        if(shift!=0)
            this.cur--;
        return { shift : shift, value : out};
    }
    
    read_RECT(){
        //bitsize
        let temp = this.raw_data[this.cur];
        let bitsize = temp >> 3;

        let shift=5;
        let Xmin = 0;
        let Xmax = 0;
        let Ymin = 0;
        let Ymax = 0;
        temp = this.read_SB(shift,bitsize);
        Xmin=temp.value;

        temp = this.read_SB(temp.shift,bitsize);
        Xmax = temp.value;

        temp = this.read_SB(temp.shift,bitsize);
        Ymin = temp.value;

        temp = this.read_SB(temp.shift,bitsize);
        Ymax = temp.value;
        if(temp.shift!=0)
            this.cur++;

        let out = new Rect(Xmin,Xmax,Ymin,Ymax);
        return out;
    }

    read_FIXED8(){
        let az = this.read_UI8()/0x100;
        let out = this.read_UI8() + az;
        return out;
    }

    read_header(){
        let decoder = new TextDecoder('utf-8');
        let signature = decoder.decode(this.raw_data.slice(0,3));

        if(signature=='FWS')
            this.zipped = false;
        else if(signature=='CWS')
            this.zipped = true;
        else
            {console.log("Error: unknown signature:"+signature); return false;}
        
        this.debug('zipped:',this.zipped);
        this.cur=3;
        
        this.flash_version = this.read_UI8();
        this.debug('flash version:',this.flash_version);
        
        this.file_length = this.read_UI32();
        this.debug('file length:',this.file_length);
        this.debug('raw data length:', this.raw_data.length);

        if(this.zipped){
            this.debug('inflating');
            let pako = window.pako;
            this.raw_data = pako.inflate(this.raw_data.slice(8));
            this.cur=0;
            this.debug('raw data length:', this.raw_data.length);
        }

        this.frame_size = this.read_RECT();
        this.debug('frame size: '+(this.frame_size.Xmax/20)+'x'+(this.frame_size.Ymax/20));

        this.frame_rate = this.read_FIXED8();
        this.debug('frame rate:', this.frame_rate);

        this.frames_count = this.read_UI16();
        this.debug('frames count:',this.frames_count);
        return true;
    }

    read_tag_info(){
        let temp = this.read_UI16();
        let tag_code = (temp >> 6) & 0b1111111111;
        let tag_length = temp & 0b111111;

        if(tag_length==63){
            tag_length = this.read_UI32();
        }

        //console.log('tag_code: '+tag_code);
        //console.log('tag_length: '+tag_length);
        return {code:tag_code, length:tag_length};
    }

    read_MATRIX(){
        
    }

    process(){
        if(!this.read_header()){
            return;
        }

        this.draw();
        
    }

    draw(){
        let me = this;
        me.redraw_timeout_id = setTimeout(function() {
            me.redraw_interval_id = requestAnimationFrame(me.draw);
            
            for(let i=0;i<me.raw_data.length;i++){
                if(!me.process_tag()){
                    clearTimeout(me.redraw_timeout_id);
                    cancelAnimationFrame(me.redraw_interval_id);
                    return false;
                }
            }

        }, 1000 / me.frame_rate);
    }

    process_SoundStreamHead2(){
		this.debug('tag SoundStreamHead2');
		let shift=4;
		let temp = this.read_UI8();

		let playbackSoundRate = (temp >> 2) & 0b11;
		let playbackSoundSize = (temp >> 1) & 1;
		let playbackSoundType = temp & 1;

		/*this.debug('playbackSoundRate:',playbackSoundRate);
		this.debug('playbackSoundSize:',playbackSoundSize);
		this.debug('playbackSoundType:',playbackSoundType);*/

		temp = this.read_UI8();
		let streamSoundCompression = (temp>>4)&0b1111;
		let streamSoundRate = (temp>>2)&0b11;
		let streamSoundSize = (temp>>1)&1;
		let streamSoundType = temp&1;

		/*this.debug('streamSoundCompression:',streamSoundCompression);
		this.debug('streamSoundRate:',streamSoundRate);
		this.debug('streamSoundSize:',streamSoundSize);
		this.debug('streamSoundType:',streamSoundType);*/

		let streamSoundSampleCount = this.read_UI16();
		//this.debug('streamSoundSampleCount:',streamSoundSampleCount);
		
		let latencySeek = 0;

		if(streamSoundCompression==2){ //mp3
			latencySeek = this.read_UI16();
			//this.debug('latencySeek:',latencySeek);
		}

		this.sound_stream = new SoundStream(
			playbackSoundRate,
			playbackSoundSize,
			playbackSoundType,
			streamSoundCompression,
			streamSoundRate,
			streamSoundSize,
			streamSoundType,
			streamSoundSampleCount,
			latencySeek
			);

		//this.debug(this.sound_stream);
    }
    process_DefineVideoStream(){
		this.debug('tag DefineVideoStream');
		
		let object = {
			type: this.dictionary.TypeVideoStream,
			typeName : 'VideoStream',
			characterID : this.read_UI16(),
			numFrames : this.read_UI16(),
			width : this.read_UI16(),
			height : this.read_UI16()
		}

		let temp = this.read_UI8();

		object.videoFlagsDeblocking = (temp>>1)&0b111;
		object.videoFlagsSmoothing = temp & 1;
		
		object.codecID = this.read_UI8();

		this.dictionary.add(object.characterID,object);
    }

    process_PlaceObject2(){
        this.debug('tag PlaceObject2');
        let flags = this.read_UI8();

        let obj = {
            HasClipActions  : (flags & 0b10000000)>0,
            HasClipDepth    : (flags & 0b01000000)>0,
            HasName         : (flags & 0b00100000)>0,
            HasRatio        : (flags & 0b00010000)>0,
            HasColorTransform:(flags & 0b00001000)>0,
            HasMatrix       : (flags & 0b00000100)>0,
            HasCharacter    : (flags & 0b00000010)>0,
            Move            : (flags & 0b00000001)>0,
            Depth : this.read_UI16()
    	};

        if(obj.HasCharacter){
            obj.characterID = this.read_UI16();
        }
        if(obj.HasMatrix){
            obj.matrix = this.read_MATRIX();
        }

        this.debug(obj);
    }

    process_tag(){
        let tag = this.read_tag_info();

        switch(tag.code){
        	case 26:
        		this.process_PlaceObject2();
        		return false;
        	break;
            case 45:
            	this.process_SoundStreamHead2();
            break;
            case 60:
            	this.process_DefineVideoStream();
            break;
            default:
                if(this.skip_tags.indexOf(tag.code)>0){
                    this.cur+=tag.length;
                    return true;
                }
                console.log("unimplemented tag: #"+tag.code);
                let skip = confirm('Skip unimplemented tag #'+tag.code+' ?');
                this.cur+=tag.length;
                if(skip){
                    this.skip_tags.push(tag.code);
		            return true;
                }
                return false;
            break;
        }
        return true;
    }


    debug(...args){
    	if(this.debug_mode){
    		console.log('flash:',...args);
    	}
    }

    print_address(){
        console.log('address:', '0x'+this.cur.toString(16));
    }
}


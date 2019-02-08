"use strict";

class FlashCore{
    constructor(url,canvas){

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

        this.action_script3 = false;
        this.file_attributes = {};

        this.skip_tags = [];
        this.sound_stream = null;

        this.dictionary = new Dictionary(this);
        this.display_list = new DisplayList(canvas,this.dictionary);
        this.canvas = canvas;
        this.audio_ctx = new window.AudioContext();

        this.last_redraw_time = 0;
        this.redraw_interval_id=0;

        this.reset_address=-1;
        
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

    read_SI16(){
        let out = this.read_UI16();
        if(out>=0x8000){
            out = 0 - out + 0x8000;
        }
        return out;
    }
    
    read_UI32(){
    
        let out = 0;
        out  = this.raw_data[this.cur];      this.cur++; 
        out |= ((this.raw_data[this.cur]&0xff) << 8);  this.cur++;
        out |= ((this.raw_data[this.cur]&0xff) << 16); this.cur++;
        out |= ((this.raw_data[this.cur]&0xff) << 24); this.cur++;
        
        return out>>>0;
    }


    read_SB(shift,bitsize){
        let out = 0;
        let temp = this.raw_data[this.cur]; this.cur++;
        let first = true;
        let is_negative=false;
        for(let i=0;i<bitsize;i++){

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
            if((i+1)<bitsize)
                out = out << 1;
            shift++;
            if(shift>7){
                temp = this.raw_data[this.cur]; this.cur++;
                shift = 0;
            }
        }
        //shift=(shift+1)%8;
        /*if(shift!=0)
            this.cur--;*/
        this.cur--;
        return { shift : shift, value : out};
    }

    read_UB(shift,bitsize){
        let out = 0;
        let temp = this.raw_data[this.cur]; this.cur++;        
        for(let i=0;i<bitsize;i++){

            out |= ((temp << shift) & 0b10000000) > 0 ? 1 : 0;

			//this.debug(((temp << shift) & 0b10000000) > 0 ? 1 : 0);

            if((i+1)<bitsize)
                out = out << 1;
            shift++;
            if(shift>7){
                temp = this.raw_data[this.cur]; this.cur++;
                shift = 0;
            }
        }
        //shift=(shift+1)%8;
        /*if(shift!=0)
            this.cur--;*/
        this.cur--; 
        return { shift : shift, value : out};
    }

    read_FB(shift,bitsize){
        let temp = this.read_UB(shift, bitsize);
        temp.value = (temp.value>>16)+(temp.value&0xFFFF)/0x10000;
        return temp;
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

        this.canvas.width = this.frame_size.Xmax/20;
        this.canvas.height = this.frame_size.Ymax/20;

        this.frame_rate = this.read_FIXED8();
        this.debug('frame rate:', this.frame_rate);

        this.frames_count = this.read_UI16();
        this.debug('frames count:',this.frames_count);

        this.reset_address = this.cur;
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
        
        let matrix = {
            has_scale: false,
            has_rotate: false,
            scaleX: 1,
            scaleY: 1,
            translateX: 0,
            translateY: 0,
            rotateSkew0:0,
            rotateSkew1:0
        }
        //scale
        let temp = this.read_UB(0,1);
        matrix.has_scale = (temp.value==1);
        if(matrix.has_scale){
            temp = this.read_UB(temp.shift, 5);
            let bitsize = temp.value;
            temp = this.read_FB(temp.shift, bitsize);
            matrix.scaleX = temp.value;

            temp = this.read_FB(temp.shift, bitsize);
            matrix.scaleY = temp.value;

        }

        //rotate
        temp = this.read_UB(temp.shift,1);
        matrix.has_rotate = (temp.value==1);
        if(matrix.has_rotate){
            temp = this.read_UB(temp.shift, 5);
            let bitsize = temp.value;
            temp = this.read_FB(temp.shift, bitsize);
            matrix.rotateSkew0 = temp.value;

            temp = this.read_FB(temp.shift, bitsize);
            matrix.rotateSkew1 = temp.value;

        }

        //translate
        temp = this.read_UB(temp.shift, 5);
        let bitsize = temp.value;
        temp = this.read_SB(temp.shift, bitsize);
        matrix.translateX = temp.value;
        
        //this.debug('shift:'+temp.shift);
        temp = this.read_SB(temp.shift, bitsize);
        matrix.translateY = temp.value;
        
        //this.debug('shift:'+temp.shift);
        if(temp.shift!=0)
            this.cur++;

        return matrix;
    }

    read_STRING(){
        let start = this.cur;
        let end = start;
        while(this.raw_data[end]!=0){
            end++;
        }
        let decoder = new TextDecoder('utf-8'); //TODO: Make Shift-Jis  Version
        let out = decoder.decode(this.raw_data.slice(start,end));
        this.cur = end+1;
        return out;
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
            type : this.display_list.TYPE_PlaceObject2,
            typeName : 'PlaceObject2',
            hasClipActions  : (flags & 0b10000000)>0,
            hasClipDepth    : (flags & 0b01000000)>0,
            hasName         : (flags & 0b00100000)>0,
            hasRatio        : (flags & 0b00010000)>0,
            hasColorTransform:(flags & 0b00001000)>0,
            hasMatrix       : (flags & 0b00000100)>0,
            hasCharacter    : (flags & 0b00000010)>0,
            move            : (flags & 0b00000001)>0,
            depth : 0
    	};
        obj.depth = this.read_UI16();

        if(!obj.hasCharacter){
            let tobj = this.display_list.get_by_depth(obj.depth);
            if(tobj.type=obj.type){
                tobj.hasClipActions = obj.hasClipActions;
                tobj.hasClipDepth   = obj.hasClipDepth;
                tobj.hasName   = obj.hasName;
                tobj.hasRatio   = obj.hasRatio;
                tobj.hasColorTransform   = obj.hasColorTransform;
                tobj.hasMatrix   = obj.hasMatrix;
                tobj.hasCharacter   = obj.hasCharacter;
                tobj.move   = obj.move;
                obj = tobj;
            }
        }

        if(obj.hasCharacter){
            obj.characterID = this.read_UI16();
        }
        if(obj.hasMatrix){
            obj.matrix = this.read_MATRIX();
            if(obj.matrix===false) return false;
        }
        if(obj.hasColorTransform){
            alett('TODO: Reading ColorTransform from PlaceObject2!');
            return false;
        }
        if(obj.hasRatio){
            obj.ratio = this.read_UI16();
        }
        if(obj.hasName){
            obj.name = this.read_STRING();
        }
        if(obj.hasClipDepth){
            obj.clipDepth = this.read_UI16();
        }
        if(obj.hasClipActions){
            alert('TODO: Reading ClipActions from PlaceObject2!');
            return false;   
        }

        this.display_list.add(obj.depth,obj);
        
        return true;
    }

    process_VideoFrame(end_address){
        this.debug('tag VideoFrame');
        let frame = {
            streamId : -1,
            frameNum : -1,
            videoData : null
        }

        frame.streamId = this.read_UI16();
        frame.frameNum = this.read_UI16();

        let stream = this.dictionary.get(frame.streamId);
        if(stream.type!=this.dictionary.TypeVideoStream){
            alert('Error: VideoFrame pointing to not VideoStream block!');
            return false;
        }

        //copying video packet to video stream
        frame.videoData = this.raw_data.slice(this.cur,end_address);

        if(stream.frames==undefined)
            stream.frames = [];
        stream.frames[frame.frameNum] = frame.videoData;

        //this.save_blob(frame.videoData);
        return true;
    }

    process_ShowFrame(){
        this.debug('tag ShowFrame');
        return this.display_list.draw();
    }

    process_FileAttributes(){
        this.debug('tag FileAttributes');
        let obj = {};
        let t = this.read_UI8();

        obj.hardwareAcceleration = ((t & 0b01000000) > 0);
        obj.useGPU =        ((t & 0b00100000) > 0);
        obj.hasMetadata =   ((t & 0b00010000) > 0);
        obj.actionScript3 = ((t & 0b00001000) > 0);
        obj.useNetwork =    ((t & 0b00000001) > 0);

        this.cur+=3;
        this.action_script3 = obj.actionScript3;
        return true;
    }

    process_SetBackgroundColor(){
        this.debug('tag SetBackgroundColor');
        let r = this.read_UI8();
        let g = this.read_UI8();
        let b = this.read_UI8();
        this.display_list.set_background_color(r,g,b);
        return true;
    }

    process_SoundStreamBlock(length){
        this.debug('tag SoundStreamBlock');
        let start_cur = this.cur;
        
        let sstream = this.sound_stream;
        this.debug(sstream);
        switch (sstream.streamSoundCompression) {
            case 2:{
                
                let obj={};
                let data = (new Uint8Array(this.raw_data.buffer,this.cur+4,length-4)).slice(0);

                if(this.bcounter==undefined)
                    this.bcounter=0;
                this.bcounter++;
                this.append_blob(data);
                if(this.bcounter<1000)
                    return true;

                this.save_blob(this.blob);

                /*console.log("encoded:",data);
                this.audio_ctx.decodeAudioData(data.buffer,function(decoded){
                    console.log('decoded',decoded);
                });*/





                /*

                while(this.cur<start_cur+length){

                    let temp  = this.read_UB(0, 11);
                    console.log(temp.value.toString(16));
                    while(temp.value!=0x7FF) {
                        temp = this.read_UB(0, 11);
                        console.log(temp.value.toString(16));
                        if(this.cur>start_cur+length) break;
                    }

                    temp=this.read_UB(temp.shift, 2);
                    obj.mpeg_version = temp.value;
                    temp=this.read_UB(temp.shift, 2);
                    obj.layer = temp.value;
                    temp=this.read_UB(temp.shift, 1);
                    obj.protection = temp.value;
                    temp=this.read_UB(temp.shift, 4);
                    obj.bitrate = temp.value;
                    temp=this.read_UB(temp.shift, 2);
                    obj.samplingRate = temp.value;
                    temp=this.read_UB(temp.shift, 1);
                    obj.paddingBit = temp.value;

                    temp.shift=0;
                    this.cur++;

                    temp=this.read_UB(temp.shift, 2);
                    obj.channelMode = temp.value;
                    temp=this.read_UB(temp.shift, 2);
                    obj.modeExtension = temp.value;
                    temp=this.read_UB(temp.shift, 1);
                    obj.copyright = temp.value;
                    temp=this.read_UB(temp.shift, 1);
                    obj.original = temp.value;
                    temp=this.read_UB(temp.shift, 2);
                    obj.emphasis = temp.value;

                    console.log(temp);

                    let bitrate_table_mpeg1 = [0,32,40,48,56,64,80,96,112,128,160,192,224,256,320,-1];
                    let bitrate_table_mpeg2 = [0,8,16,24,32,40,48,56,64,80,96,112,128,144,160,-1];

                    obj.bitrate_value = (obj.mpeg_version == 3) ? bitrate_table_mpeg1[obj.bitrate]*1000 : bitrate_table_mpeg2[obj.bitrate]*1000;

                    let sample_rate_table_mpeg1   = [44100,48000,32000];
                    let sample_rate_table_mpeg2   = [22050,24000,16000];
                    let sample_rate_table_mpeg2_5 = [11025,12000,8000];

                    obj.sample_rate_value = (obj.mpeg_version == 3) ? 
                        sample_rate_table_mpeg1[obj.samplingRate] : 
                        (
                            (obj.mpeg_version == 2) ? 
                            sample_rate_table_mpeg2[obj.samplingRate] : 
                            sample_rate_table_mpeg2_5[obj.samplingRate]
                        );

                    obj.data_size = Math.floor((((obj.mpeg_version == 3) ? 144 : 72 ) * obj.bitrate_value) / obj.sample_rate_value + obj.paddingBit-4);


                    

                    /*if(sstream.buffer == undefined){
                        sstream.buffer = this.audio_ctx.createBuffer(sstream.get_channels_count(),2*sstream.get_sample_rate(),sstream.get_sample_rate());
                    }*/

                    
                    /*

                    this.cur+=obj.data_size;
                    this.debug(obj);

                }*/




                return false;
                }break;
            default:
                alert("TODO: SoundStreamBlock compression "+sstream.streamSoundCompression);
                return false;
                break;
        }

        return false;
    }

    process_tag(){
        let tag = this.read_tag_info();
        //let tag_data = new Uint8Array(this.raw_data.buffer,this.cur,tag.length);

        switch(tag.code){
            case 0: //END OF FILE
                return this.reset();
            break;
            case 1:
                if(this.process_ShowFrame()) {
                    this.cur+=tag.length;
                    return 2;
                }else return false;
            break;
            case 9:
                return this.process_SetBackgroundColor();
            break;
            case 19:{
                let next=this.cur+tag.length;
                let t = this.process_SoundStreamBlock(tag.length);
                if(!t)
                    return false;
                this.cur=next;
            }
            break;
        	case 26:
        		if(!this.process_PlaceObject2()) return false;
        	break;
            case 45:
            	this.process_SoundStreamHead2();
            break;
            case 60:
            	this.process_DefineVideoStream();
            break;
            case 61:
                {
                    let start = this.cur;
                    let end_address = start+tag.length;
                    if(!this.process_VideoFrame(end_address)) return false;
                    this.cur=end_address;
                }
            break;
            case 69:
                return this.process_FileAttributes();
            break;
            default:
                if(this.skip_tags.indexOf(tag.code)>=0){
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

    process(){
        if(!this.read_header()){
            return;
        }

        this.draw();
        
    }

    reset(){
        if(this.reset_address<0)
            return false;
        this.cur=this.reset_address;
        return true;
    }

    draw(){

        let interval_time = 1000 / this.frame_rate;

        let curtime = Date.now();
        let diff = curtime - this.last_redraw_time;
    
        this.redraw_interval_id = requestAnimationFrame(this.draw.bind(this));

        if(diff<interval_time) return;
        this.last_redraw_time += interval_time;

        if(diff>1000)
            this.last_redraw_time = Date.now();

        for(let i=0;i<this.raw_data.length;i++){
            let ret = this.process_tag();

            if(ret === false){
                cancelAnimationFrame(this.redraw_interval_id);
                return false;
            }
            if(ret===2){
                break;
            }
        }
        
    }


    debug(...args){
    	if(this.debug_mode){
    		console.log('flash:',...args);
    	}
    }

    print_address(){
        console.log('address:', '0x'+this.cur.toString(16));
    }


    append_blob(in_array){
        if(this.blob == undefined)
            this.blob = new Uint8Array(0);

        let t = new Uint8Array(this.blob.length+in_array.length);
        t.set(this.blob);
        t.set(in_array, this.blob.length);
        this.blob=t;
    }

    save_blob(bytes){
        var blob = new Blob([bytes], {type: "application/octet-stream"});
        var link = document.createElement('a');
        link.href = window.URL.createObjectURL(blob);
        var fileName = 'binary_data';
        link.download = fileName;
        document.body.appendChild(link);
        link.click();
        this.blob = new Uint8Array(0);
    }
}
    
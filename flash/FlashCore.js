"use strict";

class FlashCore{
    constructor(url,canvas){
    	this.debug_mode = true;

        this.debug(url);
        this.raw_data = null;
        this.zipped = false;
        this.data = null;
        this.flash_version = 0;
        this.file_length = 0;
        this.frame_size = new Rect(0,0,0,0);
        this.frame_rate = 0;
        this.frames_count = 0;

        this.current_frame = 0;

        this.action_script3 = false;
        this.file_attributes = {};

        this.skip_tags = [];
        this.sound_stream = null;

        this.dictionary = new Dictionary(this);
        this.display_list = new DisplayList(canvas,this.dictionary);
        this.avm2 = new AVM2();

        this.canvas = canvas;
        this.audio_ctx = new window.AudioContext();
        this.sceneLabelsInfo = null;

        this.last_redraw_time = 0;
        this.redraw_interval_id=0;

        this.reset_address=-1;
        this.playing = true;
        this.pako=null;
        
        
        let me = this;
        debug.log('Loading...');
        send_query(url,[],function(data){
            me.raw_data = data;
            me.data = new FlashParser(me.raw_data);
            me.process();
         },me.download_progress);

        
    }

    setPako(p){
        this.pako=p;
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
        let data= this.data;
        data.cur=3;
        
        this.flash_version = data.read_UI8();
        this.debug('flash version:',this.flash_version);
        
        this.file_length = data.read_UI32();
        this.debug('file length:',this.file_length);
        this.debug('raw data length:', this.raw_data.length);

        if(this.zipped){
            this.debug('inflating');
            let pako = this.pako;
            try {
                this.raw_data = pako.inflate(this.raw_data.slice(8));
            } catch(e) {
                console.log(e);
                return false;
            }
            
            this.data = new FlashParser(this.raw_data);
            data = this.data;
            data.cur=0;
            this.debug('raw data length:', this.raw_data.length);
        }

        this.frame_size = data.read_RECT();
        this.debug('frame size: '+(this.frame_size.Xmax/20)+'x'+(this.frame_size.Ymax/20));

        this.canvas.width = this.frame_size.Xmax/20;
        this.canvas.height = this.frame_size.Ymax/20;

        this.frame_rate = data.read_FIXED8();
        this.debug('frame rate:', this.frame_rate);

        this.frames_count = data.read_UI16();
        this.debug('frames count:',this.frames_count);

        this.reset_address = data.cur;
        return true;
    }

    read_tag_info(){
        let temp = this.data.read_UI16();
        let tag_code = (temp >> 6) & 0b1111111111;
        let tag_length = temp & 0b111111;

        if(tag_length==63){
            tag_length = this.data.read_UI32();
        }

        //console.log('tag_code: '+tag_code);
        //console.log('tag_length: '+tag_length);
        return {code:tag_code, length:tag_length};
    }

    process_SoundStreamHead2(){
		this.debug('tag SoundStreamHead2');
		let shift=4;
		let temp = this.data.read_UI8();

		let playbackSoundRate = (temp >> 2) & 0b11;
		let playbackSoundSize = (temp >> 1) & 1;
		let playbackSoundType = temp & 1;

		/*this.debug('playbackSoundRate:',playbackSoundRate);
		this.debug('playbackSoundSize:',playbackSoundSize);
		this.debug('playbackSoundType:',playbackSoundType);*/

		temp = this.data.read_UI8();
		let streamSoundCompression = (temp>>4)&0b1111;
		let streamSoundRate = (temp>>2)&0b11;
		let streamSoundSize = (temp>>1)&1;
		let streamSoundType = temp&1;

		/*this.debug('streamSoundCompression:',streamSoundCompression);
		this.debug('streamSoundRate:',streamSoundRate);
		this.debug('streamSoundSize:',streamSoundSize);
		this.debug('streamSoundType:',streamSoundType);*/

		let streamSoundSampleCount = this.data.read_UI16();
		//this.debug('streamSoundSampleCount:',streamSoundSampleCount);'
		
		let latencySeek = 0;

		if(streamSoundCompression==2){ //mp3
			latencySeek = this.data.read_UI16();
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
			latencySeek,
            this
			);

		//this.debug(this.sound_stream);
    }
    process_DefineVideoStream(){
		this.debug('tag DefineVideoStream');
		
		let object = {
			type: this.dictionary.TypeVideoStream,
			typeName : 'VideoStream',
			characterID : this.data.read_UI16(),
			numFrames : this.data.read_UI16(),
			width : this.data.read_UI16(),
			height : this.data.read_UI16()
		}

		let temp = this.data.read_UI8();

		object.videoFlagsDeblocking = (temp>>1)&0b111;
		object.videoFlagsSmoothing = temp & 1;
		
		object.codecID = this.data.read_UI8();

		this.dictionary.add(object.characterID,object);
    }

    process_PlaceObject2(){
        this.debug('tag PlaceObject2');
        let flags = this.data.read_UI8();

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
        obj.depth = this.data.read_UI16();

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
            obj.characterID = this.data.read_UI16();
        }
        if(obj.hasMatrix){
            obj.matrix = this.data.read_MATRIX();
            if(obj.matrix===false) return false;
        }
        if(obj.hasColorTransform){
            alett('TODO: Reading ColorTransform from PlaceObject2!');
            return false;
        }
        if(obj.hasRatio){
            obj.ratio = this.data.read_UI16();
        }
        if(obj.hasName){
            obj.name = this.data.read_STRING();
        }
        if(obj.hasClipDepth){
            obj.clipDepth = this.data.read_UI16();
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

        frame.streamId = this.data.read_UI16();
        frame.frameNum = this.data.read_UI16();

        let stream = this.dictionary.get(frame.streamId);
        if(stream.type!=this.dictionary.TypeVideoStream){
            alert('Error: VideoFrame pointing to not VideoStream block!');
            return false;
        }

        //copying video packet to video stream
        frame.videoData = this.raw_data.slice(this.data.cur,end_address);

        if(stream.frames==undefined)
            stream.frames = [];
        stream.frames[frame.frameNum] = frame.videoData;

        //this.save_blob(frame.videoData);
        return true;
    }

    process_ShowFrame(){
        this.debug('tag ShowFrame');
        debug.stop();

        let ret = this.display_list.draw();

        let sstream =this.sound_stream;
        //console.log(sstream);
        //return false;
        if(sstream!==null){
            if(sstream.state==sstream.STATE_IDLE)
                sstream.play();
        }

        /*if(this.current_frame==0){
            this.reset_address = this.data.cur;
        }*/

        this.current_frame++;
        return ret;
    }

    process_FileAttributes(){
        this.debug('tag FileAttributes');
        let obj = {};
        let t = this.data.read_UI8();

        obj.hardwareAcceleration = ((t & 0b01000000) > 0);
        obj.useGPU =        ((t & 0b00100000) > 0);
        obj.hasMetadata =   ((t & 0b00010000) > 0);
        obj.actionScript3 = ((t & 0b00001000) > 0);
        obj.useNetwork =    ((t & 0b00000001) > 0);

        this.file_attributes = obj;

        this.data.cur+=3;
        this.action_script3 = obj.actionScript3;
        return true;
    }

    process_SetBackgroundColor(){
        this.debug('tag SetBackgroundColor');
        let r = this.data.read_UI8();
        let g = this.data.read_UI8();
        let b = this.data.read_UI8();
        this.display_list.set_background_color(r,g,b);
        return true;
    }

    count_mp3_frames(mp3_data){

        let frames_count=0;
        let cur=0;

        while(cur<mp3_data.length){

            let obj={};

            let header = mp3_data[cur]<<24; cur++;
            header |= mp3_data[cur]<<16; cur++;
            header |= mp3_data[cur]<<8; cur++;
            header |= mp3_data[cur]; cur++;

            if(((header>>21)&0x7ff) != 0x7ff){
                return frames_count;
            }

            frames_count++;

            obj.mpeg_version = (header>>19) & 0b11;
            obj.layer = (header>>17) & 0b11;
            obj.protection = (header>>16) & 0b1;
            obj.bitrate = (header>>12) & 0b1111;
            obj.samplingRate = (header>>10) & 0b11;
            obj.paddingBit = (header>>9) & 0b1;

            obj.channelMode = (header>>6) & 0b11;
            obj.modeExtension = (header>>4) & 0b11;
            obj.copyright = (header>>3) & 0b1;
            obj.original = (header>>2) & 0b1;
            obj.emphasis = header & 0b11;

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


            cur+=obj.data_size;
        }
        return frames_count;
    }

    process_SoundStreamBlock(length){
        this.debug('tag SoundStreamBlock');
        
        let sstream = this.sound_stream;
        //this.debug(sstream);
        switch (sstream.streamSoundCompression) {
            case 2:{
                
                let obj={};
                let data = (new Uint8Array(this.raw_data.buffer,this.data.cur+4,length-4)).slice(0);


                let frames_count = this.count_mp3_frames(data);
                
                sstream.append_cbuffer(data,frames_count);

                return true;

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
        let tag_data = new Uint8Array(this.raw_data.buffer,this.data.cur,tag.length);
        let tag_obj = {
            header: tag,
            data: tag_data
        };

        //console.log(tag_obj);

        switch(tag.code){
            case 0: //END OF FILE
                this.debug('EndOfFile');

                return false;
                return this.reset();
            break;
            case 1:
                if(this.process_ShowFrame()) {
                    this.data.cur+=tag.length;
                    return 2;
                }else return false;
            break;
            case 2: //DefineShape
                this.data.cur+=tag.length;
                return (new DefineShape(this,tag_obj)).no_error;
            case 9:
                return this.process_SetBackgroundColor();
            break;
            case 10:
                this.data.cur+=tag.length;
                return (new DefineFont(this,tag_obj)).no_error;
            break;
            case 11:
                this.data.cur+=tag.length;
                return (new DefineText(this,tag_obj)).no_error;
            break;
            case 13:
            	this.data.cur+=tag.length;
                return (new DefineFontInfo(this,tag_obj)).no_error;
            break;
            case 14: //DefineSound
                this.data.cur+=tag.length;
                return (new DefineSound(this,tag_obj)).no_error;
            break;
            case 15: //StartSound
                this.data.cur+=tag.length;
                return (new StartSound(this,tag_obj)).no_error;
            break;
            case 18:
                this.data.cur+=tag.length;
                return (new SoundStreamHead(this,tag_obj)).no_error;
            break;
            case 19:{
                let next=this.data.cur+tag.length;
                let t = this.process_SoundStreamBlock(tag.length);
                if(!t)
                    return false;
                this.data.cur=next;
                break;
            }
            case 20:
                this.data.cur+=tag.length;
                return (new DefineBitsLossless(this,tag_obj)).no_error;
            break;
            case 24: //protect
                this.data.cur+=tag.length;
            break;
        	case 26:
        		if(!this.process_PlaceObject2()) return false;
        	break;
            case 36:
                this.data.cur+=tag.length;
                return (new DefineBitsLossless2(this,tag_obj)).no_error;
            break;
        	case 37:
        		this.data.cur+=tag.length;
                return (new DefineEditText(this,tag_obj)).no_error;
        	break;
            case 39:
                this.data.cur+=tag.length;
                return (new DefineSprite(this,tag_obj)).no_error;
            break;
            case 45:
            	this.process_SoundStreamHead2();
            break;
            case 48:
                this.data.cur+=tag.length;
                return (new DefineFont2(this,tag_obj)).no_error;
            break;
            case 60:
            	this.process_DefineVideoStream();
            break;
            case 61:
                {
                    let start = this.data.cur;
                    let end_address = start+tag.length;
                    if(!this.process_VideoFrame(end_address)) return false;
                    this.data.cur=end_address;
                }
            break;
            case 62:
                this.data.cur+=tag.length;
                return (new DefineFontInfo2(this,tag_obj)).no_error;
            break;
            case 69:
                return this.process_FileAttributes();
            break;
            case 82:{
                let t = new DoABC(this,tag_obj);
                this.data.cur+=tag.length;
                return t.no_error;
            }break;

            case 86:{
                let t = new DefineSceneAndFrameLabelData(this,tag_obj);
                this.data.cur+=tag.length;
                return t.no_error;
            }
            break;
            default:
                if(this.skip_tags.indexOf(tag.code)>=0){
                    this.data.cur+=tag.length;
                    return true;
                }
                console.log("unimplemented tag: #"+tag.code);
                let skip = confirm('Skip unimplemented tag #'+tag.code+' ?');
                this.data.cur+=tag.length;
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
        this.data.cur=this.reset_address;
        this.current_frame = 0;
        return true;
    }

    draw(){
        /*if(this.do_stop===true)
            return false;*/
        //console.log('draw');

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

            if((ret === false) || (!this.playing)){
                //console.log('stop');
                //this.do_stop=true;
                cancelAnimationFrame(this.redraw_interval_id);
                /*let ctx = this.canvas.getContext('2d');
                debug.start(ctx);*/
                //console.log('stopped by error');
                return false;
            }
            if(ret===2){
                break;
            }
        }
        
    }

    stop(){
        this.playing=false;
    }

    debug(...args){
    	if(this.debug_mode){
    		console.log('flash:',...args);
    	}
    }

    print_address(){
        console.log('address:', '0x'+this.data.cur.toString(16));
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

    download_progress(e){
        let loaded = e.loaded;
        let total = e.total;
        let precent = 100*loaded/total;
        debug.update('Loading '+precent+'% ('+loaded+'/'+total+')');
    }

    //workaround firefox bugs
    bug_create_image_from_array(image_array, width, height){
        let obj = {
            bitmap  : image_array,
            width   : width,
            height  : height
        }
        window.wrappedJSObject.__flashplayer_temp_data=cloneInto(obj,window);
        let script = document.createElement('script');
        script.innerHTML='__flashplayer_generate_image_from_array();';
        document.head.appendChild(script);
        script.remove();
        let src = window.wrappedJSObject.__flashplayer_temp_data.image;
        let img = new Image();
        img.src = src;
        return img;
    }
}
    

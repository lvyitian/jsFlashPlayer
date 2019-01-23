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
            alett('TODO: Reading ClipActions from PlaceObject2!');
            return false;   
        }

        this.display_list.add(obj.depth,obj);
        
        return true;
    }

    read_H263VIDEOPACKET(){

    

        this.debug('H263VIDEOPACKET');
        let packet = {};

        let temp = this.read_UB(0, 17);
        let PictureStartCode = temp.value;
        this.debug('PictureStartCode:',PictureStartCode);
        if(PictureStartCode!=1){
            alert('Error Processing H263VIDEOPACKET');
            return false;
        }

        temp = this.read_UB(temp.shift, 5);
        packet.version = temp.value;

        temp = this.read_UB(temp.shift, 8);
        packet.temporalReference = temp.value;

        temp = this.read_UB(temp.shift, 3);
        packet.pictureSize = temp.value;

        if(packet.pictureSize == 0){
            temp = this.read_UB(temp.shift, 8);
            packet.customWidth = temp.value;
            temp = this.read_UB(temp.shift, 8);
            packet.customHeight = temp.value;
        }
        if(packet.pictureSize == 1){
            temp = this.read_UB(temp.shift, 16);
            packet.customWidth = temp.value;
            temp = this.read_UB(temp.shift, 16);
            packet.customHeight = temp.value;
        }

        temp = this.read_UB(temp.shift, 2);
        packet.pictureType = temp.value;

        temp = this.read_UB(temp.shift, 1);
        packet.deblockingFlag = temp.value;

        temp = this.read_UB(temp.shift, 5);
        packet.quantizer = temp.value;

        temp = this.read_UB(temp.shift, 1);
        packet.extraInfoFlag = temp.value;
        if(packet.extraInfoFlag==1){
            alert('TODO: H263VIDEOPACKET reading extraInfo!');
            return false;
        }
        

        let macro = {};
        temp = this.read_UB(temp.shift, 1);
        macro.codedMacroblockFlag = temp.value;

        if(macro.codedMacroblockFlag == 0){
            alert('TODO: H263VIDEOPACKET reading macroblock!');
            return false;
        }

        let block = {};
        temp = this.read_UB(temp.shift, 8);
        block.INTRADC = temp.value;

        this.debug(block);

        packet.macroblock = macro;

        if(temp.shift!=0)
            this.cur++;

        return packet;
    }

    process_VideoFrame(){
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

        if(stream.codecID != 2){
            alert('TODO: Video Frame of codec '+stream.codecID);
            return false;
        }

        //codecID = 2

        frame.videoData = this.read_H263VIDEOPACKET();
        if(frame.videoData===false) return false;

        if(stream.frames==undefined)
            stream.frames = [];
        stream.frames[frame.frameNum] = frame.videoData;
        return true;
    }

    process_tag(){
        let tag = this.read_tag_info();

        switch(tag.code){
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
                    if(!this.process_VideoFrame()) return false;
                    let size = this.cur - start;
                    this.debug('readed:',size,'real_size:',tag.length);
                    return false;
                }
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
    
"use strict";

class FlashCore{
    constructor(url,canvas){
    	this.debug_mode = false;

        this.debug(url);
        this.raw_data = null;
        this.zipped = false;
        this.lzma_zipped = false;
        this.data = null;
        this.flash_version = 0;
        this.file_length = 0;
        this.frame_size = new Rect(0,0,0,0);
        this.frame_rate = 0;
        this.frames_count = 0;

        this.current_frame = 0;
        this.timeline = new Timeline(this);

        this.action_script3 = false;
        this.file_attributes = {};

        this.skip_tags = [];
        this.sound_stream = null;

        this.dictionary = new Dictionary(this);
        this.display_list = new DisplayList(canvas,this.dictionary);
        this.avm2 = new AVM2();
        this.avm = new AVM(this);
        this.preloader = null;

        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.audio_ctx = new window.AudioContext();
        this.sceneLabelsInfo = null;

        this.last_redraw_time = 0;
        this.redraw_interval_id=0;

        this.reset_address=-1;
        this.last_tag_addr=-1;
        this.playing = true;
        this.pako=null;

        this.do_frame_finish=false;


        this.is_firefox=(typeof(document.wrappedJSObject)!=='undefined');
        
        
        let me = this;
        debug.log('Loading...');
        send_query(url,[],function(data){
            me.raw_data = data;
            me.data = new FlashParser(me.raw_data);
            me.process();
         },me.download_progress);

        /*setTimeout(function(){
            me.save_blob(me.blob);
        },10000); */  
    }

    setPako(p){
        this.pako=p;
    }

    read_header(){
        let decoder = new TextDecoder('utf-8');
        let signature = decoder.decode(this.raw_data.slice(0,3));

        this.lzma_zipped = false;
        if(signature=='FWS')
            this.zipped = false;
        else if(signature=='CWS')
            this.zipped = true;
        else if(signature=='ZWS'){
            this.lzma_zipped = true;   
        }else
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

        if(this.lzma_zipped){
            this.debug('lzma zipped!');
            let o = {};
            o.zipped_size = data.read_UI32();
            o.props = data.read_sub_array(5);
            o.zipped_data = data.read_sub_array(o.zipped_size);


            let lzma = new Uint8Array(o.zipped_size+5+8);
            lzma.set(o.props);
            lzma.set(this.raw_data.slice(4,4),o.props.length)
            lzma.set(o.zipped_data,o.props.length+8);
            this.debug('decompressing...');

            try {
                this.raw_data = LZMA.decompress(lzma);
            } catch(e) {
                console.log(e);
                return false
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
        this.timeline.add_frame(this.reset_address, 0);
        return true;
    }

    process_ShowFrame(){
        this.do_frame_finish=true;
        debug.stop();

        let ret = this.display_list.draw();

        let sstream =this.sound_stream;
        //console.log(sstream);
        //return false;
        if(sstream!==null){
            if(sstream.state==sstream.STATE_IDLE)
                sstream.play();
        }

        if(!this.playing){
            this.goto_frame(this.current_frame);
            this.do_frame_finish=true;
        }

        this.current_frame++;
        this.timeline.add_frame(this.data.cur,this.current_frame);
        return ret;
    }
    

    process_tag(){
        if(this.preloader.is_error)
            return false;
        //checking if preloader already loaded this part
        if(this.preloader.get_position()<this.data.cur-this.reset_address){
            //console.log('preloader block -- pcur:'+this.preloader.get_position()+" cur:"+this.data.cur);
            this.continue_processing();
            return false;
        }

        let tag = this.data.read_tag_data();
        let tag_processor = tag_list[tag.code];

        if(typeof(tag_processor) == "undefined"){
            if(this.skip_tags.indexOf(tag.code)>=0){
                return true;
            }
            this.debug("unimplemented tag: #"+tag.code);
            let skip = confirm('Skip unimplemented tag #'+tag.code+' ?');
            if(skip){
                this.skip_tags.push(tag.code);
                return true;
            }
            return false;
        }
        
        return (new tag_processor(this,tag)).no_error;
    }

    process(){
        if(!this.read_header()){
            return;
        }

        let cur = this.data.cur;
        let data = this.data.read_sub_array();
        this.data.cur=cur;
        data = new FlashParser(data);

        this.preloader = new Preloader(this, data);
        //return;

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
        let interval_time = 1000 / this.frame_rate;

        let curtime = Date.now();
        let diff = curtime - this.last_redraw_time;
    
        this.redraw_interval_id = requestAnimationFrame(this.draw.bind(this));

        if(diff<interval_time) return;
        this.last_redraw_time += interval_time;

        if(diff>1000)
            this.last_redraw_time = Date.now();
        this.do_frame_finish=false;
        
        do{
            let ret = this.process_tag();

            if(ret === false){
                cancelAnimationFrame(this.redraw_interval_id);
                return false;
            }
        }while(!this.do_frame_finish);

        
    }

    get_current_frame(){
        return this.current_frame;
    }

    stop(){
        this.playing=false;
    }

    play(){
        this.playing=true;
    }

    goto_frame(frame){
        this.debug('goto_frame: ',frame);
        
        if(frame >= this.frames_count){
            this.debug('oops its bigger than frames count!');
            frame = this.frames_count-1;
            this.debug('goto_frame: ',frame);
        }

        /*console.log(frame);
        console.log(this.timeline);
        console.log(this.current_frame);*/
        let addr = this.timeline.get_address(frame);
        if(addr<0){
            //console.log('TODO: frame '+frame+' is not present on the timeline!');
            addr=this.search_frame_address(frame);

            if(addr<0){
                this.debug('error! cannot find frame '+frame);
                return false;
            }
        }

        this.current_frame = frame - 1;
        this.data.cur=addr;
        this.display_list.abort_frame();
        this.do_frame_finish=false;
        return true;
    }

    search_frame_address(frame){
        let addr = -1;
        let tframe = frame;
        while((addr=this.timeline.get_address(tframe))<0) {
            tframe--;
        }       

        this.data.cur = addr;
        while (tframe<frame) {
            let tag = this.data.read_tag_data();
            if(tag.code==0){
                return -1;
            }
            if(tag.code==1){
                tframe++;
                this.timeline.add_frame(this.data.cur,tframe);
            }
        }
        addr = this.data.cur;
        return addr
    }

    debug(...args){
    	if(this.debug_mode){
    		console.debug('flash:',...args);
    	}
        
        var argss = Array.prototype.slice.call(arguments);
        debug.log(argss.join(' '));
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

    continue_processing(){
        requestAnimationFrame(this.draw.bind(this));
        this.debug('--------continue after sleep ---------')
    }

    abort(){
        cancelAnimationFrame(this.redraw_interval_id);
    }

    download_progress(e){
        let loaded = e.loaded;
        let total = e.total;
        let precent = Math.floor(100*loaded/total);
        debug.update('Loading '+precent+'% ('+loaded+'/'+total+')');
    }

    create_image_from_array(image_array, width, height){
        let canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        let ctx = canvas.getContext('2d');
        let imd = ctx.createImageData(width,height);
        imd.data.set(image_array);
        ctx.putImageData(imd,0,0);
        let src = canvas.toDataURL();
        let img = new Image();
        img.src = src;
        return img;
    }

    draw_image_data_to_canvas(imdat, width, height){
        let canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        let ctx = canvas.getContext('2d');
        let imd = ctx.createImageData(width,height);
        imd.data.set(imdat);
        ctx.putImageData(imd,0,0);
        
        this.ctx.drawImage(canvas,0,0);
    }

    //workaround firefox bugs
    bug_create_image_from_array(image_array, width, height){
        if(typeof(cloneInto) == "undefined"){
            return this.create_image_from_array(image_array, width, height);
        }

        let obj = {
            bitmap  : image_array,
            width   : width,
            height  : height
        }
        window.wrappedJSObject.__flashplayer_temp_data=cloneInto(obj,window);
    
        this.bug_inject_script('__flashplayer_generate_image_from_array();');

        let src = window.wrappedJSObject.__flashplayer_temp_data.image;
        let img = new Image();
        img.src = src;
        return img;
    }
    bug_draw_image_data_to_canvas(imdat, width, height){
        if(typeof(cloneInto) == "undefined"){
            return this.draw_image_data_to_canvas(imdat, width, height);
        }
        //workaround a bug
        let obj = {
            canvas_id : this.canvas.id,
            bitmap  : imdat,
            width   : width,
            height  : height
        }
        window.wrappedJSObject.__flashplayer_draw_data=cloneInto(obj,window);

        this.bug_inject_script('__flashplayer_draw_bitmap_on_canvas();');
    }
    bug_inject_script(script_text){
        let script = document.createElement('script');
        script.innerHTML=script_text;
        document.head.appendChild(script);
        script.remove();
    }

}
    

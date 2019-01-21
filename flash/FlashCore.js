"use strict";

class FlashCore{
    constructor(url){
        console.log(url);
        this.raw_data = null;
        this.zipped = false;
        this.cur = 0;
        this.flash_version = 0;
        this.file_length = 0;
        
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
    
    read_UI32(){
    
        let out = 0;
        out  = this.raw_data[this.cur];      this.cur++; 
        out |= ((this.raw_data[this.cur]&0xff) << 8);  this.cur++;
        out |= ((this.raw_data[this.cur]&0xff) << 16); this.cur++;
        out |= ((this.raw_data[this.cur]&0xff) << 24); this.cur++;
        
        return out;
    }

    read_header(){
        let decoder = new TextDecoder('utf-8');
        let signature = decoder.decode(this.raw_data.slice(0,3));

        if(signature=='FWS')
            this.zipped = false;
        else if(signature=='CWS')
            this.zipped = false;
        else
            {console.log("Error: unknown signature:"+signature); return;}
        
        console.log('zipped:',this.zipped);
        this.cur=3;
        
        this.flash_version = this.read_UI8();
        console.log('flash version:',this.flash_version);
        
        this.file_length = this.read_UI32();
        console.log('file length:',this.file_length);
        console.log('raw data length:', this.raw_data.length);
        
    }

    process(){
        this.read_header();
    }
}

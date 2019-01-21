"use strict";

class FlashCore{
    constructor(url){
        console.log(url);
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

            out = out << 1;
            shift++;
            if(shift>7){
                temp = this.raw_data[this.cur]; this.cur++;
                shift = 0;
            }
        }
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
        
        console.log('zipped:',this.zipped);
        this.cur=3;
        
        this.flash_version = this.read_UI8();
        console.log('flash version:',this.flash_version);
        
        this.file_length = this.read_UI32();
        console.log('file length:',this.file_length);
        console.log('raw data length:', this.raw_data.length);

        if(this.zipped){
            console.log('inflating');
            let pako = window.pako;
            this.raw_data = pako.inflate(this.raw_data.slice(8));
            this.cur=0;
            console.log('raw data length:', this.raw_data.length);
        }

        this.frame_size = this.read_RECT();
        console.log('frame size: '+(this.frame_size.Xmax/20)+'x'+(this.frame_size.Ymax/20));

        this.frame_rate = this.read_FIXED8();
        console.log('frame rate:', this.frame_rate);

        this.frames_count = this.read_UI16();
        console.log('frames count:',this.frames_count);
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

    process_tag(){
        let tag = this.read_tag_info();

        switch(tag.code){
            //case 45:

            //break;
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


    print_address(){
        console.log('address:', '0x'+this.cur.toString(16));
    }
}

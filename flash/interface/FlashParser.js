'use strict';

class FlashParser{
	constructor(byte_array){
		this.raw_data=byte_array;
		this.cur=0;
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

    read_UB_loc(shift,bitsize,data,cur){
        let out = 0;
        let temp = data[cur]; cur++;     
        for(let i=0;i<bitsize;i++){

            out |= ((temp << shift) & 0b10000000) > 0 ? 1 : 0;

            //this.debug(((temp << shift) & 0b10000000) > 0 ? 1 : 0);

            if((i+1)<bitsize)
                out = out << 1;
            shift++;
            if(shift>7){
                temp = data[cur]; cur++;
                shift = 0;
            }
        }
        cur--; 
        return { shift : shift, value : out, cur:cur};
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

    read_EncodedU32(){
    	let result = this.raw_data[this.cur];
    	this.cur++;
    	if(!(result&0x80))
    		return result;
    	
    	result = (result&0x7f) | this.raw_data[this.cur] << 7;
    	this.cur++;
    	if(!(result&0x4000))
    		return result;

    	result = (result&0x3fff) | this.raw_data[this.cur] << 14;
    	this.cur++;
    	if(!(result&0x200000))
    		return result;

    	result = (result&0x1fffff) | this.raw_data[this.cur] << 21;
    	this.cur++;
		if(!(result&0x10000000))
    		return result;
		result = (result&0x0fffffff) | this.raw_data[this.cur] << 28;
		this.cur++;
		result = result>>>0;
		return result;
    }
    read_EncodedS32(){
    	let result = this.raw_data[this.cur];
    	this.cur++;
    	if(!(result&0x80))
    		return result;
    	
    	result = (result&0x7f) | this.raw_data[this.cur] << 7;
    	this.cur++;
    	if(!(result&0x4000))
    		return result;

    	result = (result&0x3fff) | this.raw_data[this.cur] << 14;
    	this.cur++;
    	if(!(result&0x200000))
    		return result;

    	result = (result&0x1fffff) | this.raw_data[this.cur] << 21;
    	this.cur++;
		if(!(result&0x10000000))
    		return result;
		result = (result&0x0fffffff) | this.raw_data[this.cur] << 28;
		this.cur++;
		
		return result;
    }
    read_sub_array(length){
        let t = new Uint8Array(this.raw_data.buffer,this.cur+this.raw_data.byteOffset,length);
        this.cur+=length;
        return t;
    }

    read_RGB(){
        let obj = {};
        obj.r = this.read_UI8();
        obj.g = this.read_UI8();
        obj.b = this.read_UI8();
        return obj;
    }
    read_RGBA(){
        let obj = {};
        obj.r = this.read_UI8();
        obj.g = this.read_UI8();
        obj.b = this.read_UI8();
        obj.a = this.read_UI8();
        return obj;
    }
}

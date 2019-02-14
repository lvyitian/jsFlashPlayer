'use strict';

class AVM2{
	constructor(){
		this.raw_data = null;
		this.cur = 0;
	}

	run_abc(abc_file){
		this.raw_data = abc_file;

		let obj = {};
		obj.minor_version = this.read_u16();
		obj.major_version = this.read_u16();

		//cpool info
		let cpool_info = {};
		//int
		cpool_info.int_count = this.read_u30();
		cpool_info.integer = [0];
		for(let i=0;i<cpool_info.int_count-1;i++){
			cpool_info.integer.push(this.read_s32());
		}
		//uint
		cpool_info.uint_count = this.read_u30();
		cpool_info.uinteger = [0];
		for(let i=0;i<cpool_info.uint_count-1;i++){
			cpool_info.uinteger.push(this.read_u32());
		}
		//double
		cpool_info.double_count = this.read_u30();
		cpool_info.double = [NaN];
		for(let i=0;i<cpool_info.double_count-1;i++){
			cpool_info.double.push(this.read_d64());
		}
		//string
		cpool_info.string_count = this.read_u30();
		cpool_info.string = [""];
		for(let i=0;i<cpool_info.string_count-1;i++){
			cpool_info.string.push(this.read_string());
		}
		//namespace
		cpool_info.namespace_count = this.read_u30();
		cpool_info.namespace = [{}];
		for(let i=0;i<cpool_info.namespace_count-1;i++){
			let ns = {};
			ns.kind = this.read_u8();
			ns.name = this.read_u30();
			cpool_info.namespace.push(ns);
		}
		//ns set
		cpool_info.ns_set_count = this.read_u30();
		cpool_info.ns_set = [{}];
		for(let i=0;i<cpool_info.ns_set_count-1;i++){
			let ns_set = {};
			ns_set.count = this.read_u30();
			ns_set.ns = [];
			for(let k=0;k<ns_set.count;k++)
				ns_set.ns.push(this.read_u30());

			cpool_info.ns_set.push(ns_set);
		}
		//multiname
		cpool_info.multiname_count=this.read_u30();

		//

		this.debug(cpool_info);
		return false;
	}


	read_u32(){
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
	read_s32(){
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
	read_u30(){
		return this.read_u32() & 0x3FFFFFFF;
	}

	read_u8(){
		let out = 0;
        out  = this.raw_data[this.cur];      this.cur++; 
        return out;
	}

	read_uint32(){
		let out = 0;
        out  = this.raw_data[this.cur];      this.cur++; 
        out |= ((this.raw_data[this.cur]&0xff) << 8);  this.cur++;
        out |= ((this.raw_data[this.cur]&0xff) << 16); this.cur++;
        out |= ((this.raw_data[this.cur]&0xff) << 24); this.cur++;
        
        return out>>>0;
	}

	read_d64(){
		alert('TODO: read d64');
		return 0;
	}

	read_u16(){
		let out = 0;
        out  = this.raw_data[this.cur];      this.cur++; 
        out |= ((this.raw_data[this.cur]&0xff) << 8);  this.cur++;
        return out;
	}

	read_string(){
		let length = this.read_u30();
		let decoder = new TextDecoder('utf-8');
        let out = decoder.decode(this.raw_data.slice(this.cur,this.cur+length));
        this.cur = this.cur+length;
        return out;
	}

	debug(...args){
   		console.log('avm2:',...args);    	
    }
}
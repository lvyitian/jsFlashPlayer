'use strict';

class AVM2{
	constructor(){
		this.raw_data = null;
		this.cur = 0;

		this.minor_version = 0;
		this.major_version = 0;

		this.constat_pool = null;

		this.objects = [{}];
	}

	run_abc(abc_file){
		this.raw_data = abc_file;
		this.cur=0;

		this.minor_version = this.read_u16();
		this.major_version = this.read_u16();

		if(this.major_version > 46){
			console.warn("Warning major_version is"+this.major_version);
		}

		if(!this.read_constat_pool())
			return false;

		let method_count;
		method_count = this.read_u30();

		let method = [];
		let obj = {};
		for(let i = 0; i < method_count; i++){
		 	obj.param_count = this.read_u30();
		 	obj.return_type = this.read_u30();
		 	obj.param_type = [];
		 	for(let k=0;k<obj.param_count;k++)
		 		obj.param_type.push(this.read_u30());
	 		obj.name = this.read_u30();
	 		obj.flags = this.read_u8();
	 		if((obj.flags & 0x08)>0){
	 			let option_count = this.read_u30();
	 			let option=[];
	 			for(let k=0;k<option_count;k++){
	 				let o = {};
	 				o.val = this.read_u30();
	 				o.kind = this.read_u8();
	 				option.push(o);
	 			}
	 			obj.option = option;
	 		}
	 		if((obj.flags & 0x80)>0){
	 			obj.param_name = [];
	 			for(let k=0;k<obj.param_count;k++){
 					obj.param_name.push(this.read_u30());
	 			}
	 		}
		 	method.push(obj);
		 } 

		this.method = method;

		let metadata_count = this.read_u30();
		if(metadata_count>0){
			let m = {};
			m.name = this.read_u30();
			console.log(this.constant_pool.string[m.name]);
			return false;
		}

		//instance info
		let class_count = this.read_u30();
		let instance = [];
		for(let i=0;i<class_count;i++){
			let ins = {};
			ins.name = this.read_u30();
			ins.super_name = this.read_u30();
			ins.flags = this.read_u8();
			ins.protectedNs = this.read_u30();
			ins.interface_count = this.read_u30();
			ins.interface = [];
			for(let k=0;k<ins.interface_count;k++){
				ins.interface.push(this.read_u30());
			}
			ins.iinit = this.read_u30();
			ins.trait = this.read_trait_info();
			if(ins.trait===false)
				return false;
			instance.push(ins);
		}
		this.instance = instance;

		//class info
		let classes = [];
		for(let i=0;i<class_count;i++){
			let cl = {};
			cl.cinit = this.read_u30();
			cl.traits = this.read_trait_info();
			if(cl.traits===false)
				return false;
			classes.push(cl);
		}
		this.classes=classes;
		
		//script info
		let script_info_count = this.read_u30();
		let script_info = [];
		for(let i=0;i<script_info_count;i++){
			let si = {};
			si.init = this.read_u30();
			si.trait = this.read_trait_info();
			script_info.push(si);
		}
		this.script_info = script_info;

		let method_body_count = this.read_u30();
		this.method_body = [];
		for(let i=0;i<method_body_count;i++){
			let bi = {};
			bi.method = this.read_u30();
			bi.max_stack = this.read_u30();
			bi.local_count = this.read_u30();
			bi.init_scope_depth = this.read_u30();
			bi.max_scope_depth = this.read_u30();
			bi.code_length = this.read_u30();
			bi.code = new Uint8Array(this.raw_data.buffer,this.cur+this.raw_data.byteOffset,bi.code_length);
			this.cur+=bi.code_length;
			bi.exception_count = this.read_u30();
			bi.exception = [];
			for(let k=0;k<bi.exception_count;k++){
				let ei={};
				ei.from = this.read_u30();
				ei.to = this.read_u30();
				ei.target = this.read_u30();
				ei.exc_type = this.read_u30();
				ei.var_name = this.read_u30();
			}
			bi.trait = this.read_trait_info();

			this.method_body.push(bi);
		}

		if(!this.execute_script(this.script_info.length-1))
			return false;

		return true;
	}


	execute_script(script_id){
		let script = this.script_info[script_id];
		//this.debug(script);
		return this.execute_method(script.init,this.objects[0]);
	}

	execute_method(method_id,this_object){
		let method = this.method[method_id];
		let body = this.method_body[method_id];
		let code = body.code;

		this.debug(body);

		let pc=0;
		let register = [this_object];
		let stack = [];
		let scope = [];
		while(pc<code.length){
			let op = code[pc];
			switch (op) {
				case 0x30: //pushscope
					scope.push(stack.pop());
					pc++;
				break;
				case 0x65: //getscopeobject
					pc++;
					stack.push(scope[scope.length-code[pc]-1]);
					pc++;
				break;
				case 0xd0: //getlocal_0
					stack.push(register[0]);
					pc++;
				break;
				default:
					alert("AVM2: Unknown op code: "+op+" (0x"+op.toString(16)+")");
					return false;
					break;
			}
		}
		return true;
	}

	read_trait_info(){
		let trait_count = this.read_u30();
		let trait = [];
		for(let k=0;k<trait_count;k++){
			let t = {};
			t.name = this.read_u30();
			t.kind = this.read_u8();
			t.data = {};
			switch (t.kind) {
				case 1: //trait_method
				case 2: //trait_getter
				case 3: //trait_setter
					t.data.disp_id = this.read_u30();
					t.data.method = this.read_u30();
					break;
				case 0: //trait_slot
				case 6: //trait_const
					t.data.slot_id = this.read_u30();
					t.data.type_name = this.read_u30();
					t.data.vindex = this.read_u30();
					t.data.vkind = this.read_u8();
					break;
				case 4: //trait_class
					t.data.slot_id = this.read_u30();
					t.data.classi = this.read_u30();
					break;
				case 5: //trait_funtion
					t.data.slot_id = this.read_u30();
					t.data.function = this.read_u30();
					break;
				default:
					alert("TODO: AVM2 instance trait kind "+t.kind);
					return false;
					break;
			}
			trait.push(t);
		}
		return trait;
	}

	read_constat_pool(){
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
		cpool_info.multiname = [{}];
		for(let i=0;i<cpool_info.multiname_count-1;i++){
			let mn = {};
			mn.kind = this.read_u8();
			switch (mn.kind) {
				case 0x7:
				case 0xd:
					mn.ns = this.read_u30();
					mn.name = this.read_u30();
					break;
				case 0xf:
				case 0x10:
					mn.name = this.read_u30();
					break
				case 0x11:
				case 0x12:
					break;
				case 0x09:
				case 0x0E:
					mn.name = this.read_u30();
					mn.ns_set = this.read_u30();
					break;
				case 0x1B:
				case 0x1C:
					mn.ns_set = this.read_u30();
					break;
				default:
					this.debug("unknown multiname kind: "+mn.kind);
					return false;
					break;
			}
			cpool_info.multiname.push(mn);
		}

		this.constant_pool = cpool_info;
		//
		return true;
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
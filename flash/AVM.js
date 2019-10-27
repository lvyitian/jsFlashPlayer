class AVM{
	constructor(core){
		this.core = core;

		this.error = false;
		this.debug_mode=true;

		this.VARTYPE_OBJ  = 10;
		this.VARTYPE_NATIVE_FUNC = 11;
		this.VARTYPE_FUNC = 12;
		this.VARTYPE_NATIVE_CLASS_OBJ = 13;

		this.al = [];
		this.al[0x06] = this.action_play.bind(this);
		this.al[0x07] = this.action_stop.bind(this);
		this.al[0x0b] = this.action_subtract.bind(this);
		this.al[0x0c] = this.action_multiply.bind(this);
		this.al[0x0d] = this.action_divide.bind(this);
		this.al[0x12] = this.action_not.bind(this);
		this.al[0x17] = this.action_pop.bind(this);
		this.al[0x1c] = this.action_get_variable.bind(this);
		this.al[0x1d] = this.action_set_variable.bind(this);
		this.al[0x26] = this.action_trace.bind(this);
		this.al[0x3d] = this.action_call_function.bind(this);
		this.al[0x40] = this.action_new_object.bind(this);
		this.al[0x47] = this.action_add2.bind(this);
		this.al[0x48] = this.action_less2.bind(this);
		this.al[0x49] = this.action_equals2.bind(this);
		this.al[0x4e] = this.action_get_member.bind(this);
		this.al[0x4f] = this.action_set_member.bind(this);
		this.al[0x52] = this.action_call_method.bind(this);
		this.al[0x67] = this.action_greater.bind(this);
		this.al[0x81] = this.action_goto_frame.bind(this);
		this.al[0x87] = this.action_store_register.bind(this);
		this.al[0x88] = this.action_constant_pool.bind(this);
		this.al[0x8a] = this.action_wait_for_frame.bind(this);
		this.al[0x96] = this.action_push.bind(this);
		this.al[0x9d] = this.action_if.bind(this);
		this.al[0x9b] = this.action_define_function.bind(this);
		this.al[0x99] = this.action_jump.bind(this);

		this.native_functions = [];
		this.native_functions['getBytesLoaded'] = this.native_getBytesLoaded.bind(this);
		this.native_functions['getBytesTotal'] = this.native_getBytesTotal.bind(this);
		this.native_functions['setInterval'] = this.native_setInterval.bind(this);

		this.native_class = [];
		this.native_class['Sound'] = function() { this.____debug = 'It is a Sound object'};

		//this.user_functions = [];

		this.global_const = [];
		this.global_const['Math'] = {type:this.VARTYPE_OBJ, val: this.make_math_obj()};
		this.global_const['Key'] = {type:this.VARTYPE_OBJ, val: this.make_key_obj()};

		//this.global_vars = {};
		//this.global_vars['_root'] = {type:this.VARTYPE_OBJ, val: this.global_vars};
		this.intervals = [null];

		this.register = [];

		//this.caller_obj = null;
	}

	make_math_obj(){
		let o={};
		o._____debug='It is a Math object';

		o.floor = {type:this.VARTYPE_NATIVE_FUNC, val: this.native_Math_floor};
		return o;
	}

	make_key_obj(){
		let o={};
		o._____debug='It is a Key object';

		o.isDown = {type:this.VARTYPE_NATIVE_FUNC, val: this.native_Key_isDown.bind(this)};
		return o;
	}

	execute(actions, caller_obj){
		//this.debug('execute');
		//this.caller_obj = caller_obj;
		this.error=false;

		for(let i = 0; i<actions.length; i++){
			if(!this._execute(caller_obj, actions[i]))
				return false;
		}

		if(this.error){
			

			return false;
		}

		return true;
	}

	clear_all_intervals(){
		while(this.intervals.length>1){
			clearInterval(this.intervals.pop());
		}
	}

	debug(...args){
		if(this.debug_mode)
			console.debug('avm:',...args);
		this.core.debug('avm:',...args);
	}
	errord(...args){
		this.core.debug('avm:',...args);
		console.error(...args);
	}



	_execute(caller_obj, act, func_args=[], constants=[]){
		let state = {
			code : act,
			pc : 0,
			target: caller_obj,
			const: constants,
			stack: [],

			avm: this,
			pop_value: this.state_pop_value,
			pop_number: this.state_pop_number,
			pop_object: this.state_pop_object,
			convert_to_value: this.convert_to_value,
			convert_to_number: this.convert_to_number,
			convert_to_object: this.convert_to_object,
			convert_to_function: this.convert_to_function,
			push_int: function(val){this.stack.push({type:7,val:val})},
			push_double: function(val){this.stack.push({type:6,val:val})},
			push_bool: function(val){this.stack.push({type:5,val:val})},

			vars: caller_obj.avm_obj
		};
		if(!("_root" in state.vars)){
			state.vars._root = {type:this.VARTYPE_OBJ, val: this.core.avm_obj};
		}
		do{
			act.cur = state.pc;
			let a = act.read_AVM_action();
			state.pc = act.cur;

			if(a.code==0)
				return true;
			

			let f = this.al[a.code];
			if(!(typeof f === 'function')){
				this.errord(state.pc ,'code:',a.code,'(0x'+a.code.toString(16)+') is not implemented!');
				console.log(act);
				return false;
			}

			
			this.debug(state.pc, f.name, a);
			if(!f(a,state))
				return false;

		}while (state.pc<act.raw_data.length);

		return true;
	}

	register_object(name, obj){
		this.debug('register object "'+name+'"');
		this.core.avm_obj[name] = {type:this.VARTYPE_OBJ, val: obj};
	}

	make_user_func(funcdata, state){
		//console.log(funcdata);
		let body = funcdata.funcBody;
		//console.log(state);
		let caller_obj = state.target;
		let constants = state.const.slice(0);
		let f = function(args){
			let act = new FlashParser(body);

			//console.log(act);
			if(!this._execute(caller_obj, act, args, constants)){
				this.error = true;
				this.core.abort();
				this.clear_all_intervals();
			}
		}
		return f.bind(this);
	}

	//-----------------------------------------------------------------------------------------------------------------

	convert_to_value(stack_element){
		let o = stack_element;
		switch (o.type) {
			case 0: //string 
			case 5: //bool
			case 6: //double
			case 7:	//int
				return o.val;
			break;
			case 8: //text constant
				return this.const[o.val];				
			break;
			case 4: //register number
				return '[register #'+o.val+']';
			break;
			default:
				console.error('TODO: convert stack value type '+o.type+' to value');
				this.avm.error = true;
			break;
		}
		return false;
	}

	convert_to_number(stack_element){
		let t = stack_element;
		t = this.convert_to_value(t);
		t = Number(t);
		if(isNaN(t)){
			t=0;
		}
		return t;
	}

	convert_to_object(stack_element){
		let o = stack_element;
		if(o.type != this.avm.VARTYPE_OBJ && o.type != this.avm.VARTYPE_NATIVE_CLASS_OBJ)
			return false;
		return o.val;
	}

	convert_to_function(stack_element, state){
		let o = stack_element;
		if(o.type === this.avm.VARTYPE_NATIVE_FUNC){
			return o.val;
		}
		if(o.type === this.avm.VARTYPE_FUNC){
			return this.avm.make_user_func(o.val, state);
		}
		return false;
	}

	state_pop_value(){
		if(this.stack.length==0){
			console.error('stack is empty!');
			this.avm.error = true;
			return false;
		}

		let o = this.stack.pop();

		if(typeof(o) === 'undefined'){
			console.error('Something strange in stack!', stack);
			this.avm.error = true;
			return false;
		}

		return this.convert_to_value(o);
	}

	state_pop_number(){
		let t = this.stack.pop();
		return this.convert_to_number(t);
	}

	state_pop_object(){
		let o = this.stack.pop();
		return this.convert_to_object(o);
	}

	//-----------------------------------------------

	search_function(func_name){
		if(func_name in this.native_functions)
			return this.native_functions[func_name];

		return false;
	}

	get_variable(name, state){
		if(name in this.global_const){
			return this.global_const[name];
		}

		if(name in state.vars){
			return state.vars[name];
		}

		return false;
	}

	call_function(state, func, args){

		if(func.type==this.VARTYPE_NATIVE_FUNC){
			return func.val(state, args);
		}

		this.errord(func,' is not callable!');
		return false;
	}

	register_function(state, data){
		this.debug('register_function: '+data.functionName);
		state.vars[data.functionName] = data;
		//console.log(data);
	}

	create_object(obj){
		if(typeof(this.native_class[obj.name]) === 'undefined'){
			this.errord('Creation object of unknown class '+obj.name);
			return false;
		}
		return {type: this.VARTYPE_NATIVE_CLASS_OBJ , val: new this.native_class[obj.name] };
	}

	//--------------------------------------------------------------------- avm native functions ----------------------------------------------------

	native_getBytesLoaded(state){
		let val = this.core.preloader.get_position()+this.core.reset_address;
		console.log('getBytesLoaded:',val);
		state.push_int(val);
		return true;
	}

	native_getBytesTotal(state){
		console.log('getBytesTotal:',this.core.data.raw_data.length);
		state.push_int(this.core.data.raw_data.length);
		return true;
	}

	native_setInterval(state, args){
		console.log('setInterval');
		if(args.length<2){
			console.error('setInterval: Not enough arguments!');
			return false;
		}

		let func = state.convert_to_function(args[0], state);
		let delay = state.convert_to_number(args[1]);

		this.intervals.push(setInterval(func, delay));
		state.push_int(this.intervals.length-1);
		
		return true;
	}

	native_Math_floor(state, args){
		let r = Math.floor(args[0].val);
		state.push_int(r);
		return true;
	}

	native_Key_isDown(state, args){
		let r = this.core.keyboard_controller.isDown(args[0].val);
		state.push_bool(r);
		return true;
	}


	//--------------------------------------------------------------------- avm actions ----------------------------------------------------

	action_wait_for_frame(a, state){
		a.frame = a.data.read_UI16();
		a.skip_count = a.data.read_UI8();
		console.log('frame:',a.frame);
		/** all data already in RAM so this is always be false*/
		return true;
	}

	action_goto_frame(a, state){
		a.frame = a.data.read_UI16();
		//console.log('frame', a.frame);
		//return false;
		return state.target.goto_frame(a.frame);
	}

	action_play(a, state){
		state.target.play();
		return true;
	}

	action_stop(a, state){
		state.target.stop();
		return true;
	}

	action_constant_pool(a, state){

		let count = a.data.read_UI16();
		state.const.length = 0;
		for(let i=0;i<count;i++){
			state.const.push(a.data.read_STRING());
		}
		//console.log(state.const);
		return true;
	}

	action_push(a, state){
		while(a.data.cur<a.data.raw_data.length){
			let o = {};
			o.type = a.data.read_UI8();
			switch (o.type) {
				case 0: //string
					o.val = a.data.read_STRING();
				break;
				case 4: //register number
					o.val = a.data.read_UI8();
				break;
				case 5: //boolean
					o.val = (a.data.read_UI8() == 1);
				break;
				case 6:
					o.val = a.data.read_DOUBLE();
				break;
				case 7:
					o.val = a.data.read_SI32();
				break;
				case 8:
					o.val = a.data.read_UI8();	
				break;
				default:
					console.error('TODO: type',o.type);
					return false;
					break;
			}
			if(this.debug_mode)
				this.debug(state.convert_to_value(o));
			state.stack.push(o);
		}
		//console.log(state.stack);
		return true;
	}

	action_call_function(a, state){
		let function_name = state.pop_value();
		let arg_count = state.pop_value();
		let args = [];
		for(let i=0;i<arg_count;i++)
			args.push(state.stack.pop());

		let f = this.search_function(function_name);

		if(!(typeof f === 'function')){
			this.errord('Call of undefined function "'+function_name+'"');
			return false;
		}
		if(!f(state,args))
			return false;

		return true;
	}

	action_divide(_a, state){
		let a = state.pop_number();
		let b = state.pop_number();

		let r = b/a;
		//console.log(b,'/',a,'=',r);
		state.push_double(r);
		//console.log(state.stack);
		return true;
	}

	action_multiply(_a,state){
		let a = state.pop_number();
		let b = state.pop_number();
		let r = a*b;

		//console.log(b,'*',a,'=',r);
		state.push_double(r);
		//console.log(state.stack);

		return true;
	}

	action_get_variable(a,state){
		let name = state.pop_value();
		let v = this.get_variable(name, state);
		if(v===false){
			this.errord('Undefined var "'+name+'"');
			return false;
		}
		state.stack.push(v);
		//console.log(state.stack);
		return true;
	}
	action_call_method(a,state){
		let name = state.pop_value();
		if(!name){
			this.errord("TODO: call as function? (P.91 of specification)");
			return false;
		}

		let obj = state.pop_object();
		if(obj===false){
			this.errord('error, object expected!')
			return false;
		}

		if(!(name in obj)){
			this.errord('error, Call undefined method "'+name+'" from ',obj);
			return false;
		}

		let arg_count = state.pop_number();
		let args = [];
		for(let i=0;i<arg_count;i++)
			args.push(state.stack.pop());
		
		if(!this.call_function(state, obj[name], args))
			return false;
		return true;	
	}

	action_set_variable(a,state){
		let value = state.stack.pop();
		let name = state.pop_value();
		state.vars[name] = value;
		return true;
	}

	action_add2(_a, state){
		let arg1 = state.pop_value();
		let arg2 = state.pop_value();
		let r = arg2+arg1;

		state.stack.push({type:-1, val:r});

		return true;
	}

	action_get_member(a,state){
		let name = state.pop_value();
		let obj = state.pop_object();
		if(obj===false){
			console.log('no object');
			return false;
		}
		if(!(name in obj)){
			this.errord('object',obj,' does not have member ',name);
			return false;	
		}

		state.stack.push(obj[name]);
		return true;
	}


	action_set_member(a, state){
		let val = state.stack.pop();
		let mem = state.pop_value();
		let obj = state.pop_object();

		if(obj===false){
			console.log('no object');
			return false;
		}

		obj[mem]=val;

		return true;
	}

	action_equals2(a, state){
		let a1 = state.pop_value();
		let a2 = state.pop_value();
		let r = (a1==a2);

		state.push_bool(r);
		//console.log(state.stack)
		return true;
	}

	action_not(a,state){
		let t = state.pop_value();
		let r = !t;

		state.push_bool(r);
		return true;
	}

	action_if(a,state){
		let t = state.pop_value();
		if(t){
			let offset = a.data.read_SI16();
			state.pc+=offset;
			//console.log('TODO: Test this!');
			//return false;
		}
		return true;
	}

	action_jump(a,state){
		let offset = a.data.read_SI16();
		state.pc+=offset;
		return true;
	}

	action_define_function(a, state){
		let obj = {};

		obj.functionName = a.data.read_STRING();
		obj.numParams = a.data.read_UI16();
		obj.paramNames = [];
		for(let i=0;i<obj.numParams;i++){
			obj.paramNames.push(a.data.read_STRING());
		}
		obj.codeSize = a.data.read_UI16();
		obj.funcBody = state.code.read_sub_array(obj.codeSize);

		state.pc+=obj.codeSize;

		if(obj.functionName!='')
			this.register_function(state, obj);
		else
			state.stack.push({type:this.VARTYPE_FUNC, val : obj})
		return true;
	}

	action_new_object(a, state){
		let o = {};
		o.name = state.pop_value();
		o.numArgs = state.pop_value();
		o.args = [];
		for(let i=0;i<o.numArgs;i++){
			o.args.push(state.stack.pop());
		}
		let t = this.create_object(o);
		if(t==false)
			return false
		state.stack.push(t);
		return true;
	}

	action_store_register(a, state){
		let reg_num = a.data.read_UI8();
		//console.log(reg_num);
		this.register[reg_num] = state.stack[state.stack.length-1];
		//console.log(this.register);
		return true;
	}

	action_pop(a, state){
		state.stack.pop();
		return true;
	}
	action_trace(a,state){
		let data = state.pop_value();
		console.log("trace:",data);
		return true;
	}
	action_subtract(a_,state){
		let a = state.pop_number();
		let b = state.pop_number();
		let r = b-a;

		//console.log(b,'-',a,'=',r);
		state.push_double(r);
		//console.log(state.stack);

		return true;
	}
	action_less2(a_,state){
		let a1 = state.pop_value();
		let a2 = state.pop_value();
		let r = (a2<a1);

		//console.log(a2,'<',a1,'=',r);
		state.push_bool(r);

		return true;
	}
	action_greater(a,state){
		let a1 = state.pop_value();
		let a2 = state.pop_value();
		let r = (a2>a1);

		//console.log(a2,'>',a1,'=',r);
		state.push_bool(r);

		return true;
	}
}
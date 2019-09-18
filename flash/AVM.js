class AVM{
	constructor(core){
		this.core = core;


		this.al = [];

		this.al[0x06] = this.action_play.bind(this);
		this.al[0x07] = this.action_stop.bind(this);
		this.al[0x81] = this.action_goto_frame.bind(this);
		this.al[0x8a] = this.action_wait_for_frame.bind(this);
	}

	execute(actions){
		//this.debug('execute');

		for(let i = 0; i<actions.length; i++){
			if(!this._execute(actions[i]))
				return false;
		}

		return true;
	}

	debug(...args){
		this.core.debug('avm:',...args);
	}

	_execute(act){
		let state = {
			pc : 0,
			target: this.core,
		};

		do{
			let a = act[state.pc];
			let f = this.al[a.code];
			if(!(typeof f === 'function')){
				this.debug(state.pc ,'code:',a.code,'(0x'+a.code.toString(16)+') is not implemented!');
				console.log(act);
				return false;
			}

			if(a.code>=0x80){
				a.data.cur=0;	
			}
			
			this.debug(state.pc, f.name);
			state.pc++;
			if(!f(a,state))
				return false;

		}while (state.pc<act.length);

		return true;
	}


	action_wait_for_frame(a, state){
		a.frame = a.data.read_UI16();
		a.skip_count = a.data.read_UI8();

		/** all data already in RAM so this is always be false
		if(state.target.get_current_frame()!=a.frame){
			state.pc+=a.skip_count;
		}
		*/

		return true;
	}

	action_goto_frame(a, state){
		a.frame = a.data.read_UI16();
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
}
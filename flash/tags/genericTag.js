"use strict";

class genericTag  extends FlashParser{
	constructor(core,data){
        super();
		this.core = core;
		this.raw_data = data;
		this.cur=0;
		core.debug("tag "+this.constructor.name);

		this.no_error = this.read();
		if(this.no_error===undefined) this.no_error=false; 

	}

	read(){
		alert("TODO: read of "+this.constructor.name);
		return false;
	}
}
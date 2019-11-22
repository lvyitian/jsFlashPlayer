"use strict";

var tag_list = [];

class genericTag  extends FlashParser{
    /**
	 *
     * @param core : FlashCore
     * @param tag
     */
	constructor(core,tag){
        super();

		this.core = core;
		this.header = tag;
		this.raw_data = tag.data;
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
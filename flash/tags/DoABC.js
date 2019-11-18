"use strict";

class DoABC extends genericTag{
	read(){
		let obj = {};

		obj.flags = this.read_UI32();
		obj.name  = this.read_STRING();
		obj.data  = new Uint8Array(this.raw_data.buffer,this.cur+this.raw_data.byteOffset,this.raw_data.length-this.cur);

		return this.core.avm2.add_abc(obj.data);
	}
}

tag_list[82] = DoABC;
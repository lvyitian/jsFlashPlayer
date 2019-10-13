class DoAction extends genericTag{
	read(){

		/*let actions = [];

		let o;
		do{
			o = {};
			o.code = this.read_UI8();
			if(o.code>=0x80){
				o.length = this.read_UI16();
				o.data = new FlashParser(this.read_sub_array(o.length));
			}
			if(o.code>0)
				actions.push(o);
		}while(o.code>0);*/

		let actions = new FlashParser(this.read_sub_array(this.raw_data.length));
		this.core.display_list.add_actions(actions);

		return true;
	}
}

tag_list[12] = DoAction;
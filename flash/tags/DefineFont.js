class DefineFont extends DefineShape{
	read(){

		let o = {};

		o.fontID = this.read_UI16();
		o.data = this.read_sub_array(this.raw_data.length - this.cur);

		o.type=this.header.code;


		let t = new Font(this.core,o);
		this.core.dictionary.add(o.fontID, t);

		return true;
	}
}
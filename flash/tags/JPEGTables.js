class JPEGTables extends genericTag{

	read(){
		let o = {};
		o.data = this.read_sub_array(this.raw_data.length-this.cur);
		this.core.jpegTables = o.data;
		console.log(o);
		if(o.data.length>0){
			console.error('JPEG TABLES TODO!');
			return false;
		}
		return true;
	}
}
tag_list[8] = JPEGTables;
class ExportAssets extends genericTag{
	read(){
		//this.core.debug('skipping ExportAssets');
		let o = {};

		o.count = this.read_UI16();
		o.list = [];
		for(let i=0;i<o.count;i++){
			let e = {};
			e.charId = this.read_UI16();
			e.name = this.read_STRING();
			o.list.push(e);
		}


		console.log(o);
		return false;
	}
}

tag_list[56] = ExportAssets;
class ProductInfo extends genericTag{
	read(){
		let o = {};
		o.product_id = this.read_UI16();
		o.edition = this.read_UI16();
		o.major_version = this.read_UI8();
		o.minor_version = this.read_UI8();
		//something more...
		//console.log(o);
		return true;
	}
}

tag_list[41] = ProductInfo;
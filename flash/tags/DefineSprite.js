class DefineSprite extends genericTag{
	
	read(){

		let o = {};

		o.spriteID = this.read_UI16();
		o.frameCount = this.read_UI16();

		o.tags = [];

		let end = false;
		while(!end){
			let t = this.read_tag_data();
			o.tags.push(t);

			if(t.code==0){
				end=true;
				break;
			}
		}

		//console.log(o);
		let spr = new Sprite(this.header.code,o);

		this.dictionary.add(o.spriteID,spr);

		return true;
	}

	
}
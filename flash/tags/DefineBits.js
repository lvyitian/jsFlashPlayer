class DefineBits extends genericTag{

	bytesToBase64(bytes) {

		let base64abc = (() => {
			let abc = [],
				A = "A".charCodeAt(0),
				a = "a".charCodeAt(0),
				n = "0".charCodeAt(0);
			for (let i = 0; i < 26; ++i) {
				abc.push(String.fromCharCode(A + i));
			}
			for (let i = 0; i < 26; ++i) {
				abc.push(String.fromCharCode(a + i));
			}
			for (let i = 0; i < 10; ++i) {
				abc.push(String.fromCharCode(n + i));
			}
			abc.push("+");
			abc.push("/");
			return abc;
		})();


		let result = '', i, l = bytes.length;
		for (i = 2; i < l; i += 3) {
			result += base64abc[bytes[i - 2] >> 2];
			result += base64abc[((bytes[i - 2] & 0x03) << 4) | (bytes[i - 1] >> 4)];
			result += base64abc[((bytes[i - 1] & 0x0F) << 2) | (bytes[i] >> 6)];
			result += base64abc[bytes[i] & 0x3F];
		}
		if (i === l + 1) { // 1 octet missing
			result += base64abc[bytes[i - 2] >> 2];
			result += base64abc[(bytes[i - 2] & 0x03) << 4];
			result += "==";
		}
		if (i === l) { // 2 octets missing
			result += base64abc[bytes[i - 2] >> 2];
			result += base64abc[((bytes[i - 2] & 0x03) << 4) | (bytes[i - 1] >> 4)];
			result += base64abc[(bytes[i - 1] & 0x0F) << 2];
			result += "=";
		}
		return result;
	}

	read(){
		let o = {};
		o.characterID = this.read_UI16();
		if(this.core.dictionary.has(o.characterID))
			return true;
		//console.log(this.core.jpegTables);
		o.data = this.read_sub_array(this.raw_data.length-this.cur);

		let img = new Image();
		img.src = 'data:image/jpg;base64,'+this.bytesToBase64(o.data);
		o.image = img;

		this.core.dictionary.add(o.characterID, o);

		if(!o.image.complete){
			//console.log('image not loaded!');
			let core = this.core;
			o.image.onload = function(){
				//console.log('image loaded!');
				core.continue_processing();
			}
			o.image.onerror = function(){
				console.error('error!');
				o.image.onload();
			}
			return false;
		}
		return true;
	}
}
tag_list[6] = DefineBits;
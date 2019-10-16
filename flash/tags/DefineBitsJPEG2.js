class DefineBitsJPEG2 extends genericTag{

	array_compare(a1,a2){
		if(a1.length != a2.length)
			return false;
		for(let i=0;i<a1.length;i++){
			if(a1[i]!=a2[i])
				return false;
		}
		return true;
	}


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

		let data = this.read_sub_array(this.raw_data.length-this.cur);
		//this.core.save_blob(data);
		data = new FlashParser(data);

		let t = data.read_sub_array(4);
		
		let err_jpg = [0xFF, 0xD9, 0xFF, 0xD8];
		let err_jpg2 = [0xFF, 0xD8, 0xFF, 0xD9];
		if(this.array_compare(err_jpg, t) || this.array_compare(err_jpg2, t)){
			data = data.read_sub_array(data.raw_data.length-4);
			data = new FlashParser(data);
		}

		let png_test = [0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A];
		t = data.read_sub_array(png_test.length);
		if(this.array_compare(png_test, t)){
			console.error('TODO: read png!');
			return false;
		}
		data.cur=0;

		let gif_test = [0x47, 0x49, 0x46, 0x38, 0x39, 0x61];
		t = data.read_sub_array(gif_test.length);
		if(this.array_compare(gif_test, t)){
			console.error('TODO: read gif!');
			return false;
		}
		data.cur=0;

		t = data.read_sub_array(data.raw_data.length);
		//this.core.save_blob(t);
		let img = new Image();
		img.src = 'data:image/jpg;base64,'+this.bytesToBase64(t);
		//document.body.appendChild(img);
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

		return false;
	}
}
tag_list[21] = DefineBitsJPEG2;
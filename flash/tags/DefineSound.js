class DefineSound extends genericTag{
	read(){
		let obj = {};

		obj.soundId = this.read_UI16();

		if(this.core.dictionary.has(obj.soundId))
			return true;

		let temp = this.read_UI8();
		obj.soundFormat = (temp >> 4) & 0b1111;
		obj.soundRate = (temp >> 2) & 0b11;
		obj.soundSize = (temp >> 1) & 0b1;
		obj.soundType = temp & 0b1;

		obj.soundSampleCount = this.read_UI32();

		obj.sound_data = this.read_sub_array(this.raw_data.length-this.cur);

		let sound = new Sound(this.core, obj);

		this.core.dictionary.add(obj.soundId,sound);
		return true;
	}
}

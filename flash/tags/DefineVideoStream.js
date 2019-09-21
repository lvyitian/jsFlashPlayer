class DefineVideoStream extends genericTag{
	read(){


		let object = {
			type: this.header.code,
			typeName : 'VideoStream',
			characterID : this.read_UI16(),
			numFrames : this.read_UI16(),
			width : this.read_UI16(),
			height : this.read_UI16()
		}

		let temp = this.read_UI8();

		object.videoFlagsDeblocking = (temp>>1)&0b111;
		object.videoFlagsSmoothing = temp & 1;
		
		object.codecID = this.read_UI8();

		let o = new VideoStream(this.core, object);

		this.core.dictionary.add(object.characterID,o);

		return true;
	}
}
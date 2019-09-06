
class SoundStreamHead extends genericTag{
	read(){
		let o={};
		let t=this.read_UI8();
		
		o.playbackSoundRate=(t>>2)&0b11;
		o.playbackSoundSize=(t>>1)&0b1;
		o.playbackSoundType=(t)&0b1;
		
		t=this.read_UI8();
		
		o.streamSoundCompression=(t>>4)&0b1111;
		o.streamSoundRate = (t>>2)&0b11;
		o.streamSoundSize = (t>>1)&1;
		o.streamSoundType = t&1;
		
		o.streamSoundSampleCount = this.read_UI16();
		
		o.latencySeek=null;
		
		if(o.streamSoundCompression==2){ //mp3
			o.latencySeek = this.read_UI16();
		}

		this.core.sound_stream = new SoundStream(
			o.playbackSoundRate,
			o.playbackSoundSize,
			o.playbackSoundType,
			o.streamSoundCompression,
			o.streamSoundRate,
			o.streamSoundSize,
			o.streamSoundType,
			o.streamSoundSampleCount,
			o.latencySeek,
            this.core
			);
		
		//debug.obj(o);
		return true;
	}
}
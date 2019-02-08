"use strict";

class SoundStream{
	constructor(
		playbackSoundRate,
		playbackSoundSize,
		playbackSoundType,
		streamSoundCompression,
		streamSoundRate,
		streamSoundSize,
		streamSoundType,
		streamSoundSampleCount,
		latencySeek
		){

		this.playbackSoundRate = playbackSoundRate;
		this.playbackSoundSize = playbackSoundSize;
		this.playbackSoundType = playbackSoundType;
		this.streamSoundCompression = streamSoundCompression;
		this.streamSoundRate = streamSoundRate;
		this.streamSoundSize = streamSoundSize;
		this.streamSoundType = streamSoundType;
		this.streamSoundSampleCount = streamSoundSampleCount;
		this.latencySeek = latencySeek;
		this.buffer = null;

		this.sound_rate_values=[5500,1100,22000,44000];
	}

	get_sample_rate(){
		let t=this.sound_rate_values[this.streamSoundRate];
		return t;
	}

	get_channels_count(){
		return this.streamSoundType +1;
	}
}
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
	}
}
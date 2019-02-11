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
		latencySeek,
		core
		){

		this.core = core;
		this.playbackSoundRate = playbackSoundRate;
		this.playbackSoundSize = playbackSoundSize;
		this.playbackSoundType = playbackSoundType;
		this.streamSoundCompression = streamSoundCompression;
		this.streamSoundRate = streamSoundRate;
		this.streamSoundSize = streamSoundSize;
		this.streamSoundType = streamSoundType;
		this.streamSoundSampleCount = streamSoundSampleCount;
		this.latencySeek = latencySeek;

		this.buffer = new Uint8Array(0);
		this.frames_buffered = 0;
		this.decoded_buffer = [];

		this.sound_rate_values=[5500,1100,22000,44000];

		this.state = 0;

		this.STATE_IDLE=0;
		this.STATE_PLAYING=1;
	}

	get_sample_rate(){
		let t=this.sound_rate_values[this.streamSoundRate];
		return t;
	}

	get_channels_count(){
		return this.streamSoundType +1;
	}

	append_cbuffer(data,frames_count){
		//console.log("appending, ",data.length);
        let t = new Uint8Array(this.buffer.length+data.length);
        t.set(this.buffer);
        t.set(data, this.buffer.length);
        this.buffer=t;

        this.frames_buffered+=frames_count;
        if(this.frames_buffered>=2){
        	let me = this;
            //sstream.frame_num++;
            this.core.audio_ctx.decodeAudioData(this.buffer.buffer,function(decoded){
                //console.log('decoded',decoded);
                //me.decoded_buffer.push(decoded);

				let source = me.core.audio_ctx.createBufferSource();

		        source.buffer = decoded;
		        source.connect(me.core.audio_ctx.destination);
		        me.decoded_buffer.push(source);

            },function(e){
                console.log(e);
                me.core.stop();
                console.log(me);
            });
            this.buffer = new Uint8Array(0);
            this.frames_buffered = 0;
        }
	}

	play(){
		
		if(this.decoded_buffer.length==0){
			this.state = this.STATE_IDLE;
			return;
		}


		//this.state = this.STATE_PLAYING;
		//let source = this.decoded_buffer.shift();
		let startTime = this.core.audio_ctx.currentTime;
        let lastChunkOffset = 0;

        while (this.decoded_buffer.length>0) {
            let chunk = this.decoded_buffer.shift();
            chunk.start(startTime + lastChunkOffset);
            //chunk.start();
            lastChunkOffset += chunk.buffer.duration;
        }
	}
}
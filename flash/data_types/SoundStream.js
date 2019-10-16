"use strict";

class SoundBuffer {
    constructor(ctx, sampleRate, channel_count, bufferSize = 6, debug = false) {
        this.ctx = ctx;
        this.sampleRate = sampleRate;
        this.bufferSize = bufferSize;
        this.debug = debug;
        this.chunks = [];
        this.isPlaying = false;
        this.startTime = 0;
        this.lastChunkOffset = 0;
       	this.channel_count = channel_count;

       	if(this.sampleRate<3000)
       		this.sampleRate=3000;
    }
    createChunk(chunk) {
    	//console.log(chunk);
    	var audioBuffer;
    	if(this.channel_count==1)
        	audioBuffer = this.ctx.createBuffer(this.channel_count, chunk[0].length, this.sampleRate);
        else
        	audioBuffer = this.ctx.createBuffer(this.channel_count, chunk[0].length, this.sampleRate);
        //var audioBuffer = this.ctx.createBuffer(2, chunk.length, 44000); 
        
        for(let i=0;i<this.channel_count;i++){
        	audioBuffer.getChannelData(i).set(chunk[i]);
        }

        //audioBuffer.getChannelData(0).set(chunk[0]);

        var source = this.ctx.createBufferSource();
        source.buffer = audioBuffer;
        source.connect(this.ctx.destination);
        source.onended = (e) => {
            this.chunks.splice(this.chunks.indexOf(source), 1);
            if (this.chunks.length == 0) {
                this.isPlaying = false;
                this.startTime = 0;
                this.lastChunkOffset = 0;
            }
        };
        return source;
    }
    log(data) {
        if (this.debug) {
            console.log(new Date().toUTCString() + " : " + data);
        }
    }
    addChunk(data) {
        if (this.isPlaying && (this.chunks.length > this.bufferSize)) {
            this.log("chunk discarded");
            return; // throw away
        }
        else if (this.isPlaying && (this.chunks.length <= this.bufferSize)) { // schedule & add right now
            this.log("chunk accepted");
            let chunk = this.createChunk(data);
            chunk.start(this.startTime + this.lastChunkOffset);
            this.lastChunkOffset += chunk.buffer.duration;
            this.chunks.push(chunk);
        }
        else if ((this.chunks.length < (this.bufferSize / 2)) && !this.isPlaying) { // add & don't schedule
            this.log("chunk queued");
            let chunk = this.createChunk(data);
            this.chunks.push(chunk);
        }
        else { // add & schedule entire buffer
            this.log("queued chunks scheduled");
            this.isPlaying = true;
            let chunk = this.createChunk(data);
            this.chunks.push(chunk);
            this.startTime = this.ctx.currentTime;
            this.lastChunkOffset = 0;
            for (let i = 0; i < this.chunks.length; i++) {
                let chunk = this.chunks[i];
                chunk.start(this.startTime + this.lastChunkOffset);
                this.lastChunkOffset += chunk.buffer.duration;
            }
        }
    }
}


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

		this.buffer = [];

		this.sound_rate_values=[5500,11025,22050,44100];

		this.state = 0;

		this.STATE_IDLE=0;
		this.STATE_PLAYING=1;

		if(!this.core.is_firefox){
			this.sb = new SoundBuffer(this.core.audio_ctx, this.get_sample_rate(), streamSoundType+1);
		}else{
			this.core.bug_inject_script("var __flashplayer_sound_buffer = new __flash_player__SoundBuffer((new window.AudioContext()),"+this.get_sample_rate()+","+(streamSoundType+1)+")");
		}

		this.reset_buffer();
	}

	get_sample_rate(){
		let t=this.sound_rate_values[this.streamSoundRate];
		return t;
	}

	get_channels_count(){
		return this.streamSoundType +1;
	}

	reset_buffer(){
		this.buffer = [];
		for(let i=0;i<this.get_channels_count();i++){
			this.buffer.push(new Float32Array(0));
		}
	}

	append_cbuffer(data){

		if(this.core.is_firefox){
			let chan = this.get_channels_count();
			for(let i=0;i<chan;i++){
				let t = new Float32Array(this.buffer[i].length+data[i].length);
				t.set(this.buffer[i]);
				t.set(data[i],this.buffer[i].length);
				this.buffer[i] = t;
			}

			

			let length = this.buffer[0].length/this.get_sample_rate();
			//console.log('sample_length:'+length);
			if(length > 0.15){
				//walkaround a bug

		        let obj = {
		            sound_data : this.buffer
		        }
		        window.wrappedJSObject.__flashplayer_temp_data=cloneInto(obj,window);
		       	this.core.bug_inject_script("__flashplayer_sound_buffer.addChunk(__flashplayer_temp_data.sound_data)");

		       	this.reset_buffer();
	       	}
	        
		}else{
			let sb = this.sb;
		    sb.addChunk(data);
		}
	}

	play(){
		//TODO: remove me
	}
}

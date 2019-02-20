'use strict';

class Sound{

	constructor(core, data){
		this.STATE_IDLE = 0;
		this.STATE_PLAYING = 0;
		this.data = data;
		this.core = core;

		this.state = this.STATE_IDLE;
		this.player = null;
		this.ready = false;
		this.error = false;
		this.ready_promise=null;

		this.init();
	}

	init(){
		let o = this.data;
		let soundFormat = o.soundFormat;

		switch (soundFormat) {
			case 2:{ //MP3
				
				let buffer = o.sound_data.slice(2);
				//console.log(buffer);
				let me = this;
				
				let t=this.core.audio_ctx.decodeAudioData(buffer.buffer).then(function(decoded){
					let source = me.core.audio_ctx.createBufferSource();
					source.buffer = decoded;
		        	source.connect(me.core.audio_ctx.destination);
					me.ready = true;
					me.player = source;
				}, function (){
					me.error=true;	
				});

				this.ready_promise = t;

				}break;
			default:
				alert("TODO: Sound format:"+soundFormat);
				break;
		}
	}

	play(){
		if(this.STATE_PLAYING)
			return;

		if(!this.ready){
			this.ready_promise.then(this.play.bind(this));
			return;
		}

		this.player.start();
		this.state = this.STATE_PLAYING;

		if(this.params.HasLoops){
			this.player.loop = true;
			console.log(this.player);
			let me = this;
			this.player.onended = function(){
				console.log('ended');
				/*me.params.loopCount--;
				if(me.params.loopCount<=0){
					me.params.HasLoops=0;
				}else me.player.start();*/
			}
		}
	}

	set_params(params){
		this.params = params;
	}
}
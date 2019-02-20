'use strict';

class StartSound extends genericTag{
	read(){
		let obj = {};
		let soundId = this.read_UI16();
		let sound = this.core.dictionary.get(soundId);

		let temp = this.read_UI8();
		obj.SyncStop = (temp >> 5) & 1;
		obj.SyncNoMultiple = (temp>>4) &1;
		obj.HasEnvelope = (temp>>3) &1;
		obj.HasLoops = (temp>>2) &1;
		obj.HasOutPoint = (temp>>1) &1;
		obj.HasInPoint = temp &1;

		if(obj.HasInPoint){
			obj.inPoint = this.read_UI32();
			alert("TODO: StartSound HasInPoint");
			return false;
		}

		if(obj.HasOutPoint){
			obj.outPoint = this.read_UI32();
			alert("TODO: StartSound HasOutPoint");
			return false;
		}

		if(obj.HasLoops){
			obj.loopCount = this.read_UI16();
		}

		if(obj.HasEnvelope){
			alert("TODO: StartSound HasEnvelope");
			return false;
		}

		sound.set_params(obj);

		if(obj.SyncStop){
			sound.stop();
			return true;
		}
		sound.play();
		return true;
	}
}

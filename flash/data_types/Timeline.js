class Timeline{
	constructor(core){
		this.core = core;

		this.timeline = [];
	}

	add_frame(address, frame_number){
		if(this.timeline[frame_number]===undefined){
			let label="";
			this.timeline[frame_number] = {address,label};
		}
	}

	get_address(frame){
		//console.log(this.timeline);
		if(this.timeline[frame] === undefined)
			return -1
		let {address} = this.timeline[frame];
		return address;
	}
	add_label(frame, label){
		this.timeline[frame].label=label;
	}
	get_frame_by_label(label){
		for(let i=0;i<this.timeline.length;i++){
			if(this.timeline[i].label==label){
				return i;
			}
		}
		return -1;
	}
}
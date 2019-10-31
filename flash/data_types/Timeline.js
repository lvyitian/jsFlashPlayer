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
		if(this.timeline[frame] === undefined)
			return -1
		let {address} = this.timeline[frame];
		return address;
	}
	add_label(frame, label){
		this.timeline[frame].label=label;
	}
}
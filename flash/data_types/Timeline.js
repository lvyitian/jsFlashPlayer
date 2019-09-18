class Timeline{
	constructor(core){
		this.core = core;

		this.timeline = [];
	}

	add_frame(address, frame_number){
		if(this.timeline[frame_number]===undefined){
			this.timeline[frame_number] = address;
		}
	}

	get_address(frame){
		let addr = this.timeline[frame];
		if(addr===undefined){
			return -1;
		}

		return addr;
	}
}
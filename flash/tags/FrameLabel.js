class DefineFrameLabel extends genericTag{
	read(){
		let label = this.read_STRING();
		console.log(label);
		this.core.set_frame_label(this.core.current_frame, label);
		return true;
	}
}

tag_list[43] = DefineFrameLabel;
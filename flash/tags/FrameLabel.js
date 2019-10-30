class FrameLabel extends genericTag{
	read(){
		let label = this.read_STRING();
		this.core.set_frame_label(label);
		return true;
	}
}

tag_list[43] = FrameLabel;
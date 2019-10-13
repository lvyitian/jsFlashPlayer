class RemoveObject2 extends genericTag{
	read(){
		let depth = this.read_UI16();
		this.core.display_list.remove_by_depth(depth);
		return true;
	}
}

tag_list[28] = RemoveObject2;
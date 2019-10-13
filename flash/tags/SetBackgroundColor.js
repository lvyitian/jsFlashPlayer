class SetBackgroundColor extends genericTag{
	read(){
		let r = this.read_UI8();
        let g = this.read_UI8();
        let b = this.read_UI8();
        this.core.display_list.set_background_color(r,g,b);
        return true;
	}
}
tag_list[9] = SetBackgroundColor;
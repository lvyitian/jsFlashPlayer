class genericDrawable{
	set_draw_options(options){
		if('color_transform' in options){
			console.log("TODO: color_transform in Shape ",options);
			return false;
		}
		return true;
	}
}
class KeyboardController{
	constructor(core){
		this.core = core;
		this.canvas = core.canvas;

		this.keymap = [];

		document.addEventListener('keydown',this.onKeyDown.bind(this),false);
		document.addEventListener('keyup',this.onKeyUp.bind(this),false);
	}

	onKeyDown(event){
		let keycode = event.keyCode;
		this.keymap[keycode] = true;
	}

	onKeyUp(event){
		let keycode = event.keyCode;
		this.keymap[keycode] = false;
	}

	isDown(keycode){
		return (this.keymap[keycode]===true);
	}
}
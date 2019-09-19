class TextEdit{
	constructor(type, data, core){
		this.data = data;
		this.type = type;

		this.core = core;
		this.ctx = core.ctx

		this.avm_obj = {
			_____debug: 'this is text edit',
			text: {type:-1,val:''}
		};

		if(data.hasText)
			this.avm_obj.text.val=data.initialText;
	}

	draw(parent_matrix){
		let ctx = this.ctx;
		if(parent_matrix)
			ctx.setTransform(parent_matrix.a,parent_matrix.b,parent_matrix.c,parent_matrix.d,parent_matrix.e,parent_matrix.f);


		if(this.data.html){
			console.log('TODO: draw as html');
			return false;
		}
		if(this.data.autoSize){
			console.log('TODO: draw autoSize');
			return false;
		}
		if(this.data.border){
			console.log('TODO: draw border');
			return false;
		}
		if(this.data.useOutlines){
			console.log('TODO: useOutlines');
		}

		let font = null;

		if(this.data.hasFont){
			font = this.core.dictionary.get(this.data.fontID);
			//console.log(font);
		}
		
		ctx.save();
		let b = this.data.bounds;

		let font_size = this.data.fontHeight/20;
		//console.log(font_size+'px '+font.data.fontName);
		ctx.font = font_size+'px '+font.data.fontName;

		let color = this.data.textColor; 
		ctx.fillStyle = 'rgba('+color.r+','+color.g+','+color.b+','+color.a+')';
		
		ctx.beginPath();
		ctx.rect(b.Xmin/20, b.Ymin/20, b.Xmax/20, b.Ymax/20);
		//ctx.stroke();
		ctx.clip();
		
		ctx.fillText(this.avm_obj.text.val,this.data.indent/20,font_size);


		ctx.restore();
		
		//console.log(this.data);
		return true;
		
	}
}
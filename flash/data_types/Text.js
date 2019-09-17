class Text{
	constructor(type, data, core){
		this.data = data;
		this.type = type;

		this.core = core;
	}

	draw(parent_matrix){
		//console.log('matrix',parent_matrix);
		//console.log(this.data);
		let matrix = parent_matrix.multiplySelf(this.data.textMatrix.matrix);
		let ctx = this.core.ctx;

		ctx.setTransform(matrix.a, matrix.b, matrix.c, matrix.d, matrix.e, matrix.f);

		let font;
		let x = 0;
		let y = 0;

		for(let i=0;i<this.data.textRecords.length;i++){
			let rec = this.data.textRecords[i];

			if(rec.styleFlagsHasFont)
				font = this.core.dictionary.get(rec.fontID);

			if(!font){
				console.log('error, font not found!');
				console.log(rec);
				return false;
			}

			//console.log(rec);

			/*ctx.beginPath();
			ctx.moveTo(this.data.textBounds.Xmin/20,this.data.textBounds.Ymin/20);
			ctx.lineTo(this.data.textBounds.Xmax/20,this.data.textBounds.Ymin/20);
			ctx.lineTo(this.data.textBounds.Xmax/20,this.data.textBounds.Ymax/20);
			ctx.lineTo(this.data.textBounds.Xmin/20,this.data.textBounds.Ymax/20);
			ctx.closePath();
			ctx.stroke();
			*/

			if(rec.styleFlagsHasYOffset)
				y += rec.yOffset;
			if(rec.styleFlagsHasXOffset)
				x += rec.xOffset;

			//console.log('drawing text');
			for(let k=0;k<rec.glyphCount;k++){
				let glyph = rec.glyphEntries[k];
				let shape = font.get_shape(glyph.glyphIndex);
				
				if(!shape){
					console.log(font);
					console.log(glyph);
					console.log('no shape!');
					return false;
				}
				//console.log(String.fromCharCode(font.font_info.codeTable[glyph.glyphIndex]));
				if(rec.styleFlagsHasColor){
					shape.data.shapes.fillStyles[1].color = rec.textColor;
				}
				//console.log(rec.textHeight);
				
				if(!shape.draw(matrix,x,y,rec.textHeight))
					return false;

				x+=glyph.glyphAdvance;
			}
			//console.log(rec,font);
		}


		//console.log(this.data);
		return true;
	}
}
class Text extends genericDrawable{
	constructor(type, data, core){
		super();
		this.data = data;
		this.type = type;

		this.core = core;
	}

	draw(parent_matrix){
		/*if(this.data.characterID == 24){
			console.log(this.data);
			//return false;
		}*/
		//console.log('matrix',parent_matrix);
		let matrix = parent_matrix.multiplySelf(this.data.textMatrix.matrix);
		let ctx = this.core.ctx;

		//console.log(parent_matrix);
		//console.log(this.data.textMatrix.matrix);
		//console.log(matrix);
		//console.log((new Error).stack);

		ctx.setTransform(matrix.a, matrix.b, matrix.c, matrix.d, matrix.e, matrix.f);

		let font;
		let x = 0;
		let y = 0;
		let color;

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

			console.log(matrix);*/
			//ctx.setTransform(1,0,0,1,0,0);
			

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
					color = rec.textColor;
				}
				shape.data.shapes.fillStyles[1].color = color;
				//console.log(rec.textHeight);
				
				if(!shape.draw(matrix,x,y,rec.textHeight))
					return false;

				x+=glyph.glyphAdvance;

				//
				/*if(this.data.characterID == 24){
					if(i==2){
						if(k==0){
							console.log(rec);
							return false;
						}
					}
				}*/
			}

			/*if(this.data.characterID == 24){
				if(i==2){
					console.log(rec);
					return false;
				}
			}*/
			//console.log(rec,font);
		}

		

		//console.log(this.data);
		return true;
	}
}
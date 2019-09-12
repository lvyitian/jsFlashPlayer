class Text{
	constructor(type, data, core){
		this.data = data;
		this.type = type;

		this.core = core;
	}

	draw(parent_matrix){
		//console.log('matrix',parent_matrix);

		let matrix = parent_matrix.multiplySelf(this.data.textMatrix.matrix);
		let ctx = this.core.ctx;

		ctx.setTransform(matrix.a, matrix.b, matrix.c, matrix.d, matrix.e, matrix.f);

		for(let i=0;i<this.data.textRecords.length;i++){
			let rec = this.data.textRecords[i];

			let font = this.core.dictionary.get(rec.fontID);

			//console.log(rec);

			let x = 0; //this.data.textBounds.Xmin;
			let y = 0; //this.data.textBounds.Ymin;

			//ctx.setTransform(1, 0, 0, 1, 0, 0);

			/*ctx.beginPath();
			ctx.moveTo(this.data.textBounds.Xmin/20,this.data.textBounds.Ymin/20);
			ctx.lineTo(this.data.textBounds.Xmax/20,this.data.textBounds.Ymin/20);
			ctx.lineTo(this.data.textBounds.Xmax/20,this.data.textBounds.Ymax/20);
			ctx.lineTo(this.data.textBounds.Xmin/20,this.data.textBounds.Ymax/20);
			ctx.closePath();
			ctx.stroke();
			*/

			//ctx.setTransform(matrix.a, matrix.b, matrix.c, matrix.d, matrix.e, matrix.f);

			y += rec.yOffset;
			x += rec.xOffset;

			//console.log('drawing text');
			for(let k=0;k<rec.glyphCount;k++){
				let glyph = rec.glyphEntries[k];
				let shape = font.get_shape(glyph.glyphIndex);
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
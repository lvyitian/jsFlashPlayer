class ColorTransform{

	constructor(params){
		this.params=params;
	}

	apply(canvas){
		
		//console.warn('ColorTransform apply');
		if(this.params.hasAddTerms){
			console.log("TODO: AddTerms ColorTransform");
			return false;
		}

		let ctx = canvas.getContext('2d');
		let imdat = ctx.getImageData(0, 0, canvas.width, canvas.height);
		let p = imdat.data;
		//console.log(p);
		for (let i = 0; i < canvas.width*canvas.height*4; i += 4) {
			p[i+0] = p[i+0]*this.params.redMultTerm / 256;
			p[i+1] = p[i+1]*this.params.greenMultTerm / 256;
			p[i+2] = p[i+2]*this.params.blueMultTerm / 256;
			p[i+3] = p[i+3]*this.params.alphaMultTerm / 256;

			/*p[i+0] = 255;
			p[i+1] = 255;
			p[i+2] = 255;
			p[i+3] = 255;*/
			//console.log(i);
		}
		//console.log(p);
		ctx.putImageData(imdat, 0, 0);
		//console.warn('ColorTransform applied');
		//console.log(imdat);
		//console.log(this.params);
		return true;
	}
}
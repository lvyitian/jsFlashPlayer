class ColorTransform{

	constructor(params){
		this.params=params;
	}

	apply(canvas){

		let ctx = canvas.getContext('2d');
		let imdat = ctx.getImageData(0, 0, canvas.width, canvas.height);
		let p = imdat.data;


		for (let i = 0; i < canvas.width*canvas.height*4; i += 4) {

			if(this.params.hasAddTerms && this.params.hasMultTerms){
				p[i+0] = Math.max(0, Math.min((p[i+0]*this.params.redMultTerm / 256) + this.params.redAddTerm,255));
				p[i+1] = Math.max(0, Math.min((p[i+1]*this.params.redMultTerm / 256) + this.params.greenAddTerm,255));
				p[i+2] = Math.max(0, Math.min((p[i+2]*this.params.redMultTerm / 256) + this.params.blueAddTerm,255));
				p[i+3] = Math.max(0, Math.min((p[i+3]*this.params.redMultTerm / 256) + this.params.alphaAddTerm,255));

			}else if(this.params.hasAddTerms){
				p[i+0] = Math.max(0, Math.min(p[i+0] + this.params.redAddTerm,255));
				p[i+1] = Math.max(0, Math.min(p[i+1] + this.params.greenAddTerm,255));
				p[i+2] = Math.max(0, Math.min(p[i+2] + this.params.blueAddTerm,255));
				p[i+3] = Math.max(0, Math.min(p[i+3] + this.params.blueAddTerm,255));
			}else{
				p[i+0] = p[i+0]*this.params.redMultTerm / 256;
				p[i+1] = p[i+1]*this.params.greenMultTerm / 256;
				p[i+2] = p[i+2]*this.params.blueMultTerm / 256;
				p[i+3] = p[i+3]*this.params.alphaMultTerm / 256;
			}

		
		//console.log(p);
		
			

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
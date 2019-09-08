var debug={
	con: [],
	is_drawing: false,
	ctx:null,
	log : function(message){
		this.con.push(message);
		if(this.con.length > 15) this.con.shift();
		//alert(message);
	},
	start:function(ctx){
		this.ctx=ctx;
		this.is_drawing=true;
		window.requestAnimationFrame(this.draw.bind(this));
		//alert("start end");
    },
    draw:function(){
    	//alert("draw begin");
    	let c = this.ctx;
        let y = 10;
        
        c.globalAlpha=0.3;
        c.fillStyle="#ffffff";
        c.fillRect(0,0,c.canvas.width,this.con.length*10+10);
        
        c.globalAlpha=1;
        
        c.fillStyle = "#000000";
        for(let i=0;i<this.con.length;i++){
        	//alert("line " +i);
        	c.fillText(this.con[i],10,y);
            y+=10;
        }
        //alert("09");
        if(this.is_drawing){
        	window.requestAnimationFrame(this.draw.bind(this));
    	}
        //alert("draw end");
	},
	stop:function(){
		this.is_drawing = false;
	},
	toggle: function(){
	    if(this.is_drawing) this.stop();
	    else this.start();
	},
	obj:function(o, recursive=true){
		if(typeof(o)!='object')
			return console.log(o);
		console.log('{');
		
		let k=Object.keys(o);
		
		for(let i=0;i<k.length;i++){
			let e = o[k[i]];
			if(recursive)
			if(typeof(e)=='object'){
				this.obj(e);
				continue;
			}
			console.log("  ",k[i]+":",e);
		}
		
		console.log('}');
    }
}
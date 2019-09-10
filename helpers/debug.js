var debug={
	con: [],
	is_drawing: false,
	ctx:null,
	tab:'',
	log : function(message){
		this.con.push(message);
		if(this.con.length > 15) this.con.shift();
		//alert(message);
	},
	start:function(ctx){
		this.ctx=ctx;
		this.is_drawing=true;
		window.requestAnimationFrame(this.draw.bind(this));
		/*ctx.fillStyle="#ffffff";
		ctx.fillRect(0,0,100,100);
		alert("start end");*/
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
		console.log(this.tab+'{');
		
		let k=Object.keys(o);
		this.tab+='  ';
		
		for(let i=0;i<k.length;i++){
			let e = o[k[i]];
			if(recursive)
			if(typeof(e)=='object'){
				this.obj(e);
				continue;
			}
			console.log(this.tab,k[i]+":",e);
		}
		this.tab=this.tab.substr(2);
		//this.tab.length-=2;
		console.log(this.tab+'}');
    }
}
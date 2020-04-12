class Button{
    constructor(data, core){
        this.data = data;
        this.core = core;

        this.STATE_UP = 0;

        this.state = this.STATE_UP;
    }

    set_draw_options(options){
        if(!Object.keys(options).length === 0){
            console.error("TODO: set draw option for Button!");
            return false;
        }
        return true;
    }

    draw(matrix){

        this.core.ctx.fillStyle = '#FFFFFF';
        this.core.ctx.fillRect(-10,-1,20,2);
        this.core.ctx.fillRect(-1,-10,2,20);

        for(let i=0;i<this.data.characters.length;i++){
            let character = this.data.characters[i];
            if(character.buttonStateUp && this.state == this.STATE_UP){
                let cm = new DOMMatrix();
                cm.multiplySelf(matrix);
                cm.multiplySelf(character.placeMatrix.matrix);
                this.core.ctx.setTransform(cm);
                this.core.dictionary.draw(this.core.ctx,character.characterID,1,cm,{});
            }
        }
        //console.log(this.data);

        return true;
    }
}
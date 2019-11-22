class SymbolClass extends genericTag{
    read(){
        let o ={};

        o.numSymbols = this.read_UI16();
        o.symbols = [];

        for( let i=0; i<o.numSymbols; i++ ){
            let s = {};
            s.tag = this.read_UI16();
            s.name = this.read_STRING();
            o.symbols.push(s);

            // if tag is zero create AVM2 class and assign it to main timeline
            if(s.tag===0){
                this.core.display_list.clear();
                this.core.stop();
                let instance = this.core.avm2.createInstance(s.name);
                this.core.display_list.add(0,instance);
            }
        }

        //console.log(o);
        return true;
    }
}
tag_list[76] = SymbolClass;
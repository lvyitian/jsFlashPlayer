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

            // if tag is zero create class and assign it to main timeline
            if(s.tag===0){
                this.core.stop();
            }
        }

        console.log(o);
        return false;
    }
}
tag_list[76] = SymbolClass;
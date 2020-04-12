class DefineButton2 extends genericTag{
    read(){
        let o ={};

        o.buttonId = this.read_UI16();
        let flags = this.read_UI8();
        o.reservedFlags = flags >> 1;
        if(o.reservedFlags!=0){
            console.warn("reserve flags is not 0");
        }
        o.trackAsMenu = flags & 1;
        o.actionOffset = this.read_UI16();

        o.characters = this.read_BUTTONRECORDS();
        if(o.characters === false){
            return false;
        }

        o.actions = this.read_BUTTONCONDACTIONS();
        if(o.actions === false){
            return false;
        }

        this.core.dictionary.add(o.buttonId, new Button(o,this.core));
        return true;
    }

    read_BUTTONRECORDS(){
        let flags = this.read_UI8();
        let output = [];
        while (flags!=0) {
            let o = {};
            o.buttonReserved = flags >> 6;
            o.hasBlendMode = (flags >> 5) & 1;
            o.buttonHasFilterList = (flags >> 4) & 1;
            o.buttonStateHitTest = (flags >> 3) & 1;
            o.buttonStateDown = (flags >> 2) & 1;
            o.buttonStateOver = (flags >> 1) & 1;
            o.buttonStateUp = flags & 1;

            o.characterID = this.read_UI16();
            o.placeDepth = this.read_UI16();
            o.placeMatrix = this.read_MATRIX();
            o.colorTransform = this.read_CXFORMWITHALPHA();
            if (o.buttonHasFilterList) {
                console.error('TODO: read buttonFilterList');
                return false;
            }
            if (o.hasBlendMode) {
                console.error('TODO: read BlendMode');
                return false;
            }

            output.push(o);
            flags = this.read_UI8();
        }
        return output;
    }

    read_CXFORMWITHALPHA(){
        let o = {};

        let t = this.read_UB(0,1);
        o.hasAddTerms = t.value;
        t = this.read_UB(t.shift,1);
        o.hasMultTerms = t.value;
        t = this.read_UB(t.shift,4);
        o.nbits = t.value;
        if(o.hasMultTerms){
            t = this.read_UB(t.shift,o.nbits);
            o.redMultTerm = t.value;
            t = this.read_UB(t.shift,o.nbits);
            o.greenMultTerm = t.value;
            t = this.read_UB(t.shift,o.nbits);
            o.blueMultTerm = t.value;
            t = this.read_UB(t.shift,o.nbits);
            o.alphaMultTerm = t.value;
        }
        if(o.hasAddTerms){
            t = this.read_UB(t.shift,o.nbits);
            o.redAddTerm = t.value;
            t = this.read_UB(t.shift,o.nbits);
            o.greenAddTerm = t.value;
            t = this.read_UB(t.shift,o.nbits);
            o.blueAddTerm = t.value;
            t = this.read_UB(t.shift,o.nbits);
            o.alphaAddTerm = t.value;
        }

        if(t.shift!=0){
            this.cur++;
        }

        return o;
    }

    read_BUTTONCONDACTIONS(){
        let o = {};
        o.condActionSize = this.read_UI16();
        if(o.condActionSize==0){
            return []
        }
        console.error('TODO: read_BUTTONCONDACTIONS');
        console.log(o);
        return false
    }
}
tag_list[34] = DefineButton2;
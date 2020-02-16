class AVM_Object{
    constructor(parent){
        this.parent = parent;
        this.vars = {
            _x: {val: 0},
            _y: {val: 0},
            _xscale: {val: 100},
            _yscale: {val: 100}
        };

    }
    getVar(varname){
        //console.error('get var '+varname+'from ', this);
        if(varname in this.vars){
            //console.log(varname+": "+this.vars[varname].val);
            return this.vars[varname];
        }
        return false;
    }
    hasVar(varname){
        return (varname in this.vars);
    }
    setVar(varname,obj){
        this.vars[varname] = obj;
        if(varname === '_x'){
            this.parent.matrix.e = obj.val;
        }
        if(varname === '_y'){
            this.parent.matrix.f = obj.val;
        }
        //console.log(varname+": "+this.vars[varname].val);
    }
}
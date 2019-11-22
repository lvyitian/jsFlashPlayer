class AVM2ClassTree{
    constructor(){
        this.classTree = [];
    }

    /**
     * @param avm2Class : AVM2Class
     */
    registerClass(avm2Class){
        let o = {
            ns : avm2Class.getClassNamespace(),
            name : avm2Class.getClassName(),
            _class : avm2Class
        }
        this.classTree.push(o);
        return true;
    }

    /**
     *
     * @param namespace
     * @param className
     * @returns {AVM2Class,boolean}
     */
    getClass(namespace, className){
        for(let i=0;i<this.classTree.length;i++){
            let o = this.classTree[i];
            if(o.ns === namespace && o.name === className){
                return o._class;
            }
        }
        return false;
    }
}
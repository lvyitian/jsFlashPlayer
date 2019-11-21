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
            name : avm2Class.getClassName()
        }
        this.classTree.push(o);
        return true;
    }
}
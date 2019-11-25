/**
 *
 * @type {AVM2ClassTree,null}
 */
var AVM2_native_class_tree = null;

class AVM2ClassTree{
    constructor(){
        this.classTree = [];

        if(AVM2_native_class_tree!=null){
            this.classTree = AVM2_native_class_tree.getClassTree().slice(0);
        }
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

    getClassTree(){
        return this.classTree;
    }
}

AVM2_native_class_tree = new AVM2ClassTree();
class AVM2Class{
    /**
     * @param abcFile : ABC_File
     */
    constructor(abcFile){
        this.constant_pool = abcFile.constant_pool;
        this.class_info = abcFile.classes;
        this.instance_info = abcFile.instance;
        this.method_info = abcFile.method;
        this.method_body = abcFile.method;

        this.CONSTANT_QName = 0x07;

        this.CONSTANT_Namespace = 0x08;
        this.CONSTANT_PackageNamespace = 0x16;
    }

    getMultiname(id){
        return this.constant_pool.multiname[id];
    }

    getNS(id){
        return this.constant_pool.namespace[id];
    }

    getStr(id){
        return this.constant_pool.string[id];
    }

    getInstanceInfo(){
        if(this.instance_info.length>1){
            throw new Error("Class has more than one 'instance_info'. Check this!");
        }
        return this.instance_info[0];
    }

    getClassMultiname(){
        let instance = this.getInstanceInfo();
        let multiname = this.getMultiname(instance.name);
        if(multiname.kind !== this.CONSTANT_QName){
            throw new Error("multiname kind is not QName");
        }
        return multiname;
    }

    getClassNamespace(){
        let multiname = this.getClassMultiname();

        let ns = this.getNS(multiname.ns);
        if(ns.kind!==this.CONSTANT_PackageNamespace)
            throw new Error("namespace kind is not QName");

        return this.getStr(ns.name);
    }

    getClassName(){
        let multiname = this.getClassMultiname();
        return this.getStr(multiname.name);
    }

}
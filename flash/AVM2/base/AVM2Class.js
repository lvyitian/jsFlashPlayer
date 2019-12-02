class AVM2Class extends AVM2InstanceInterface{
    /**
     * @param abcFile : ABC_File
     */
    constructor(abcFile=null){
        super();

        this.constant_pool = [];
        this.class_info = [];
        this.instance_info = [];
        this.method_info = [];
        this.method_body = [];

        if(abcFile!=null) {
            this.constant_pool = abcFile.constant_pool;
            this.class_info = abcFile.classes;
            this.instance_info = abcFile.instance;
            this.method_info = abcFile.method;
            this.method_body = abcFile.method_body;
        }

        this.CONSTANT_QName = 0x07;

        this.CONSTANT_Namespace = 0x08;
        this.CONSTANT_PackageNamespace = 0x16;

        this.avm2=null;
    }

    classInit(avm2){
        if(this.avm2!=null)
            return;
        this.avm2 = avm2;
        if(this.class_info.length>1){
            console.error(this.class_info);
            throw new Error("Class info array has more than one entry!");
        }

        let id = this.class_info[0].cinit
        let init_method = this.getMethodInfo(id);

        avm2.executor.execute(this, init_method)
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

    hasSuperClass(){
        let instance = this.getInstanceInfo();
        let multiname = this.getMultiname(instance.super_name);
        if(multiname)
            return true;
        return false;
    }

    getSuperClassInfo(){
        let instance = this.getInstanceInfo();
        let multiname = this.getMultiname(instance.super_name);
        let o={};
        let ns = this.getNS(multiname.ns);
        if(ns.kind!==this.CONSTANT_PackageNamespace)
            throw new Error("namespace kind is not QName");
        o.ns = this.getStr(ns.name);
        o.name = this.getStr(multiname.name);
        return o;
    }

    getQName(id){
        let multiname = this.getMultiname(id);
        if(multiname.kind !== this.CONSTANT_QName){
            throw new Error("namespace kind is not QName");
        }
        return multiname;
    }

    getMethodInfo(id){
        let mi = this.method_info[id];
        let method = {};
        method.info = mi;
        method.body = this.method_body[id];
        method.name = this.getStr(method.info.name);
        return method;
    }

    /**
     *
     * @param instance : AVM2Instance
     */
    constructInstance(instanceObj){
        let instance = this.getInstanceInfo();
        for(let i=0;i<instance.trait.length;i++){
            let trait = {...instance.trait[i]};
            let mn = this.getQName(trait.name);
            trait.nameStr=this.getStr(mn.name);
            trait.ns = this.getNS(mn.ns);
            instanceObj.traits.push(trait);
        }
        for(let i=0; i<this.method_info.length; i++){
            let method = this.getMethodInfo(i)
            instanceObj.methods.push(method);
        }

        let init_method = instanceObj.methods[instance.iinit];

        instanceObj.avm2.executor.execute(instanceObj,init_method);

    }
}
class AVM2{

    constructor(core){
        this.core = core;
        this.abc_files = [];
        this.classes = new AVM2ClassTree();
    }

    add_abc(abc_data){
        let abc_file = new ABC_File(abc_data);
        if(abc_file.is_error()) {
            console.error("abc_file parse error!");
            return false;
        }

        let classes=abc_file.get_class_names();

        for(let i=0;i<classes.length;i++){
            this.log("load:",classes[i]);
        }

        this.abc_files.push(abc_file);

        let c = new AVM2Class(abc_file);
        if(!this.classes.registerClass(c))
            return false;

        return true;
    }

    createInstance(name){
        this.log("construct '"+name+"'");

        let t = name.lastIndexOf('.');
        let ns = name.substr(0,t);
        let className = name.substr(t+1);

        let cl = this.classes.getClass(ns,className);
        if(cl===false)
            throw new Error("AVM2 Class '"+name+"' not found!");

        let instance = new AVM2Instance(cl);

        return instance;
    }

    log(...message){
        this.core.debug("avm2:",...message)
        console.log("avm2:",...message);
    }
}
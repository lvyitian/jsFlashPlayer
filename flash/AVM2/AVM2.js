class AVM2{

    constructor(core){
        this.abc_files = [];
        this.core = core;
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

        return true;
    }

    log(...message){
        this.core.debug("avm2:",...message)
        console.log("avm2:",...message);
    }
}
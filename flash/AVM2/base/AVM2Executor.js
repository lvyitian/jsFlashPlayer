class AVM2Executor{
    constructor(avm2){
        this.avm2 = avm2;
        this.instructions = [];
        this.initInstructions();
    }

    initInstructions(){
        this.instructions[208] = this.inst_getlocal_0;
    }


    execute(instance, method){
        this.avm2.log('execute', method.name);
        let context = new AVM2ExecuteContext(instance,method,this);
        context.run();
    }

    getInstructions(){
        return this.instructions;
    }

    /**
     * @param context : AVM2ExecuteContext
     */
    inst_getlocal_0(context){
        throw new Error('not implemented');
    }
}
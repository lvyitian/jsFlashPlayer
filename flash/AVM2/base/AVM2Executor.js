class AVM2Executor{
    constructor(avm2){
        this.avm2 = avm2;
        this.instructions = [];
        this.initInstructions();
    }

    initInstructions(){

    }

    execute(instance, method){
        this.avm2.log('execute', method.name);
        let context = new AVM2ExecuteContext(instance,method,this);
        context.run();
    }
}
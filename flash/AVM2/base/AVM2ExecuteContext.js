class AVM2ExecuteContext{
    /**
     *
     * @param instance : AVM2InstanceInterface
     * @param method
     * @param executor : AVM2Executor
     */
    constructor(instance, method, executor){
        this.pc = 0;
        this.instance = instance;
        this.method = method;
        this.executor = executor;
    }

    run(){
        this.pc = 0;
        let code = this.method.body.code;
        console.log(code);

    }
}
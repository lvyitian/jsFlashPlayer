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
        this.code = this.method.body.code;
        this.instructions = executor.getInstructions();
        this.debug = true;

        this.operand_stack = [];
        this.scope_stack = [];
        console.log(this.method.body);
    }

    decompile(){
        let i = 0;
        while(i<this.code.length){
            let base = i+" ("+this.code[i].toString(16)+") | ";
            switch (this.code[i]) {
                case 0x30:
                    console.log(base+"pushscope");
                    i++;
                    break;
                case 0x47:
                    console.log(base+"returnvoid");
                    i++;
                    break;
                case 0xd0:
                    console.log(base+"getlocal_0");
                    i++;
                    break;
                default:
                    console.log(base+"undefined instruction " + this.code[i] + "("+this.code[i].toString(16)+")");
                    i++;
            }
        }
    }

    run(){
        this.pc = 0;
        let code = this.code;
        let run=true;

        if(this.debug){
            this.decompile();
        }

        while(run){
            let instr = this.instructions[code[this.pc]];

            if(typeof instr!=="function"){
                console.log(this.code);
                throw new Error('AVM2: unimplemented instruction ' + code[this.pc] + ' at ' + this.pc);
            }

            break;
        }
    }
}
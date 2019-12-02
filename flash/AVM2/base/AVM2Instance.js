class AVM2Instance extends AVM2InstanceInterface{
    /**
     *
     * @param avm2 : AVM2
     * @param classObj : AVM2Class
     */
    constructor(avm2,classObj){
        super();
        /**
         * type for display list
         * @type {number}
         */
        this.type=999;
        this.avm2 = avm2;
        this.classObj = classObj;
        this.className = classObj.getClassName();
        this.namespace = classObj.getClassNamespace();

        this.hasSuperClass = classObj.hasSuperClass();

        if(this.hasSuperClass) {
            this.superClassInfo = classObj.getSuperClassInfo();
            this.superClass = avm2.classes.getClass(this.superClassInfo.ns, this.superClassInfo.name);
            if(this.superClass===false){
                throw new Error("super class not found '"+this.superClassInfo.ns+'.'+this.superClassInfo.name+"'");
            }
            this.super = new AVM2Instance(this.avm2,this.superClass);
        }

        this.traits = [];
        this.methods = [];

        avm2.log('create instance of ',this.className);
        classObj.classInit(avm2);
        classObj.constructInstance(this);

    }

    draw(){
        //console.log(this.className+' draw');
        return true;
    }
}
class AVM2Instance {
    /**
     *
     * @param class_ : AVM2Class
     */
    constructor(classObj){
        /**
         * type for display list
         * @type {number}
         */
        this.type=999;
        this.classObj = classObj;
        this.className = classObj.getClassName();
        this.namespace = classObj.getClassNamespace();

        console.log('create instance of ',this.className);
    }

    draw(){
        console.log(this.className+' draw');
        return true;
    }
}
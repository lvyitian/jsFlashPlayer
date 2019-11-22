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

        console.log('instance of ',classObj.getClassName());
    }

    draw(){
        console.log('draw');
        return true;
    }
}
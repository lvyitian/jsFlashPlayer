class AVM2NativeClass extends AVM2Class
{
    constructor(){
        super(null);
    }

    getClassNamespace(){
        return 'flash.display';
    }
    getClassName(){
        return 'Sprite';
    }

    hasSuperClass(){
        return false;
    }

    getSuperClassInfo(){
        return false;
    }

    constructInstance(instanceObj){

    }
    classInit(){

    }
}
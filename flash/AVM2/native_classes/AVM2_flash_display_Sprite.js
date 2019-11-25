class AVM2_flash_display_Sprite extends AVM2Class{

    constructor(){
        super();
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
}

AVM2_native_class_tree.registerClass(new AVM2_flash_display_Sprite());
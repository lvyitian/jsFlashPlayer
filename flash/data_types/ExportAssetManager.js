class ExportAssetManager
{
    constructor(core)
    {
        this.core = core;
        this.list = [];
    }

    /**
     *
     * @param key : string
     * @param characterId : int
     */
    add(key, characterId){
        this.list[key] = characterId;
    }

    getList(){
        return Object.keys(this.list);
    }

    getByName(name){
        return this.list[name];
    }
}
"use strict";

/*function ActiveXObject(name){
    this.log = function (message){
        console.log('ActiveXObject: '+message);
    }
    this.GetVariable=function(varname){
        this.log('GetVariable: '+varname);
    }
    
    this.log(name);
}
*/

class ActiveXObject{
    constructor(name){
        console.log(name);
    }
    GetVariable(name){
        console.log(name);
    }
}


exportFunction(ActiveXObject,window, {defineAs:'ActiveXObject'});
exportFunction(ActiveXObject.GetVariable, ActiveXObject, {defineAs:'GetVariable'});

console.log("ok");


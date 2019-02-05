var Libav = {
    _arrayToHeap : function (typedArray){
        var numBytes = typedArray.length * typedArray.BYTES_PER_ELEMENT;
        var ptr = Module._malloc(numBytes);
        var heapBytes = new Uint8Array(Module.HEAPU8.buffer, ptr, numBytes);
        heapBytes.set(new Uint8Array(typedArray.buffer));
        return heapBytes;
    },
    decode_frame : function(encoded_frame_array){
    
        if(this._decode_frame == undefined){
            console.log('"decode_frame" is not loaded!');
            return;
        }
        
        let frame = this._arrayToHeap(encoded_frame_array);
        let ret = this._decode_frame(frame,encoded_frame_array.length);
    }
}


var Module = {
    
    noInitialRun: true,
    onRuntimeInitialized : function(){
        ccall("main");

        Libav._decode_frame = Module.cwrap('decode_frame','number',['number','number']);
        /*var array = new Uint8Array(5);
        
        for(var i=0;i<5;i++){
            array[i]=i;
        }
        
        var heapBytes = this._arrayToHeap(array);
        var ret = decode_frame(heapBytes.byteOffset,array.length);
        console.log(ret);*/

    },

    locateFile : function(arg){
        return browser.extension.getURL("/helpers/ffmpeg_wrapper/"+arg);
    }
}

var Libav = {
    _arrayToHeap : function (typedArray){

        if(!typedArray){
            //alert('no array!');
            console.log((new Error).stack);
        }

        var numBytes = typedArray.length * typedArray.BYTES_PER_ELEMENT;
        var ptr = Module._malloc(numBytes);
        /*var heapBytes = new Uint8Array(Module.HEAPU8.buffer, ptr, numBytes);
        heapBytes.set(new Uint8Array(typedArray.buffer));
        return heapBytes;*/
        Module.writeArrayToMemory(typedArray,ptr);
        return ptr;
    },
    decode_frame : function(encoded_frame_array,width, height){
        //var d1 = new Date();
        /*if(encoded_frame_array ==undefined){
            return true;
        }*/

        if(this._decode_frame == undefined){
            console.log('"decode_frame" is not loaded!');
            return false;
        }
        
        let frame = this._arrayToHeap(encoded_frame_array);
        let out_array_length_ptr=Module._malloc(4);
        let out_array_ptr=Module._malloc(4);
        this._decode_frame(frame, encoded_frame_array.length, out_array_ptr, out_array_length_ptr);

        /*var d2 = new Date();
        console.log("decode time:",(d2-d1));
        var d2 = d1;*/

        let decoded_length = Module.getValue(out_array_length_ptr, 'i32');
        let decoded_offset = Module.getValue(out_array_ptr,'*');
        
        let decoded = new Uint8ClampedArray(Module.HEAP8.buffer,decoded_offset,decoded_length);

        /*var d2 = new Date();
        console.log("getting data from heap time:",(d2-d1));
        var d2 = d1;*/

        /*for(let i=0;i<decoded_length;i++){
            imageData.data[i] = decoded[i];
        }*/

        //let imageData = new ImageData(decoded,width,height);

        Module._free(out_array_ptr);
        Module._free(out_array_length_ptr);
        Module._free(decoded_offset);

        /*var d2 = new Date();
        console.log("image fill time:",(d2-d1));*/
        return decoded;
    }
}


var Module = {
    
    noInitialRun: true,
    onRuntimeInitialized : function(){
        ccall("main");

        Libav._decode_frame = Module.cwrap('decode_frame','number',['number','number','number','number']);
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

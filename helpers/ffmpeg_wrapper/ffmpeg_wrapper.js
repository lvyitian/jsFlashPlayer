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
        if(!encoded_frame_array){
            console.log('no encoded_frame_array!');
            console.log((new Error).stack);
            return false;
        }

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
    },

    decode_frame_vp6 : function(encoded_frame_array,width, height){
        //var d1 = new Date();
        if(!encoded_frame_array){
            console.log('no encoded_frame_array!');
            console.log((new Error).stack);
            return false;
        }

        if(this._decode_frame == undefined){
            console.log('"decode_frame" is not loaded!');
            return false;
        }

        let frame = this._arrayToHeap(encoded_frame_array);
        let out_array_length_ptr=Module._malloc(4);
        let out_array_ptr=Module._malloc(4);
        this._decode_frame_vp6(frame, encoded_frame_array.length, out_array_ptr, out_array_length_ptr);

        let decoded_length = Module.getValue(out_array_length_ptr, 'i32');
        let decoded_offset = Module.getValue(out_array_ptr,'*');

        let decoded = new Uint8ClampedArray(Module.HEAP8.buffer,decoded_offset,decoded_length);

        Module._free(out_array_ptr);
        Module._free(out_array_length_ptr);
        Module._free(decoded_offset);

        return decoded;
    },

    reset_vp6_context : function () {
        this._reset_vp6_context();
    },

    decode_mp3_chunk(chunk){
        if(this._decode_mp3_chunk == undefined){
            console.log('"decode_mp3_chunk" is not loaded!');
            return false;
        }

        let hchunk = this._arrayToHeap(chunk);
        let out_array_length_ptr=Module._malloc(4);
        let out_array_ptr=Module._malloc(4);

        this._decode_mp3_chunk(hchunk, chunk.length, out_array_ptr, out_array_length_ptr);

        let decoded_length = Module.getValue(out_array_length_ptr, 'i32');
        let decoded_offset = Module.getValue(out_array_ptr,'*');
        
        let decoded = new Float32Array(Module.HEAPF32.buffer,decoded_offset,decoded_length);
        //let decoded = new Uint8ClampedArray(Module.HEAP8.buffer,decoded_offset,decoded_length);
        //console.log(Module);

        Module._free(out_array_ptr);
        Module._free(out_array_length_ptr);
        Module._free(decoded_offset);

        return decoded;
    }
}

var Module = {
    
    noInitialRun: true,
    onRuntimeInitialized : function(){
        //console.log('Initialise');

        ccall("main");

        Libav._decode_frame = Module.cwrap('decode_frame','number',['number','number','number','number']);
        Libav._decode_frame_vp6 = Module.cwrap('decode_frame_vp6','number',['number','number','number','number']);
        Libav._reset_vp6_context = Module.cwrap('reset_vp6_context','void',[]);
        Libav._decode_mp3_chunk = Module.cwrap('decode_mp3_chunk','number',['number','number','number','number']);
        /*var array = new Uint8Array(5);
        
        for(var i=0;i<5;i++){
            array[i]=i;
        }
        
        var heapBytes = this._arrayToHeap(array);
        var ret = decode_frame(heapBytes.byteOffset,array.length);
        console.log(ret);*/
    },

    locateFile : function(arg){

        if(typeof(browser)!="undefined"){
            return browser.extension.getURL("/helpers/ffmpeg_wrapper/"+arg);
        }else{
            return chrome.extension.getURL("/helpers/ffmpeg_wrapper/"+arg);
        }
    }
}
///*
/*
let t = ['libavcodec.wasm'];
for (let i=0;i<t.length; i++){
    t[i] = Module.locateFile(t[i]);
}

Module.dynamicLibraries = t;
*/
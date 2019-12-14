class SpritePlayer{

    constructor(){
        this.data = null;
        this.raw_data = null;
        this.debug_mode = false;
        this.pako = pako;
        this.timeline = new Timeline(this);
        this.dictionary = new Dictionary(this);
        this.avm_obj = {};
        this.avm = new AVM(this);
        this.canvas = document.createElement('canvas');
        this.preloader = null;
        this.exportAssets = new ExportAssetManager(this);

        this.canvas = null;
        this.ctx = null;
    }

    /**
     *
     * @param data : string
     */
    loadFromBase64(data, onComplete){
        this.raw_data = this._base64ToArrayBuffer(data);
        this.data = new FlashParser(this.raw_data);
        this.read_header();
        this.onLoad_callback = onComplete;

        this.preloader = new Preloader(this,this.data,this.reset_address, this.onLoad.bind(this));
    }

    onLoad(){
        this.dictionary.replace_core(this);
        this.onLoad_callback();
    }

    read_header(){
        let decoder = new TextDecoder('utf-8');
        let signature = decoder.decode(this.raw_data.slice(0,3));

        this.lzma_zipped = false;
        if(signature=='FWS')
            this.zipped = false;
        else if(signature=='CWS')
            this.zipped = true;
        else if(signature=='ZWS'){
            this.lzma_zipped = true;
        }else
        {console.log("Error: unknown signature:"+signature); return false;}


        this.debug('zipped:',this.zipped);
        let data= this.data;
        data.cur=3;

        this.flash_version = data.read_UI8();
        this.debug('flash version:',this.flash_version);

        this.file_length = data.read_UI32();
        this.debug('file length:',this.file_length);
        this.debug('raw data length:', this.raw_data.length);
        //console.log(this.raw_data);

        if(this.zipped){
            this.debug('inflating');
            let pako = this.pako;
            try {
                this.raw_data = pako.inflate(this.raw_data.slice(8));
            } catch(e) {
                console.log(e);
                return false;
            }

            this.data = new FlashParser(this.raw_data);
            data = this.data;
            data.cur=0;
            this.debug('raw data length:', this.raw_data.length);
        }

        if(this.lzma_zipped){
            this.debug('lzma zipped!');
            let o = {};
            o.zipped_size = data.read_UI32();
            o.props = data.read_sub_array(5);
            o.zipped_data = data.read_sub_array(o.zipped_size);


            let lzma = new Uint8Array(o.zipped_size+5+8);
            lzma.set(o.props);
            lzma.set(this.raw_data.slice(4,4),o.props.length)
            lzma.set(o.zipped_data,o.props.length+8);
            this.debug('decompressing...');

            try {
                this.raw_data = LZMA.decompress(lzma);
            } catch(e) {
                console.log(e);
                return false
            }

            this.data = new FlashParser(this.raw_data);
            data = this.data;
            data.cur=0;
            this.debug('raw data length:', this.raw_data.length);
        }

        this.frame_size = data.read_RECT();
        this.debug('frame size: '+(this.frame_size.Xmax/20)+'x'+(this.frame_size.Ymax/20));

        this.frame_rate = data.read_FIXED8();
        this.debug('frame rate:', this.frame_rate);

        this.frames_count = data.read_UI16();
        this.debug('frames count:',this.frames_count);

        this.reset_address = data.cur;
        this.timeline.add_frame(this.reset_address, 0);
        return true;
    }

    debug(...args){
        if(this.debug_mode){
            console.debug('sp:',...args);
        }
    }

    _base64ToArrayBuffer(base64) {
        var binary_string = window.atob(base64);
        var len = binary_string.length;
        var bytes = new Uint8Array(len);
        for (var i = 0; i < len; i++) {
            bytes[i] = binary_string.charCodeAt(i);
        }
        return bytes;
    }

    set_frame_label(frame, label){
        this.timeline.add_label(frame, label);
    }

    create_image_from_array(image_array, width, height){
        let canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        let ctx = canvas.getContext('2d');
        let imd = ctx.getImageData(0,0,width,height);
        imd.data.set(image_array);
        ctx.putImageData(imd,0,0);
        let src = canvas.toDataURL();
        let img = new Image();
        img.src = src;
        return img;
    }

    draw_image_data_to_canvas(imdat, width, height){
        let canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height+100;
        let ctx = canvas.getContext('2d');
        let imd = ctx.getImageData(0,0,width,height+100);
        imd.data.set(imdat);
        //console.log(imd);
        ctx.putImageData(imd,0,0);

        this.ctx.drawImage(canvas,0,0);
    }

    //TODO: remove this function
    bug_create_image_from_array(image_array, width, height){
        return this.create_image_from_array(image_array, width, height);
    }
    //TODO: remove this function
    bug_draw_image_data_to_canvas(imdat, width, height){
        return this.draw_image_data_to_canvas(imdat, width, height);
    }
    bug_inject_script(script_text){
        let script = document.createElement('script');
        script.innerHTML=script_text;
        document.head.appendChild(script);
        script.remove();
    }

    getElementByName(name){
        let char_id = this.exportAssets.getByName(name);
        return this.dictionary.get(char_id);
    }

    //public
    getAssetList(){
        return this.exportAssets.getList();
    }

    getFramerate(){
        return this.frame_rate;
    }

    draw(ctx, name, x, y){
        this.canvas = ctx.canvas;
        this.ctx = ctx;
        let e = this.getElementByName(name);
        let matrix = new DOMMatrix();
        matrix.translateSelf(x,y);
        e.replace_canvas(canvas);
        return e.draw(matrix);
    }

    getCurrentFrame(name)
    {
        let e = this.getElementByName(name);
        if (e.constructor.name !== 'Sprite')
            return 0;
        return e.cur_frame;
    }

    stop(name)
    {
        let e = this.getElementByName(name);
        if (e.constructor.name !== 'Sprite')
            return;
        e.stop();
    }
    play(name)
    {
        let e = this.getElementByName(name);
        if (e.constructor.name !== 'Sprite')
            return;
        e.play();
    }

    gotoFrame(name, frame)
    {
        let e = this.getElementByName(name);
        if (e.constructor.name !== 'Sprite')
            return;
        e.goto_frame(frame);
    }

}


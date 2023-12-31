class Sprite {
    constructor(type, data, core) {
        this.type = type;
        this.data = data;
        this.core = core;
        this.avm = core.avm;
        this.audio_ctx = this.core.audio_ctx;
        this.is_firefox = this.core.is_firefox;
        this.dictionary = core.dictionary;
        this.display_list = new DisplayList(core.canvas, this.dictionary, true);
        this.display_list.actions_this = this;
        this.has_color_transform = false;
        this.color_transform = null;

        this.bug_inject_script = core.bug_inject_script.bind(core);

        this.current_frame = 0;
        this.cur_tag = 0;
        this.flash_version = core.flash_version;

        this.playing = true;
        this.timeline = data.timeline;
        this.frame_ready = false;


        this.avm_obj = new AVM_Object(this);
        this.matrix = new DOMMatrix();

        //console.log('create sprite '+this.data.spriteID);

        this.is_initialised = false;
        //this.process_tags();
    }

    clone() {
        return new Sprite(this.type, this.data, this.core);
    }

    set_draw_options(options) {

        if ('color_transform' in options) {
            //return false;
            this.color_transform = options.color_transform;
            if (!this.has_color_transform) {
                this.has_color_transform = true;
                let canvas = document.createElement('canvas');
                canvas.width = this.core.canvas.width;
                canvas.height = this.core.canvas.height;
                this.display_list.replace_canvas(canvas);
            }
        } else {
            if (this.has_color_transform) {
                this.has_color_transform = false;
                this.display_list.replace_canvas(this.core.canvas);
            }
        }
        return true;
    }

    reset() {
        this.cur_tag = 0;
        this.current_frame = 0;
        this.frame_ready = false;
    }

    process_tags() {
        let tags = this.data.tags;

        let tag;
        let tag_processor;

        do {
            tag = tags[this.cur_tag];
            //let tag_obj = tag;
            //console.log('sprite '+this.data.spriteID+' - init-'+this.is_initialised,tag);
            let r = true;
            switch (tag.code) {
                case 0:
                    if (!this.is_initialised) {
                        this.is_initialised = true;
                        this.reset();
                        return true;
                    }
                    //console.log("zero!");
                    this.reset();
                    //return true;
                    break;
                case 1:
                    if (!this.is_initialised) {
                        //console.log(this.core.getCacheVideo());
                        if (!this.core.getCacheVideo()) {
                            this.is_initialised = true;
                            return true;
                        } else {
                            this.cur_tag++;
                            continue;
                        }
                    }
                    this.frame_ready = true;
                    r = this.tag_ShowFrame();
                    this.cur_tag++;
                    if (this.display_list.do_abort_frame === true) {
                        continue;
                    }
                    return r;
                default:


                    tag_processor = tag_list[tag.code];
                    if (typeof(tag_processor) === 'undefined') {
                        console.log('sprite: unimplemented tag #' + tag.code);
                        return false;
                    }
                    r = (new tag_processor(this, tag)).no_error;
                    break;
            }
            if (!r) return false;
            this.cur_tag++;
        } while (this.cur_tag <= tags.length);
        //}while(tag.code!=0);

        return true;
    }

    draw(matrix) {
        if (!this.is_initialised) {
            this.process_tags();
        }
        this.matrix = new DOMMatrix();
        this.matrix.multiplySelf(matrix);

        //this.avm_obj.setVar('_x',{val: this.matrix.e, type: 6});
        //this.avm_obj.setVar('_y',{val: this.matrix.f, type: 6});

        let _x = this.avm_obj.getVar('_x').val;
        if (_x !== 0) {
            this.matrix.e = _x;
        }
        let _y = this.avm_obj.getVar('_y').val;
        if (_y !== 0) {
            this.matrix.f = _y;
        }
        let _xscale = this.avm_obj.getVar('_xscale').val;
        if (_xscale !== 100) {
            this.matrix.a = _xscale / 100;
        }
        let _yscale = this.avm_obj.getVar('_yscale').val;
        if (_yscale !== 100) {
            this.matrix.d = _yscale / 100;
        }

        if (!this.playing && this.frame_ready) {
            return this.tag_ShowFrame();
        }

        if (!this.process_tags())
            return false;


        /*if(this.current_frame == 4){
            if(![
                    //125
                ].includes(this.data.spriteID)){
                console.log(this.data.spriteID);
                console.log(this.matrix);
                console.log((new Error()).stack);

                return false;
            }

        }*/
        //console.log(this.data);
        return true;
    }

    tag_ShowFrame() {
        this.debug('tag ShowFrame');

        let ret = this.display_list.draw(this.matrix, this.core.ctx);

        if (!ret) {
            console.log(this.data.tags);
            console.log("frame:", this.current_frame);
        }

        if (this.has_color_transform) {
            if (!this.color_transform.apply(this.display_list.canvas))
                return false;
            this.core.ctx.setTransform(1, 0, 0, 1, 0, 0);
            this.core.ctx.drawImage(this.display_list.canvas, 0, 0);
            //return false;
        }
        //return false;

        if (!this.playing) {
            //if(!this.goto_frame(this.current_frame)){
            //	return false;
            //}
            this.current_frame--;
        }


        this.current_frame++;
        return ret;
    }

    stop() {
        this.debug('stop');
        this.playing = false;
    }

    play() {
        this.debug('play');
        this.playing = true;
    }


    goto_frame(frame) {
        if(!is_initialised){
            this.process_tags();
        }
        this.debug('goto_frame: ', frame);
        /*this.debug('TODO: goto frame');
        console.log(this.timeline);
        console.log(this.data.tags);*/
        let addr = this.timeline.get_address(frame);
        if (addr < 0) {
            this.debug('cannot find frame #' + frame);
            return false;
        }
        this.current_frame = frame;
        this.cur_tag = addr;
        this.frame_ready = false;
        //this.display_list.abort_frame();
        return true;
    }

    goto_label(label) {
        let frame = this.timeline.get_frame_by_label(label);
        if (frame < 0) {
            console.error("goto label fail, frame with label '" + label + "' was not found on a timeline");
            console.log(this.data);
            return false;
        }
        //console.log('current_frame:',this.current_frame, 'goto_frame',frame);
        //return false;
        return this.goto_frame(frame);
    }

    set_frame_label(frame, label) {
        this.timeline.add_label(frame, label);
    }

    register_avm_object(name, obj) {
        this.debug('sprite register object "' + name + '"');
        this.avm_obj.setVar(name, {type: this.avm.VARTYPE_OBJ, val: obj});
    }

    replace_canvas(canvas) {
        this.debug('replace canvas');
        this.display_list.replace_canvas(canvas);
    }

    debug(...args) {
        if (this.core.debug_mode) {
            this.core.debug('sprite #' + this.data.spriteID + ':', ...args);
        }
    }

    getCacheVideo() {
        return this.core.getCacheVideo();
    }
}
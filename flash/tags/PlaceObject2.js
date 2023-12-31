class PlaceObject2 extends genericTag {
    read() {
        let flags = this.read_UI8();
        let obj = {
            type: this.header.code,
            typeName: 'PlaceObject2',
            hasClipActions: (flags & 0b10000000) > 0,
            hasClipDepth: (flags & 0b01000000) > 0,
            hasName: (flags & 0b00100000) > 0,
            hasRatio: (flags & 0b00010000) > 0,
            hasColorTransform: (flags & 0b00001000) > 0,
            hasMatrix: (flags & 0b00000100) > 0,
            hasCharacter: (flags & 0b00000010) > 0,
            move: (flags & 0b00000001) > 0,
            depth: 0,
            ratio: 0,
            matrix: null
        };
        obj.depth = this.read_UI16();

        //if(!obj.hasCharacter){
        let tobj = this.core.display_list.get_by_depth(obj.depth);
        if (tobj) {
            //console.log(tobj);

            if (tobj.type == obj.type) {
                tobj.hasClipActions = obj.hasClipActions;
                tobj.hasClipDepth = obj.hasClipDepth;
                tobj.hasName = obj.hasName;
                tobj.hasRatio = obj.hasRatio;
                tobj.hasColorTransform = obj.hasColorTransform;
                tobj.hasMatrix = obj.hasMatrix;
                tobj.hasCharacter = obj.hasCharacter;
                tobj.move = obj.move;
                tobj.type = obj.type;
                tobj.typeName = obj.typeName;
                obj = tobj;
                //console.log(obj);
                //return false
            }
            //console.log(obj);
            //return false;
        }
        //}


        if (obj.hasCharacter) {
            obj.characterID = this.read_UI16();
            if (!this.core.dictionary.has(obj.characterID)) {
                console.log('error, no characterID #' + obj.characterID + ' in dictionary!');
                console.log(this.core.dictionary);
                return false;
            }
        }
        if (obj.hasMatrix) {
            obj.matrix = this.read_MATRIX();
            if (obj.matrix === false) return false;
        }
        if (obj.hasColorTransform) {
            obj.color_transform = this.read_ColorTransform();
            if (obj.color_transform === false)
                return false;
        }
        if (obj.hasRatio) {
            obj.ratio = this.read_UI16();
        }
        if (obj.hasName) {
            obj.name = this.read_STRING();

            let avm_obj = this.core.dictionary.get(obj.characterID);
            if ('avm_obj' in avm_obj) {
                this.core.register_avm_object(obj.name, avm_obj.avm_obj);
            } else {
                console.log('object dont have avm info!');
                console.log(avm_obj);
                return false;
            }

        }
        if (obj.hasClipDepth) {
            obj.clipDepth = this.read_UI16();
        }

        if (obj.hasClipActions) {
            try {
                obj.clipActions = this.readClipActions();
            } catch (e) {
                console.error(e.message);
                //return false;
            }
        }

        //console.log(obj);

        this.core.display_list.add(obj.depth, obj);

        return true;
    }

    readClipActions() {
        let o = {};
        o.reserved = this.read_UI16();
        o.allEventFlags = this.readClipEventFlags();
        o.clipActionRecords = this.readClipActionRecords();
        return o;
    }

    readClipEventFlags() {
        let o = {};
        o.flagsEnabled = 0;
        let temp = this.read_UB(0, 1);
        o.clipEventKeyUp = temp.value;
        o.flagsEnabled += temp.value;
        temp = this.read_UB(temp.shift, 1);
        o.clipEventKeyDown = temp.value;
        o.flagsEnabled += temp.value;
        temp = this.read_UB(temp.shift, 1);
        o.clipEventMouseUp = temp.value;
        o.flagsEnabled += temp.value;
        temp = this.read_UB(temp.shift, 1);
        o.clipEventMouseDown = temp.value;
        o.flagsEnabled += temp.value;
        temp = this.read_UB(temp.shift, 1);
        o.clipEventMouseMove = temp.value;
        o.flagsEnabled += temp.value;
        temp = this.read_UB(temp.shift, 1);
        o.clipEventUnload = temp.value;
        o.flagsEnabled += temp.value;
        temp = this.read_UB(temp.shift, 1);
        o.clipEventEnterFrame = temp.value;
        o.flagsEnabled += temp.value;
        temp = this.read_UB(temp.shift, 1);
        o.clipEventLoad = temp.value;
        o.flagsEnabled += temp.value;
        temp = this.read_UB(temp.shift, 1);
        o.clipEventDragOver = temp.value;
        o.flagsEnabled += temp.value;
        temp = this.read_UB(temp.shift, 1);
        o.clipEventRollOut = temp.value;
        o.flagsEnabled += temp.value;
        temp = this.read_UB(temp.shift, 1);
        o.clipEventRollOver = temp.value;
        o.flagsEnabled += temp.value;
        temp = this.read_UB(temp.shift, 1);
        o.clipEventReleaseOutside = temp.value;
        o.flagsEnabled += temp.value;
        temp = this.read_UB(temp.shift, 1);
        o.clipEventRelease = temp.value;
        o.flagsEnabled += temp.value;
        temp = this.read_UB(temp.shift, 1);
        o.clipEventPress = temp.value;
        o.flagsEnabled += temp.value;
        temp = this.read_UB(temp.shift, 1);
        o.clipEventInitialize = temp.value;
        o.flagsEnabled += temp.value;
        temp = this.read_UB(temp.shift, 1);
        o.clipEventData = temp.value;
        o.flagsEnabled += temp.value;

        if (this.core.flash_version >= 6) {
            temp = this.read_UB(temp.shift, 5);
            o.reserved = temp.value;
            o.flagsEnabled += temp.value;
            temp = this.read_UB(temp.shift, 1);
            o.clipEventConstruct = temp.value;
            o.flagsEnabled += temp.value;
            temp = this.read_UB(temp.shift, 1);
            o.clipEventKeyPress = temp.value;
            o.flagsEnabled += temp.value;
            temp = this.read_UB(temp.shift, 1);
            o.clipEventDragOut = temp.value;
            o.flagsEnabled += temp.value;
            temp = this.read_UB(temp.shift, 8);
            o.reserved2 = temp.value;
            o.flagsEnabled += temp.value;
        }

        return o;
    }

    read_ColorTransform() {
        let obj = {};
        let t = this.read_UB(0, 1);
        obj.hasAddTerms = t.value;
        t = this.read_UB(t.shift, 1);
        obj.hasMultTerms = t.value;

        t = this.read_UB(t.shift, 4);
        obj.nbits = t.value;
        if (obj.hasMultTerms) {
            t = this.read_UB(t.shift, obj.nbits);
            obj.redMultTerm = t.value;
            t = this.read_UB(t.shift, obj.nbits);
            obj.greenMultTerm = t.value;
            t = this.read_UB(t.shift, obj.nbits);
            obj.blueMultTerm = t.value;
            t = this.read_UB(t.shift, obj.nbits);
            obj.alphaMultTerm = t.value;
        }
        if (obj.hasAddTerms) {
            t = this.read_UB(t.shift, obj.nbits);
            obj.redAddTerm = t.value;
            t = this.read_UB(t.shift, obj.nbits);
            obj.greenAddTerm = t.value;
            t = this.read_UB(t.shift, obj.nbits);
            obj.blueAddTerm = t.value;
            t = this.read_UB(t.shift, obj.nbits);
            obj.alphaAddTerm = t.value;
        }
        //console.log(t);
        if (t.shift > 0)
            this.cur++;

        return new ColorTransform(obj);
    }

    readClipActionRecords() {
        let a = [];
        while (true) {
            let o = {};
            o.eventFlags = this.readClipEventFlags();
            if (o.eventFlags.flagsEnabled === 0) {
                break;
            }
            o.actionRecordSize = this.read_UI32();
            if (o.eventFlags.clipEventKeyPress) {
                o.keyCode = this.read_UI8();
                o.actionRecordSize -= 1;
            }
            o.actions = this.read_sub_array(o.actionRecordSize);
            a.push(o);

            this.registerListeners(o);
        }
        return a;
    }

    registerListeners(o) {
        let evFlags = o.eventFlags;
        if (evFlags.clipEventKeyUp) {
            throw new Error("Todo: clipEventKeyUp");
        }
        if (evFlags.clipEventKeyDown) {
            throw new Error("Todo: clipEventKeyDown");
        }
        if (evFlags.clipEventMouseUp) {
            throw new Error("Todo: clipEventMouseUp");
        }
        if (evFlags.clipEventMouseDown) {
            throw new Error("Todo: clipEventMouseDown");
        }
        if (evFlags.clipEventMouseMove) {
            throw new Error("Todo: clipEventMouseMove");
        }
        if (evFlags.clipEventUnload) {
            throw new Error("Todo: clipEventUnload");
        }
        if (evFlags.clipEventEnterFrame) {
            throw new Error("Todo: clipEventEnterFrame");
        }
        if (evFlags.clipEventLoad) {
            throw new Error("Todo: clipEventLoad");
        }
        if (evFlags.clipEventDragOver) {
            throw new Error("Todo: clipEventDragOver");
        }
        if (evFlags.clipEventRollOut) {
            throw new Error("Todo: clipEventRollOut");
        }
        if (evFlags.clipEventRollOver) {
            throw new Error("Todo: clipEventRollOver");
        }
        if (evFlags.clipEventReleaseOutside) {
            throw new Error("Todo: clipEventReleaseOutside");
        }
        if (evFlags.clipEventRelease) {
            throw new Error("Todo: clipEventRelease");
        }
        if (evFlags.clipEventPress) {
            throw new Error("Todo: clipEventPress");
        }
        if (evFlags.clipEventInitialize) {
            throw new Error("Todo: clipEventInitialize");
        }
        if (evFlags.clipEventData) {
            throw new Error("Todo: clipEventData");
        }
        if (evFlags.clipEventConstruct) {
            throw new Error("Todo: clipEventConstruct");
        }
        if (evFlags.clipEventKeyPress) {
            throw new Error("Todo: clipEventKeyPress");
        }
        if (evFlags.clipEventDragOut) {
            throw new Error("Todo: clipEventDragOut");
        }

    }
}

tag_list[26] = PlaceObject2;
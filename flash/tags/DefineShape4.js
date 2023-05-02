class DefineShape4 extends DefineShape {
    read() {
        this.set_constants();
        let obj = {};

        obj.shapeID = this.read_UI16();
        if (this.core.dictionary.has(obj.shapeID)) {
            return true;
        }
        obj.shapeBounds = this.read_RECT();
        obj.edgeBounds = this.read_RECT();

        let temp = obj.reserved = this.read_UB(0, 5);
        temp = this.read_UB(temp.shift, 1);
        obj.usesFillWindingRule = temp.value;
        temp = this.read_UB(temp.shift, 1);
        obj.usesNonScalingStrokes = temp.value;
        temp = this.read_UB(temp.shift, 1);
        obj.usesScalingStrokes = temp.value;


        //SHAPEWITHSTYLE
        let shapes = {}

        let fillStyles = this.read_FILLSTYLEARRAY(true);
        if (!fillStyles)
            return false;


        shapes.fillStyles = fillStyles;
        shapes.lineStyles = this.read_LINESTYLEARRAY(true);

        shapes.shapeRecords = this.read_ShapeRecords(true);
        if (!shapes.shapeRecords)
            return false;

        obj.shapes = shapes;

        obj.type = this.header.code;

        let shape_id = obj.shapeID;

        obj = new Shape(this.core, obj);

        if (obj.error)
            return false;

        this.core.dictionary.add(shape_id, obj);

        return true;
    }

    read_LINESTYLE(shape3mode) {
        let obj = {};
        obj.width = this.read_UI16();
        let temp = this.read_UB(0, 2);
        obj.startCapStyle = temp.value;
        temp = this.read_UB(temp.shift, 2);
        obj.joinStyle = temp.value;
        temp = this.read_UB(temp.shift, 1);
        obj.hasFillFlag = temp.value;
        temp = this.read_UB(temp.shift, 1);
        obj.noHScaleFlag = temp.value;
        temp = this.read_UB(temp.shift, 1);
        obj.noVScaleFlag = temp.value;
        temp = this.read_UB(temp.shift, 1);
        obj.pixelHintingFlag = temp.value;
        temp = this.read_UB(temp.shift, 5);
        obj.reserved = temp.value;
        temp = this.read_UB(temp.shift, 1);
        obj.noClose = temp.value;
        temp = this.read_UB(temp.shift, 2);
        obj.endCapStyle = temp.value;

        if (obj.joinStyle === 2) {
            obj.miterLimitFactor = this.read_UI16();
        }

        if (obj.hasFillFlag === 0) {
            obj.color = this.read_RGBA();
        } else {
            obj.fillType = this.read_FILLSTYLE(shape3mode);
        }
    }
}

tag_list[83] = DefineShape4;
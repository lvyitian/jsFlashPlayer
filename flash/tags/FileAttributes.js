class FileAttributes extends genericTag{
	read(){
		let obj = {};
        let t = this.read_UI8();

        obj.hardwareAcceleration = ((t & 0b01000000) > 0);
        obj.useGPU =        ((t & 0b00100000) > 0);
        obj.hasMetadata =   ((t & 0b00010000) > 0);
        obj.actionScript3 = ((t & 0b00001000) > 0);
        obj.useNetwork =    ((t & 0b00000001) > 0);

        this.core.file_attributes = obj;

        this.cur+=3;
        this.core.action_script3 = obj.actionScript3;
        return true;
	}
}

tag_list[69] = FileAttributes;
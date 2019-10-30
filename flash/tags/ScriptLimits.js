class ScriptLimits extends genericTag{
	read(){
		let o={};
		o.maxRecursionDepth = this.read_UI16();
		o.scriptTimeoutSeconds = this.read_UI16();
		//console.log(o);
		return true;
	}
}

tag_list[65] = ScriptLimits;
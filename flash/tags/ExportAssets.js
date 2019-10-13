class ExportAssets extends genericTag{
	read(){
		this.core.debug('skipping ExportAssets');
		return true;
	}
}

tag_list[56] = ExportAssets;
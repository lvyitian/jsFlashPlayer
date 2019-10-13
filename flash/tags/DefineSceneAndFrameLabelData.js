
class DefineSceneAndFrameLabelData extends genericTag{
	read(){
		let obj = {};

		obj.sceneCount = this.read_EncodedU32();
		obj.scenes = [];

		for(let i=0;i<obj.sceneCount;i++){
			let scene = {};
			scene.frameOffset = this.read_EncodedU32();
			scene.name = this.read_STRING();
			obj.scenes.push(scene);
		}
		obj.frameLabelCount = this.read_EncodedU32();
		obj.frameLabels = [];
		for(let i=0;i<obj.frameLabelCount;i++){
			let label = {};
			label.frameNum = this.read_EncodedU32();
			label.name = this.read_STRING();
			obj.frameLabels.push(label);
		}

		this.core.sceneLabelsInfo = obj;
		return true;
	}
}

tag_list[86] = DefineSceneAndFrameLabelData;
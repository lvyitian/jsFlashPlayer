class VideoFrame extends genericTag{
	read(){
		let frame = {
            streamId : -1,
            frameNum : -1,
            videoData : null
        }

        frame.streamId = this.read_UI16();
        frame.frameNum = this.read_UI16();

        let stream = this.core.dictionary.get(frame.streamId);
        if(stream.type!=this.core.dictionary.TypeVideoStream){
            alert('Error: VideoFrame pointing to not VideoStream block!');
            return false;
        }

        //copying video packet to video stream
        //frame.videoData = this.raw_data.slice(this.data.cur,end_address);
        frame.videoData = this.read_sub_array(this.raw_data.length-this.cur);

        if(stream.frames==undefined)
            stream.frames = [];
        stream.frames[frame.frameNum] = frame.videoData;

        //this.save_blob(frame.videoData);
        //console.log(frame);
        return true;
	}
}
class SoundStreamBlock extends genericTag{
	

	count_mp3_frames(mp3_data){

        let frames_count=0;
        let cur=0;

        while(cur<mp3_data.length){

            let obj={};

            let header = mp3_data[cur]<<24; cur++;
            header |= mp3_data[cur]<<16; cur++;
            header |= mp3_data[cur]<<8; cur++;
            header |= mp3_data[cur]; cur++;

            if(((header>>21)&0x7ff) != 0x7ff){
                return frames_count;
            }

            frames_count++;

            obj.mpeg_version = (header>>19) & 0b11;
            obj.layer = (header>>17) & 0b11;
            obj.protection = (header>>16) & 0b1;
            obj.bitrate = (header>>12) & 0b1111;
            obj.samplingRate = (header>>10) & 0b11;
            obj.paddingBit = (header>>9) & 0b1;

            obj.channelMode = (header>>6) & 0b11;
            obj.modeExtension = (header>>4) & 0b11;
            obj.copyright = (header>>3) & 0b1;
            obj.original = (header>>2) & 0b1;
            obj.emphasis = header & 0b11;

            let bitrate_table_mpeg1 = [0,32,40,48,56,64,80,96,112,128,160,192,224,256,320,-1];
            let bitrate_table_mpeg2 = [0,8,16,24,32,40,48,56,64,80,96,112,128,144,160,-1];

            obj.bitrate_value = (obj.mpeg_version == 3) ? bitrate_table_mpeg1[obj.bitrate]*1000 : bitrate_table_mpeg2[obj.bitrate]*1000;

            let sample_rate_table_mpeg1   = [44100,48000,32000];
            let sample_rate_table_mpeg2   = [22050,24000,16000];
            let sample_rate_table_mpeg2_5 = [11025,12000,8000];

            obj.sample_rate_value = (obj.mpeg_version == 3) ? 
                sample_rate_table_mpeg1[obj.samplingRate] : 
                (
                    (obj.mpeg_version == 2) ? 
                    sample_rate_table_mpeg2[obj.samplingRate] : 
                    sample_rate_table_mpeg2_5[obj.samplingRate]
                );

            obj.data_size = Math.floor((((obj.mpeg_version == 3) ? 144 : 72 ) * obj.bitrate_value) / obj.sample_rate_value + obj.paddingBit-4);


            cur+=obj.data_size;
        }
        return frames_count;
    }

    read(){

		let sstream = this.core.sound_stream;
        //console.log(sstream);
        switch (sstream.streamSoundCompression) {
            case 2:{
                
                let obj={};
                this.cur+=4;
                let data = this.read_sub_array(this.raw_data.length-this.cur);
                //console.log(data);
           			//(new Uint8Array(this.raw_data.buffer,this.cur+4,length-4)).slice(0);


                let frames_count = this.count_mp3_frames(data);
                //console.log(frames_count);
                sstream.append_cbuffer(data,frames_count);


                }break;
            default:
                alert("TODO: SoundStreamBlock compression "+sstream.streamSoundCompression);
                return false;
                break;
        }

        return true;
	}
}

tag_list[19] = SoundStreamBlock;
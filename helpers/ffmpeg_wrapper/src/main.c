#include <stdio.h>

#include <libavcodec/avcodec.h>
#include <libswresample/swresample.h>
#include <libswscale/swscale.h>
#include <libavutil/imgutils.h>

#define BYTE unsigned char


BYTE* convert_YCrCb_to_RGB24(AVFrame* pFrame, int flip){
	int Yh = pFrame->height;
    int Yw = pFrame->width;
    BYTE* buffer = (BYTE*)malloc(Yw*Yh*4);

    int Ch = Yh/2;
    int Cw = Yw/2;

    int Yls = pFrame->linesize[0];
    int Cls = pFrame->linesize[1];

    //printf("Yw:%d Yh:%d\n",Yw,Yh);

    int h;

    for(int i=0;i<Yh;i++){
        for(int j=0;j<Yw;j++){
            int Y = pFrame->data[0][i*Yls+j];
            int Cb = pFrame->data[1][(i/2)*Cls+(j/2)];
            int Cr = pFrame->data[2][(i/2)*Cls+(j/2)];

            /*int r = (int) (Y + 1.40200 * (Cr - 0x80));
            int g = (int) (Y - 0.34414 * (Cb - 0x80) - 0.71414 * (Cr - 0x80));
            int b = (int) (Y + 1.77200 * (Cb - 0x80));*/

            int r = (255/219)*(Y-16)+(255/112)*0.701*(Cr-128);
            int g = (255/219)*(Y-16)-(255/112)*0.886*(0.114/0.587)*(Cb-128)-(255/112)*0.701*(0.229/0.587)*(Cr-128);
            int b = (255/219)*(Y-16)+(255/112)*0.866*(Cb-128);

            /*r=abs(r);
            g=abs(g);
            b=abs(b);*/
            if(r<0) r=0;
            if(g<0) g=0;
            if(b<0) b=0;

            /*BYTE r = Cr;
            BYTE g = Y;
            BYTE b = Cb;*/

            if(flip==1){
                h=Yh-i-1;
            }else{
                h=i;
            }

            buffer[h*(Yw*4)+(j*4)+0]=r;
            buffer[h*(Yw*4)+(j*4)+1]=g;
            buffer[h*(Yw*4)+(j*4)+2]=b;
            buffer[h*(Yw*4)+(j*4)+3]=255;
            //printf("%02x ",r);
        }
    }

    /*for(int i=0;i<10;i++){
        printf("%d ",buffer[i]);
    }
    printf("\n");*/

    return buffer;
}

BYTE* convert_YCrCb_to_RGBA(AVFrame* pFrame){
	int Yh = pFrame->height;
    int Yw = pFrame->width;
    BYTE* buffer = (BYTE*)malloc(Yw*Yh*4);

    int Ch = Yh/2;
    int Cw = Yw/2;

    int Yls = pFrame->linesize[0];
    int Cls = pFrame->linesize[1];
    int asize = pFrame->linesize[2];

    //printf("asize: %d \n",asize );

    //printf("Yw:%d Yh:%d\n",Yw,Yh);

    for(int i=0;i<Yh;i++){
        for(int j=0;j<Yw;j++){
            int Y = pFrame->data[0][i*Yls+j];
            int Cb = pFrame->data[1][(i/2)*Cls+(j/2)];
            int Cr = pFrame->data[2][(i/2)*Cls+(j/2)];

            /*int r = (int) (Y + 1.40200 * (Cr - 0x80));
            int g = (int) (Y - 0.34414 * (Cb - 0x80) - 0.71414 * (Cr - 0x80));
            int b = (int) (Y + 1.77200 * (Cb - 0x80));*/

            int r = (255/219)*(Y-16)+(255/112)*0.701*(Cr-128);
            int g = (255/219)*(Y-16)-(255/112)*0.886*(0.114/0.587)*(Cb-128)-(255/112)*0.701*(0.229/0.587)*(Cr-128);
            int b = (255/219)*(Y-16)+(255/112)*0.866*(Cb-128);
            int a = pFrame->data[3][(i*2)*asize+(j)];

            /*r=abs(r);
            g=abs(g);
            b=abs(b);*/
            if(r<0) r=0;
            if(g<0) g=0;
            if(b<0) b=0;

            /*BYTE r = Cr;
            BYTE g = Y;
            BYTE b = Cb;*/

            buffer[i*(Yw*4)+(j*4)+0]=r;
            buffer[i*(Yw*4)+(j*4)+1]=g;
            buffer[i*(Yw*4)+(j*4)+2]=b;
            buffer[i*(Yw*4)+(j*4)+3]=a;
            //printf("%02x ",r);
        }
    }

    /*for(int i=0;i<10;i++){
        printf("%d ",buffer[i]);
    }
    printf("\n");*/

    return buffer;
}

//--------------------------------------------- flv -------------------------------------------------------
AVCodec *codec;
AVCodecParameters *codecParams;
AVCodecContext *pCodecContext;

int decode_frame(BYTE* packet,int length, int* output, int* out_length){
    //printf("decode_frame called!\n");

    AVPacket *pPacket = av_packet_alloc();
    AVFrame *pFrame = av_frame_alloc();

    if(codecParams==NULL)
        codecParams = avcodec_parameters_alloc();

    if(codec==NULL){
        codec = avcodec_find_decoder(AV_CODEC_ID_FLV1);
        printf("codec: %s\n",codec->name);
    }

    if(pCodecContext==NULL){
        pCodecContext = avcodec_alloc_context3(codec);
        avcodec_parameters_to_context(pCodecContext, codecParams);
        avcodec_open2(pCodecContext, codec, NULL);
    }

    pPacket->size=length;

    pPacket->data = packet;

    avcodec_send_packet(pCodecContext, pPacket);
    avcodec_receive_frame(pCodecContext, pFrame);

    BYTE* t = convert_YCrCb_to_RGB24(pFrame,0);

    
    *output = (int)t;
    *out_length = pFrame->width*pFrame->height*4;



    free(pPacket->data);

    av_packet_free(&pPacket);
    av_frame_free(&pFrame);

    return 0;
}

//--------------------------------------------- vp6 -------------------------------------------------------
AVCodec *codec_vp6;
AVCodecParameters *codec_vp6Params;
AVCodecContext *pCodecContext_vp6;

void reset_vp6_context(){
    if(pCodecContext_vp6!=NULL){
        printf("reset vp6\n");
        avcodec_free_context(&pCodecContext_vp6);
        pCodecContext_vp6 = NULL;
        avcodec_parameters_free(&codec_vp6Params);
        codec_vp6Params=NULL;
        codec_vp6=NULL;
    }
}

int decode_frame_vp6(BYTE* packet,int length, int* output, int* out_length, int alpha){
    //printf("decode_frame_vp6 called!\n");

    AVPacket *pPacket = av_packet_alloc();
    AVFrame *pFrame = av_frame_alloc();

    if(codec_vp6Params==NULL)
        codec_vp6Params = avcodec_parameters_alloc();

    if(codec_vp6==NULL){
        if(alpha==1){
            codec_vp6 = avcodec_find_decoder(AV_CODEC_ID_VP6A);
        }else{
            codec_vp6 = avcodec_find_decoder(AV_CODEC_ID_VP6);
        }
        printf("vp6 codec: %s\n",codec_vp6->name);
    }

    if(pCodecContext_vp6==NULL){
        printf("vp6 create context\n");
        pCodecContext_vp6 = avcodec_alloc_context3(codec_vp6);
        avcodec_parameters_to_context(pCodecContext_vp6, codec_vp6Params);
        avcodec_open2(pCodecContext_vp6, codec_vp6, NULL);
    }

    pPacket->size=length;

    pPacket->data = packet;

    avcodec_send_packet(pCodecContext_vp6, pPacket);
    avcodec_receive_frame(pCodecContext_vp6, pFrame);

    BYTE* t;

    if(alpha==1){
        t = convert_YCrCb_to_RGBA(pFrame);
    }else{
        t = convert_YCrCb_to_RGB24(pFrame,1);
    }


    *output = (int)t;
    *out_length = pFrame->width*pFrame->height*4;



    free(pPacket->data);

    av_packet_free(&pPacket);
    av_frame_free(&pFrame);

    return 0;
}

//--------------------------------------------- mp3 -------------------------------------------------------

AVCodec *mp3codec = NULL;
AVCodecContext *mp3_context = NULL;
AVCodecParameters *mp3_codecParams = NULL;

int decode_mp3_chunk(BYTE* chunk, int length, int* output, int* out_length){

    *out_length = 0;

    if(mp3codec==NULL){
        mp3codec = avcodec_find_decoder(AV_CODEC_ID_MP3);
        printf("mp3codec: %s\n",mp3codec->name);
    }

    if(mp3_codecParams==NULL)
        mp3_codecParams = avcodec_parameters_alloc();

    /* create decoding context */
    if(mp3_context==NULL){
        mp3_context = avcodec_alloc_context3(mp3codec);
        if(avcodec_parameters_to_context(mp3_context, mp3_codecParams)<0){
            av_log(NULL, AV_LOG_ERROR, "mp3 avcodec_parameters_to_context fails\n");
            return 1;
        }
        /* init the audio decoder */
        if ((avcodec_open2(mp3_context, mp3codec, NULL)) < 0) {
            av_log(NULL, AV_LOG_ERROR, "Cannot open audio decoder\n");
            return 1;
        }
    }

    AVPacket *pPacket = av_packet_alloc();
    AVFrame *pFrame = av_frame_alloc();

    pPacket->size = length;
    pPacket->data = chunk;

    int ret;

    ret = avcodec_send_packet(mp3_context, pPacket);
    if(ret<0){
        printf("mp3 avcodec_send_packet fail!\n");
        return 1;
    }

    ret = avcodec_receive_frame(mp3_context, pFrame);

    if(ret<0){
        printf("mp3 avcodec_receive_frame fail!\n");
        return 1;
    }

    int data_size = av_samples_get_buffer_size(NULL, mp3_context->channels,
                     pFrame->nb_samples,
                     mp3_context->sample_fmt, 1);

    
    //convert by library

    int sample_rate = mp3_context->sample_rate;

    if(sample_rate<3000)
        sample_rate = 3000;

    SwrContext *swr_ctx = swr_alloc_set_opts(NULL,
            mp3_context->channel_layout,
            AV_SAMPLE_FMT_FLT,
            sample_rate,
            mp3_context->channel_layout,
            mp3_context->sample_fmt,
            mp3_context->sample_rate,
            0,
            NULL
        );

    if (swr_init(swr_ctx) < 0) {
        printf("Failed to initialize the resampling context\n");
        return 1;
    }

    int new_data_size = av_samples_get_buffer_size(NULL, mp3_context->channels,
                     pFrame->nb_samples,
                     AV_SAMPLE_FMT_FLT, 1);
    

    BYTE *outbuf;
    outbuf = malloc(new_data_size);
    memset(outbuf,0,new_data_size);

    int out_num_samples = av_rescale_rnd(swr_get_delay(swr_ctx, pFrame->sample_rate) + pFrame->nb_samples, sample_rate, mp3_context->sample_rate, AV_ROUND_UP);

    if(swr_convert(swr_ctx, &outbuf, out_num_samples, (const uint8_t **)pFrame->data, pFrame->nb_samples)<0){
        printf("error while converting mp3\n");
        return 1;
    }


    swr_free(&swr_ctx);
    
    *output = (int)outbuf;
    *out_length = (pFrame->nb_samples*mp3_context->channels);


    av_packet_free(&pPacket);
    av_frame_free(&pFrame);

    return 0;
}


int main()
{
    /*mp3codec = avcodec_find_decoder(AV_CODEC_ID_MP3);
    mp3_context = avcodec_alloc_context3(mp3codec);
    mp3_codecParams = avcodec_parameters_alloc();*/

    mp3codec = NULL;
    mp3_context = NULL;
    mp3_codecParams = NULL;

    codec=NULL;
    codecParams=NULL;
    pCodecContext=NULL;

    codec_vp6=NULL;
    codec_vp6Params=NULL;
    pCodecContext_vp6=NULL;
    printf("ffmpeg init\n");
    return 0;
}

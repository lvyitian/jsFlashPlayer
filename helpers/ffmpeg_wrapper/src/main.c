#include <stdio.h>

#include <libavcodec/avcodec.h>

#define BYTE unsigned char

AVCodec *codec;
AVCodecParameters *codecParams;
AVCodecContext *pCodecContext;
//int frame_number=0;

BYTE* convert_YCrCb_to_RGB24(AVFrame* pFrame){
	int Yh = pFrame->height;
    int Yw = pFrame->width;
    BYTE* buffer = (BYTE*)malloc(Yw*Yh*4);

    int Ch = Yh/2;
    int Cw = Yw/2;

    int Yls = pFrame->linesize[0];
    int Cls = pFrame->linesize[1];

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
            buffer[i*(Yw*4)+(j*4)+3]=255;
            //printf("%02x ",r);
        }
    }

    /*for(int i=0;i<10;i++){
        printf("%d ",buffer[i]);
    }
    printf("\n");*/

    return buffer;
}

BYTE* decode_frame(BYTE* packet,int length, int* output, int* out_length){
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
    /*pPacket->data=malloc(length);
    memcpy(pPacket->data,packet,length);*/


    pPacket->data = packet;

    /*printf("size: %d\n",pPacket->size);

    for(int i=0;i<10;i++){
        printf("%02x ",pPacket->data[i]);
    }

    printf("\n");*/

    avcodec_send_packet(pCodecContext, pPacket);
    avcodec_receive_frame(pCodecContext, pFrame);

    //printf("linesize[0]=%d\n",pFrame->linesize[0]);

    BYTE* t = convert_YCrCb_to_RGB24(pFrame);

    /*for(int i=0;i<10;i++){
        printf("%d ",t[i]);
    }
    printf("\n");*/

    *output = (int)t;
    *out_length = pFrame->width*pFrame->height*4;

    /*printf("out_length: %d\n",*out_length);
    printf("output: %d\n",*output);*/

    //t = (BYTE*)*output;
    /*for(int i=0;i<10;i++){
        printf("%d ",t[i]);
    }
    printf("\n");*/

    free(pPacket->data);
    //free(t);
    //avcodec_parameters_free(&codecParams);
    av_packet_free(&pPacket);
    av_frame_free(&pFrame);



    //printf("decode_frame done\n");
    return 0;
}


int main()
{
    codec=NULL;
    codecParams=NULL;
    pCodecContext=NULL;
    printf("Hello world!\n");
    return 0;
}

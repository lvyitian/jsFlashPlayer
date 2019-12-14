#!/bin/bash

EXPORT_FUNC='["_decode_frame","_reset_vp6_context","_decode_frame_vp6","_decode_mp3_chunk","_main"]';

NO_WASM=""
OUT_FILE="ffmpeg.js"

if [ "$1" == "no_wasm" ] ; then 
    NO_WASM="-s WASM=0"
    OUT_FILE="ffmpeg_no_wasm.js"
fi

function check_dir(){
    if [ ! -d "$1" ] ; then
        mkdir -p "$1"
    fi
}

emcc=$(command -v emcc)
if [ "$emcc" == "" ] ; then
    echo "emcc not found"
    exit
fi 

if [ -f "config.sh" ] ; then
    source config.sh
else
    echo "enter ffmpeg source path:"
    read ffmpeg_path
    echo "ffmpeg_path=\"$ffmpeg_path\"" > config.sh
    echo "enter ffmpeg build dir:"
    read ffmpeg_build_dir
    echo "ffmpeg_build_dir=\"$ffmpeg_build_dir\"" >> config.sh
fi

check_dir "libs"

if [ ! -f "libs/libavcodec.so" ] || [ ! -f "libs/libswresample.so" ] || [ ! -f "libs/libavutil.so" ] || [ ! -f "libs/libswscale.so" ] ; then

    

    LAV_LIB=$ffmpeg_build_dir/libavcodec/libavcodec.so
    LSWRESAMPLE_LIB=$ffmpeg_build_dir/libswresample/libswresample.so
    LAVUTIL_LIB=$ffmpeg_build_dir/libavutil/libavutil.so
    LSWSCALE=$ffmpeg_build_dir/libswscale/libswscale.so

    if [ ! -f "$LAV_LIB" ] || [ ! -f "$LSWRESAMPLE_LIB" ] || [ ! -f "$LAVUTIL_LIB" ] || [ ! -f "$LSWSCALE" ] ; then
        curdir=$(pwd)
        check_dir $ffmpeg_build_dir
        cd $ffmpeg_build_dir
        emconfigure $ffmpeg_path/configure --disable-asm --enable-cross-compile --cc=emcc \
        --disable-programs --disable-doc --disable-everything \
        --enable-decoder=flv --enable-decoder=mp3 \
        --enable-decoder=vp6 \
        --enable-shared
        emmake make
        cd $curdir
    fi

    cp $LAV_LIB ./libs/
    cp $LSWRESAMPLE_LIB ./libs/
    cp $LAVUTIL_LIB ./libs/
    cp $LSWSCALE ./libs/
    

fi
if [ ! -f "libs/libswresample_.so" ]; then
    cp libs/libswresample.so libs/libswresample_.so
fi
if [ ! -f "libs/libavutil_.so" ]; then
    cp libs/libavutil.so libs/libavutil_.so
fi
if [ ! -f "libs/libswscale_.so" ]; then
    cp libs/libswscale.so libs/libswscale_.so
fi
#$bc_ed "libs/libswresample_.so" "libs/libswresample_.so" "ff_log2_tab" "ff_log2_tab2"
#$bc_ed "libs/libswresample_.so" "libs/libswresample_.so" "av_sha_size" "av_sha_size2"
#$bc_ed "libs/libswresample_.so" "libs/libswresample_.so" "ff_reverse" "ff_reverse2"
#$bc_ed "libs/libswresample_.so" "libs/libswresample_.so" "av_get_channel_layout" "av_get_channel_layout2"

libs=("libs/libavutil_.so" "libs/libswresample_.so" "libs/libswscale_.so")
l_id=0
while [[ "1" ]]; do
    
    t=$(\
    emcc \
         -I "$ffmpeg_path" \
         -I "$ffmpeg_build_dir" \
         -L "libs/" \
         "libs/libavcodec.so" \
         "libs/libavutil_.so" \
         "libs/libswresample_.so" \
         "libs/libswscale_.so" \
         src/main.c \
         -o $OUT_FILE \
         -s EXPORTED_FUNCTIONS=$EXPORT_FUNC \
         -s EXTRA_EXPORTED_RUNTIME_METHODS='["ccall", "cwrap", "getValue", "writeArrayToMemory"]' \
         -s ALLOW_MEMORY_GROWTH=1 \
         -s ENVIRONMENT=web 2>&1 \
         -s ERROR_ON_UNDEFINED_SYMBOLS=0 \
         $NO_WASM
    )
    ECODE=$?
    echo $"$t";
    err=$( echo "$t" | grep 'symbol multiply defined!' );

    if [ "$err" == "" ] ; then
        break
    else
        old_name=$(perl -e "my \$str = \"$err\";" -e "my \$regex = qr/'(.*)'/mp;" -e 'if ( $str =~ /$regex/g ) { print $1 }')
        new_name="${old_name}2"
        edlib=${libs[$l_id]}
        echo $edlib
        $bc_ed "$edlib" "$edlib" "$old_name" "$new_name"
        l_id=$(( $l_id + 1 ))
        if [ "$l_id" -ge "${#libs[*]}" ] ; then
            l_id=0
        fi
    fi
    if [ "$ECODE" == "0" ] ; then
        break
    fi
done

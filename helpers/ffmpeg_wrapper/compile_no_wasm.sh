#!/bin/bash

EXPORT_FUNC='["_decode_frame","_decode_mp3_chunk","_main"]';

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

if [ ! -f "libs/libavcodec.so" ] || [ ! -f "libs/libswresample.so" ] ; then

    

    LAV_LIB=$ffmpeg_build_dir/libavcodec/libavcodec.so
    LSWRESAMPLE_LIB=$ffmpeg_build_dir/libswresample/libswresample.so

    if [ ! -f "$LAV_LIB" ] || [ ! -f "$LSWRESAMPLE_LIB" ] ; then
        curdir=$(pwd)
        check_dir $ffmpeg_build_dir
        cd $ffmpeg_build_dir
        emconfigure $ffmpeg_path/configure --disable-asm --enable-cross-compile --cc=emcc \
        --disable-programs --disable-doc --disable-everything \
        --enable-decoder=flv --enable-decoder=mp3 \
        --enable-shared
        emmake make
        cd $curdir
    fi

    cp $LAV_LIB ./libs/
    cp $LSWRESAMPLE_LIB ./libs/

fi
if [ ! -f "libs/libswresample_.so" ]; then
    cp libs/libswresample.so libs/libswresample_.so
fi
#$bc_ed "libs/libswresample_.so" "libs/libswresample_.so" "ff_log2_tab" "ff_log2_tab2"
#$bc_ed "libs/libswresample_.so" "libs/libswresample_.so" "av_sha_size" "av_sha_size2"
#$bc_ed "libs/libswresample_.so" "libs/libswresample_.so" "ff_reverse" "ff_reverse2"
#$bc_ed "libs/libswresample_.so" "libs/libswresample_.so" "av_get_channel_layout" "av_get_channel_layout2"

while [[ "1" ]]; do
    
    t=$(\
    emcc \
         -I "$ffmpeg_path" \
         -I "$ffmpeg_build_dir" \
         -L "libs/" \
         "libs/libavcodec.so" \
         "libs/libswresample_.so" \
         src/main.c \
         -o ffmpeg_no_wasm.js \
         -s EXPORTED_FUNCTIONS=$EXPORT_FUNC \
         -s EXTRA_EXPORTED_RUNTIME_METHODS='["ccall", "cwrap", "getValue", "writeArrayToMemory"]' \
         -s ALLOW_MEMORY_GROWTH=1 \
         -s ENVIRONMENT=web 2>&1 \
         -s WASM=0
    )
    ECODE=$?
    echo $"$t";
    err=$( echo "$t" | grep 'symbol multiply defined!' );

    if [ "$err" == "" ] ; then
        break
    else
        old_name=$(perl -e "my \$str = \"$err\";" -e "my \$regex = qr/'(.*)'/mp;" -e 'if ( $str =~ /$regex/g ) { print $1 }')
        new_name="${old_name}2"
        $bc_ed "libs/libswresample_.so" "libs/libswresample_.so" "$old_name" "$new_name"
    fi
    if [ "$ECODE" == "0" ] ; then
        break
    fi
done

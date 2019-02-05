#!/bin/bash

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

if [ ! -f "libs/libavcodec.a" ] ; then

    curdir=$(pwd)

    check_dir $ffmpeg_build_dir
    cd $ffmpeg_build_dir
    emconfigure $ffmpeg_path/configure --disable-asm --enable-cross-compile --cc=emcc --disable-programs --disable-doc --disable-everything --enable-decoder=flv
    emmake make
    cd $curdir

    cp $ffmpeg_build_dir/libavcodec/libavcodec.a ./libs/

fi

emcc \
    -I "$ffmpeg_path" \
    -I "$ffmpeg_build_dir" \
    src/main.c \
    -o ffmpeg.js \
    -s EXPORTED_FUNCTIONS='["_decode_frame", "_main"]' \
    -s EXTRA_EXPORTED_RUNTIME_METHODS='["ccall", "cwrap"]'



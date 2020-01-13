<?php

define('OUTFILE',"build/SmartSpriteCore.js");

$data = [];

function add_by_glob($gl){
    global $data;

    $t = glob($gl);
    foreach ($t as $p) {

        $skip=false;
        foreach ($data as $c) {
            //echo '---- '.$c." --- ".$p."\n";
            if($c==$p){
                $skip=true;
                //break;
            }
        }
        if(!$skip){
            echo $p."\n";
            $data[]=$p;
        }
    }
}

function remove_from_list($el){
    global $data;
    $index = array_search($el,$data);
    if($index===false)
        return;
    unset($data[$index]);
    array_values($data);
}

add_by_glob("../helpers/ffmpeg_wrapper/ffmpeg_wrapper.js");
add_by_glob("../helpers/*/*.js");
add_by_glob("../helpers/*.js");

remove_from_list("../helpers/ffmpeg_wrapper/ffmpeg.js");

add_by_glob("../flash/interface/*.js");
add_by_glob("../flash/data_types/genericDrawable.js");
add_by_glob("../flash/data_types/*.js");
add_by_glob("../flash/tags/generic*.js");
add_by_glob("../flash/tags/DefineShape.js");
add_by_glob("../flash/tags/*.js");
add_by_glob("../flash/AVM2/base/AVM2InstanceInterface.js");
add_by_glob("../flash/AVM2/*/*.js");
add_by_glob("../flash/AVM2/*.js");
add_by_glob("../flash/*.js");
add_by_glob("../*.js");
add_by_glob("SpritePlayer.js");

remove_from_list('../jsFlashPlayer.js');

print_r($data);

//die;
if(file_exists(OUTFILE))
    unlink(OUTFILE);

foreach ($data as $f){
    echo $f."\n";
    $code = file_get_contents($f);
    //$fname = substr($f,strrpos($f,"/"));
    $code = "\n\n// FILE: ".$f."\n\n".$code;

    file_put_contents(OUTFILE,$code,FILE_APPEND);
}

if($argv[1]=="export")
    file_put_contents(OUTFILE,"\n\nexport default SpritePlayer;\n",FILE_APPEND);

echo "Done!\n";

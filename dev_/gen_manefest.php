<?php

$data = [
	'manifest_version' => 2,
	"name" => "jsFlashPlayer",
	"version" => "1.0",
 
	"description" => "Flash Player written on pure JavaScript. Yes this is stupid idea, but why not?",
	"icons" => [
		"48" => "icons/icon-48.png"
	],
	"applications"=> [
		"gecko"=> [
		  "id"=> "jsFlashPlayer@mozilla.org",
		  "strict_min_version"=> "45.0"
		]
	],
  	"web_accessible_resources"=> [
		"helpers/ffmpeg_wrapper/ffmpeg.wasm"
	],
  	"content_scripts"=> [
		[
			"matches"=> ["<all_urls>"],
			"run_at" => "document_start",
			"match_about_blank"=> true,
			"all_frames"=> true,
			"js"=> []
		]
	],
	"permissions"=> [
		"<all_urls>"
	]
];

function add_by_glob($gl){
	global $data;

	$t = glob($gl);
	foreach ($t as $p) {
		
		$skip=false;
		foreach ($data['content_scripts'][0]['js'] as $c) {
			//echo '---- '.$c." --- ".$p."\n";
			if($c==$p){
				$skip=true;
				//break;
			}
		}
		if(!$skip){
			echo $p."\n";
			$data['content_scripts'][0]['js'][]=$p;
		}
	}	
}

function remove_from_list($el){
    global $data;
    $out = [];
    $arr = $data['content_scripts'][0]['js'];
    foreach ($arr as $a) {
    	if($el != $a)
    		$out[]=$a;
    }
    $data['content_scripts'][0]['js']=$out;
}

add_by_glob("helpers/ffmpeg_wrapper/ffmpeg_wrapper.js");
add_by_glob("helpers/*/*.js");
add_by_glob("helpers/*.js");
add_by_glob("flash/interface/*.js");
add_by_glob("flash/data_types/genericDrawable.js");
add_by_glob("flash/data_types/*.js");
add_by_glob("flash/tags/generic*.js");
add_by_glob("flash/tags/DefineShape.js");
add_by_glob("flash/tags/*.js");
add_by_glob("flash/AVM/*.js");
add_by_glob("flash/AVM2/base/AVM2InstanceInterface.js");
add_by_glob("flash/AVM2/*/*.js");
add_by_glob("flash/AVM2/*.js");
add_by_glob("flash/*.js");
add_by_glob("*.js");

remove_from_list("helpers/ffmpeg_wrapper/ffmpeg_no_wasm.js");



file_put_contents('manifest.json', json_encode($data));
print_r($data);
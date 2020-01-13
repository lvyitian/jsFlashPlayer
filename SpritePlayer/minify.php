<?php
/*
function autoload($class){
    print_r($class);
    die;
}

spl_autoload_register("autoload");*/

/*require_once("vendor/composer/ClassLoader.php");
$loader = new \Composer\Autoload\ClassLoader();
$loader->register();*/
require_once("vendor/autoload.php");


use MatthiasMullie\Minify;

$sourcePath = 'build/SmartSpriteCore.js';
$minifier = new Minify\JS($sourcePath);

// save minified file to disk
$minifiedPath = 'build/SmartSpriteCore.min.js';
$minifier->minify($minifiedPath);

// or just output the content
echo $minifier->minify();





<?php

$folder="/media/banka/DATA/flash/test";

function std_debug($data, $die = true){
    print_r($data);
    if($die) die();
}

function get_param($name){
    if(array_key_exists($name,$_GET))
        return $_GET[$name];
    else
        return null;
}

$file=get_param("file");



?>

<html>
<head>
</head>
<body>
<object type="application/x-shockwave-flash" data="//z0r.de/L/z0r-de_401.swf" id="flash" style="visibility: visible; width: 1127.5px; left: 50%; margin-left: -563.75px; height: 820px; top: auto; margin-top: 0px;" width="987.5" height="660"></object>
</body>
</html>

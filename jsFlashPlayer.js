"use strict";
const mime = 'application/x-shockwave-flash' 
//emulate navigation array for library sfwobject (https://github.com/swfobject/swfobject/blob/master/swfobject/src/swfobject.js)
console.log('jsFlashPlayer start');
let plugin = {
    name : 'Shockwave Flash',
    filename : 'jsFlashPlayer.js',
    description : 'Shockwave Flash 28.0 r0',
    version : 'Shockwave Flash 28.0 r0'
}
window.wrappedJSObject.navigator.plugins[plugin.name]=cloneInto(plugin,window);
let mimetype = {
    type : mime,
    suffixes : 'swf',
    enabledPlugin : window.wrappedJSObject.navigator.plugins[plugin.name]
}
window.wrappedJSObject.navigator.mimeTypes[mimetype.type]=cloneInto(mimetype,window);


//init
//TODO: make it more relyable
setTimeout(init,1000);
console.log("ok");



function init(){
    //searching flash objects in the DOM
    let objects = document.getElementsByTagName('OBJECT');
    for(let i=0;i<objects.length;i++){
        let el = objects.item(i);
        let type = el.getAttribute('type');
        if(type!=mime) continue;
        
        let url = el.getAttribute('data');
        if(url.startsWith('//')){
        	url = window.location.protocol+url;
        }

        let flash = new FlashCore(url);
    }

    objects = document.getElementsByTagName('EMBED');
    for(let i=0;i<objects.length;i++){
        let el = objects.item(i);
        let type = el.getAttribute('type');
        if(type!=mime) continue;
        
        let url = el.getAttribute('src');
        if(url.startsWith('//')){
            url = window.location.protocol+url;
        }

        if(url.indexOf('/')<0){
            //console.log(window.location.href);
            let location = window.location.href;
            url = location.substr(0,location.lastIndexOf('/')+1)+url;
        }

        let flash = new FlashCore(url);
    }
}


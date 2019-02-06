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
        url = get_swf_real_path(url);
        let width = el.getAttribute('width');
        let height = el.getAttribute('height');
        let canvas = create_canvas(el,'100%','100%');

        let flash = new FlashCore(url,canvas);
    }

    objects = document.getElementsByTagName('EMBED');
    for(let i=0;i<objects.length;i++){
        let el = objects.item(i);
        let type = el.getAttribute('type');
        if(type!=mime) continue;
        
        let url = el.getAttribute('src');
        url = get_swf_real_path(url);
        let width = el.getAttribute('width')+'px';
        let height = el.getAttribute('height')+'px';
        let align = el.getAttribute('align')+'px';
        if (align == 'middle'){
            align = 'margin: 0 auto 0 auto;'
        }else {
            align = '';
        }
        el.style = 'display:block;'+align+'width:'+width+'; height:'+height;
        let canvas = create_canvas(el,'100%','100%');

        let flash = new FlashCore(url,canvas);
    }
}

function get_swf_real_path(url){
    if(url.startsWith('//')){
        url = window.location.protocol+url;
    }
    if(url.indexOf('/')<0){
        //console.log(window.location.href);
        let location = window.location.href;
        url = location.substr(0,location.lastIndexOf('/')+1)+url;
    }
    return url;
}

function create_canvas(element, width, height){
    //checking if canvas already exists and remove them
    let ar=element.getElementsByTagName('CANVAS');
    while(ar.length>0){
        ar[0].remove();
    }

    let canvas = document.createElement('CANVAS');
    canvas.style = 'width: '+width+'; height: '+height;
    element.appendChild(canvas);
    let ctx = canvas.getContext('2d');
    ctx.fillStyle = '#00FF55';
    ctx.fillRect(0,0,canvas.width, canvas.height);
    return canvas;
}
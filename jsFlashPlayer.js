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

if(typeof(window.wrappedJSObject) == 'undefined'){
    console.log("Hello Chrome!");
    //chrome.tabs.executeScript({
        //code: 'navigator.plugins[\''+plugin.name+"'] = JSON.parse('"+JSON.stringify(plugin)+"');"
    //});
    let script = document.createElement('script');
    script.innerHTML='navigator.plugins[\''+plugin.name+"'] = JSON.parse('"+JSON.stringify(plugin)+"'); //alert('injected!')";
    document.getElementsByTagName("html")[0].appendChild(script);
    script.remove();
}else{
    window.wrappedJSObject.navigator.plugins[plugin.name]=cloneInto(plugin,window);
    let mimetype = {
        type : mime,
        suffixes : 'swf',
        enabledPlugin : window.wrappedJSObject.navigator.plugins[plugin.name]
    }
    window.wrappedJSObject.navigator.mimeTypes[mimetype.type]=cloneInto(mimetype,window);
}

//init
var init_try=0;
//console.log('initpako',pako);
var mypako=pako;
//TODO: make it more relyable
setTimeout(init,1000, mypako);
//console.log("ok");

//webNavigation.onDOMContentLoaded.addListener(init);
//body.addEventListener('load', init);
//document.body.onload=init;

function init(pako_){
    console.log('init');
    let l_pako = pako_;
    let flash = null;
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
        //let canvas = create_canvas(el,'100%','100%');
        let canvas = create_canvas(el,'100%');

        flash = new FlashCore(url,canvas);
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
        //let canvas = create_canvas(el,'100%','100%');
        let canvas = create_canvas(el,'100%','100%');

        flash = new FlashCore(url,canvas);
    }

    if(!flash){
        if(init_try<5){
            console.log('init fail',init_try);
            setTimeout(init,1000, mypako);
            init_try++;
        }
        return;
    }
    
    flash.setPako(l_pako);
}

function get_swf_real_path(url){
    if(!url){
        setTimeout(init, 1000, mypako);
    }
    if(url.startsWith('//')){
        url = window.location.protocol+url;
    }else
    if( (url.indexOf('/')<0) || url.startsWith('/') ){
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
    canvas.id = 'canvas_'+(Math.floor(Math.random()*100000000));
    element.appendChild(canvas);
    let ctx = canvas.getContext('2d');
    ctx.fillStyle = '#00FF55';
    ctx.fillRect(0,0,canvas.width, canvas.height);
    debug.start(ctx);
    canvas.onclick=function(){
    	debug.toggle();
	};

    inject_walkaround_scipts();
    
    //

    return canvas;
}

function inject_walkaround_scipts(){

    if(typeof(window.wrappedJSObject) === 'undefined')
        return;
       
    let t = SoundBuffer.toString();
    t = t.replace("class SoundBuffer", "class __flash_player__SoundBuffer");

    let script = document.createElement('script');
    script.innerHTML=t;
    document.head.appendChild(script);
    script.remove();
    

}

(function(){
    /*var oldLog = console.log.bind(console);
    console.log = function tlog(message) {
    	var args = Array.prototype.slice.call(arguments);
    	debug.log(args.join(' '));
        oldLog.apply(console, arguments);
        //oldLog(console.stack());
        //return Function.prototype.bind.call(oldLog, console)
    };*/
})();

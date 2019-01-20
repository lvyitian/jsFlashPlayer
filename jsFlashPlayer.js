"use strict";

//emulate navigation array for library sfwobject (https://github.com/swfobject/swfobject/blob/master/swfobject/src/swfobject.js)
console.log('jsFlashPlayer start');
var plugin = {
    name : 'Shockwave Flash',
    filename : '',
    description : 'Shockwave Flash 28.0 r0',
    version : 'Shockwave Flash 28.0 r0'
}
window.wrappedJSObject.navigator.plugins[plugin.name]=cloneInto(plugin,window);
var mimetype = {
    type : 'application/x-shockwave-flash',
    suffixes : 'swf',
    enabledPlugin : window.wrappedJSObject.navigator.plugins[plugin.name]
}
window.wrappedJSObject.navigator.mimeTypes[mimetype.type]=cloneInto(mimetype,window);

//searching flash objects in the DOM


console.log("ok");


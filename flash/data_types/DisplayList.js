"use strict";

class DisplayList{
	constructor(){
		this.list = [];

		//constants
		this.TYPE_PlaceObject2 = 26;
	}
	add(depth, object){
		this.list[depth] = object;
	}
}
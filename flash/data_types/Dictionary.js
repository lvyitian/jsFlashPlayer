"use strict";

class Dictionary{
	constructor(){
		this.dict = [];


		//constants or some like them
		this.TypeVideoStream = 60;
	}

	add(characterID, object){
		this.dict[characterID] = object;
	}

}
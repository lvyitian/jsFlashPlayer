//Запросы ----------------------------------------------------------------------------------------------------------------

function show_error(message){
    alert(message);
}

//Отправка запроса
function send_query(filename,query,after_complete){

	try {
	var xmlhttp = getXmlHttp(); // Создаём объект XMLHTTP
	xmlhttp.open("GET", filename, true); // Открываем асинхронное соединение
	//xmlhttp.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded'); // Отправляем кодировку
	xmlhttp.responseType = "arraybuffer";
	
		xmlhttp.send(query);
	} catch(e) {
		// statements
		console.log(e);
	}
	
	//t=outP.innerHTML;
	query_in_process=true;
	xmlhttp.onreadystatechange = function() { // Ждём ответа от сервера
		if (xmlhttp.readyState == 4) { // Ответ пришёл
			query_in_process=false;
			if(xmlhttp.status == 200) { // Сервер вернул код 200 (что хорошо)
//		        console.log(xmlhttp.response);
				if(after_complete!=null) {
				    var out = new Uint8Array(xmlhttp.response);
				    after_complete(out);
			    }

			}else show_error("Ошибка при отправке запроса "+xmlhttp.status);
		}
	}
}

function getXmlHttp() {
	var xmlhttp;
	try {
		xmlhttp = new ActiveXObject("Msxml2.XMLHTTP");
	} catch (e) {
		try {
			xmlhttp = new ActiveXObject("Microsoft.XMLHTTP");
		} catch (E) {
			xmlhttp = false;
		}
	}
	if (!xmlhttp && typeof XMLHttpRequest!='undefined') {
		xmlhttp = new XMLHttpRequest();
	}
	return xmlhttp;
}

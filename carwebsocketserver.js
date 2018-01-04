const http = require('http');

var W3CWebSocket = require('websocket').w3cwebsocket;
var wsHost = "car.grid.tw";
var client1 = new W3CWebSocket('ws://'+wsHost+':999/');

var sht31temp = '';
var sht31humidity    = '';
var nodeid = process.argv[2];
var light  = '';
var pm10   = '';
var pm25   = '';
var pm100  = '';

//		var json = { nodeid : nodeid, temperature: temperature, humidity: humidity, light: light, pm10: pm10, pm25: pm25, pm100: pm100}; 
//		console.log ("send To "+wsHost+":999"+JSON.stringify(jsonTest));

client1.onerror=onerror;  
var onerror = function() {
    console.log('Connection Error');
};

const SerialPort = require("serialport").SerialPort;
const serialPort = new SerialPort("/dev/ttyS0", {
  baudrate: 9600
});

const os = require('os');

var interfaces = os.networkInterfaces();

var addresses = [];
for (var k in interfaces) {
    for (var k2 in interfaces[k]) {
        var address = interfaces[k][k2];
        if (address.family === 'IPv4' && !address.internal) {
            if (address.address.indexOf(".1.")!=-1) {
                    ipaddress = address.address;
                    addresses.push(address.address);
            }
        }
    }
}

console.log(addresses);

function htmlEntities(str) {
    return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;')
                      .replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}


//-----------------------------------
var webSocketsServerPort = 1337;
var clients =[];

var server = http.createServer(function(request, response) {
    // Not important for us. We're writing WebSocket server, not HTTP server
});
server.listen(webSocketsServerPort, function() {
    console.log((new Date()) + " Server is listening on port " + webSocketsServerPort);
});

// websocket and http servers
const webSocketServer = require('websocket').server;
var wsServer = new webSocketServer({
    // WebSocket server is tied to a HTTP server. WebSocket request is just
    // an enhanced HTTP request. For more info http://tools.ietf.org/html/rfc6455#page-6
    httpServer: server
});

//-----------------------------------------------
var str = "";
var newStr="";

var count=0;
serialPort.on("open", function () {
  serialPort.on('data', function(data) {
//    console.log ("serialPort data:"+data);
    var temp = data.toString().trim();
    
    str = str+temp;
    var p = false;
    
    for (var i=0;i<temp.length;i++) {
      if (temp[i]=='x') p = true;
    }
    
    if (p) {
      count++;
//      if (count%10==0) {
        console.log ("serialPort read :"+str);
	
//      }    

      newStr = str;
      setJSONObj();
      str = "";
    }
  });
});


wsServer.on('request', function(request) {
    console.log((new Date()) + ' Connection from origin ' + request.origin + '.');

    // accept connection - you should check 'request.origin' to make sure that
    // client is connecting from your website
    // (http://en.wikipedia.org/wiki/Same_origin_policy)

    var connection = request.accept(null, request.origin);

    // we need to know client index to remove them on 'close' event
    var index = clients.push(connection) - 1;
    var userName = false;
    var userColor = false;

    console.log((new Date()) + ' Connection accepted.');

    connection.on('message', function(message) {

        if (message.type === 'utf8') { // accept only text
                if (message.utf8Data.trim()=='status') {
                        setJSONObj();
                        console.log ('jsonObj:'+JSON.stringify(jsonObj));
                        for (var i=0; i < clients.length; i++) {
//                            clients[i].sendUTF(JSON.stringify(jsonObj));
                        }
                }

                if (message.utf8Data.trim().indexOf("{")!=-1) {
                        var json = message.utf8Data.trim();
                        console.log ("receive json:"+json);

                        var jsonObjTemp = JSON.parse(json);
			
//                        if (jsonObjTemp.action>0) {
                                jsonObj = jsonObjTemp;
				console.log("action:"+jsonObj.action);
				if (jsonObj.action=='setPower') {
	                               sendSerialData ("setPower\t"+jsonObj.pstate+"\t"+jsonObj.npin+"\n");
         	                       console.log ("setting power------>"+jsonObj.client+"\t"+jsonObj.pstate+"\t"+jsonObj.npin);
				}
				if (jsonObj.action=='getDHT22') {
					console.log ("send getDHT22 to arduino");
					sendSerialData ("getDHT22\t0\t0\n");
				}
				if (jsonObj.action=='getLight') {
					console.log ("send getLight to arduino");
					sendSerialData ("getLight\t0\t0\n");
				}
				if (jsonObj.action=='getSHT31') {
					console.log ("send getSHT31 to arduino");
					sendSerialData ("getSHT31\t0\t0\n");
				}
				if (jsonObj.action=='getPMS5003') {

					console.log ("send getPMS5003 to arduino");
					sendSerialData ("getPMS5003\t0\t0\n");
				}
				
//                        }
                        console.log ("receive jsonObj:"+JSON.stringify(jsonObj));
                }
                // we want to keep history of all sent messages

                var obj = {
                    time: (new Date()).getTime(),
                    text: htmlEntities(message.utf8Data),
                    author: userName,
                    color: userColor
                };

                // broadcast message to all connected clients
                var json = JSON.stringify({ type:'message', data: jsonObj });

                for (var i=0; i < clients.length; i++) {
                    clients[i].sendUTF(json);
                }
        }
    });
    // user disconnected
    connection.on('close', function(connection) {
        if (userName !== false && userColor !== false) {
            console.log((new Date()) + " Peer "  + connection.remoteAddress + " disconnected.");
            // remove user from the list of connected clients
            clients.splice(index, 1);
            // push back user's color to be reused by another user
            colors.push(userColor);
        }
    });

});

function getArduino() {
	console.log ("send getDHT22 to arduino");
	sendSerialData ("getSHT31\t0t0\n");


	console.log ("send getLight to arduino");
	sendSerialData ("getLight\t0\t0\n");

	console.log ("send getPMS5003 to arduino");
	sendSerialData ("getPMS5003\t0\t0\n");
}

sensorIntervalFun = setInterval(getArduino, 5000);

function setJSONObj() {
	
        jsonObj = { "ipaddress":"192.168.1.105", "nodeid": nodeid, "str":newStr }
	console.log ("newStr:"+newStr);

//	if (Temp = 22.54 CHum = 51.81%x	

	if (newStr.indexOf("Temp")!=-1) {
		var t = newStr.split(" ");
		sht31temp = t[2];
		sht31humidity =t[5];
		console.log (t[2]+"\t"+t[5]);
	}
	if (newStr.indexOf("Light")!=-1) {
		var t = newStr.split(" ");
		light = t[3];
		console.log (t[3]);
	}
	if (newStr.indexOf("PM")!=-1) {
		var t = newStr.split(" ");

		pm10 = t[1];
		pm25 = t[2];
		pm100= t[3];

//		console.log (pm10+"\t"+pm25+"\t"+pm100);

/*
		for (var count=0;count<t.length;count++) {
			console.log (count+"\t"+t[count]);
//			console.log (pm10+"\t"+pm25+"\t"+pm100);
		}
*/
	}

}

function sendSerialData(sendStr) {
        serialPort.write (sendStr+"\n");
}

client1.onopen = function() {
    console.log('WebSocket Client Connected');

    var action="Test";
    var pstate="1";
    var npin="1";

    function sendNumber() {
        if (this.readyState === this.OPEN) {
            var number = Math.round(Math.random() * 0xFFFFFF);
            try {
                
//                var jsonTest = {client:'123',action:action, pstate: pstate+",", npin: npin+","};

		var json = { nodeid : nodeid, sht31temp: sht31temp, sht31humidity: sht31humidity, light: light, pm10: pm10, pm25: pm25, pm100: pm100}; 

		console.log ("send To "+wsHost+":999"+JSON.stringify(json));

                client1.send(JSON.stringify(json));
//                npinCount++;
//                action++;   
            } catch (e) {   
                console.log (e);
                client1 = new W3CWebSocket('ws://'+wsHost+':999/');
            }
            setTimeout(sendNumber, 5000);
        }
    }
    sendNumber();
};

client1.onclose=onclose;

var onclose = function() {
    console.log('echo-protocol Client Closed');
    try {
        this.onopen();
    } catch (e) {
        console.log(e);
        while (this.onopen());
    }
};   

client1.onmessage = function(e) {
    if (typeof e.data === 'string') {
        console.log("Received: '" + e.data + "'");
        try {

        } catch (e) {
            console.log (e);
        }
         
//        var token = e.data.split("\t");
//        token.forEach( (data, index) => {
//            console.log (index+"\t"+data);
//        });
    }
};   

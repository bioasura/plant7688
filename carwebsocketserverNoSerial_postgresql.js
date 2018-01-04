const { Client } = require('pg')

const http = require('http');

const client = new Client({
  user: 'postgres',
  host: 'localhost',
  database: 'carsensor',
  password: '',
  port: 5432
});

client.connect();

/*
const SerialPort = require("serialport").SerialPort;
const serialPort = new SerialPort("/dev/ttyS0", {
  baudrate: 9600
});
*/
var nodeid = process.argv[2];
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
var webSocketsServerPort = 999;
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
/*
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
      if (count%10==0) {
        console.log (str);
	
      }    
      newStr = str;	      
      setJSONObj();          
      str = "";
    }
  });
});
*/

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

                        jsonObj = jsonObjTemp;
                        console.log (jsonObj);
                        
//                        json.forEach( function(key) {
//                          console.log (key.address+"\t"+key.quality+"\t"+key.essid+"\t"+key.mode+"\t"+key.encryption);

                        console.log ("Hello: "+jsonObj.nodeid+"\t"+jsonObj.sht31temp+"\t"+jsonObj.sht31humidity+"\t"+jsonObj.light+jsonObj.pm10+"\t"+jsonObj.pm25+"\t"+jsonObj.pm100);

                        var query = {
                          text: 'INSERT INTO carsensor (id, pm10, pm25, pm100, sht31temp, sht31humidity, light, dtime) VALUES ($1, $2, $3, $4, $5, $6, $7, CURRENT_TIMESTAMP)',
                          values: [jsonObj.nodeid, parseFloat(jsonObj.pm10), parseFloat(jsonObj.pm25), parseFloat(jsonObj.pm100), parseFloat(jsonObj.sht31temp), parseFloat(jsonObj.sht31humidity), parseFloat(jsonObj.light)],
                        }
                        client.query(query, (err, res) => {
                          if (err) {
                            console.log("error:"+err.stack);
                            process.exit(0);
                          } else {
              //              console.log("result:"+JSON.stringify(res));
                          }
                          
                        });
			
                        
//                        console.log("action:"+jsonObj.action);
                        
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

function setJSONObj() {
        jsonObj = { "ipaddress":"192.168.1.105", "nodeid": nodeid, "str":newStr }
}

function sendSerialData(sendStr) {
        serialPort.write (sendStr+"\n");
}

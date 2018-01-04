var exec = require('child_process').exec;
var cmd = '/root/reset.sh';
var SerialPort = require("serialport").SerialPort
var serialPort = new SerialPort("/dev/ttyS0", {
  baudrate: 9600
});

var actionInterval=1000;
var powerCount=-20;
var sensorCount=0;
var str="";
var nodeid = process.argv[2];

var request = require('request');
var Array = require('node-array');
var m = require('mraa');
var isSerialData = false;

function getMCUPowerQueryController() {
		if (isSerialData==false) {
			request(
			    { method: "POST"
			    , uri: 'http://192.168.1.112/MCUPowerQueryController'
			    , json: {nodeid: nodeid}
			  }
			  , function (error, response, body) {
			      if(response.statusCode == 201){
			        console.log('document saved as: http://mikeal.iriscouch.com/testjs/'+ rand)
			      } else {
//			        console.log('error: '+ response.statusCode)
//			        console.log(body);
//				var nodeid = body.nodeid;

//				console.log (nodeid);
				var devicePowerList = body.devicePowerList;

//				console.log (devicePowerList);

				devicePowerList.forEachAsync (
					function (element, index, arr) {
//						console.log (element);
						var devid = element.devid;
						var pstate   = element.pstate;
						var npin  = element.npin;


//						var gpio = new m.Gpio(parseInt(npin));
//						gpio.dir (m.DIR_OUT);
//						gpio.write (parseInt(pstate));

						serialPort.write (devid+"\t"+pstate+"\t"+npin+"\n");
						console.log (powerCount+"\t"+sensorCount+"\t"+devid+"\t"+pstate+"\t"+npin);
					}
				);
//				console.log (powerCount+"\t"+sensorCount);
				serialPort.write ("PowerCount:\t"+powerCount+"\tSensorCount:\t"+sensorCount+"\n");

				if (powerCount%10==0 && sensorCount!=0) {
					console.log ('getDHT22..\t'+nodeid+'\t'+sensorCount);
					serialPort.write ("getDHT22\n");
//					sensorCount=0;
				}

				if (powerCount==0) {
					powerCount=-30;
				}

				if (powerCount==-15 && sensorCount!=0) {
					console.log ('getDS18B20..\t'+nodeid+'\t'+sensorCount);
					serialPort.write ("getDS18B20\n");
				}


				if (powerCount>10) {
					console.log ("!!!!!!!!!!!!!!!! Reset arduino !!!!!!!!!!!!");
                                        exec(cmd, function(error, stdout, stderr) {
                                          // command output is in stdout
                                                console.log (stdout);
                                        });
					powerCount=-20;
					sensorCount=0;
				}
				powerCount++;

			      }
			    }
			  )
		}
}
setInterval (getMCUPowerQueryController, actionInterval);



serialPort.on("open", function () {
  serialPort.on('data', function(data) {
	isSerialData = true;
    // Receive data from Arduino chip (32U4)
//	console.log (data);
//	console.log (data.length);

	var i=0;
//	var str = "";

	for (i=0;i<data.length;i++) {
		if (data[i]==13) continue;
 		if (data[i]==10) {
//			str="";
			var request = require('request');
			var rand = Math.floor(Math.random()*100000000).toString();
		
//			console.log ('powerCount:\t'+powerCount);
			if (str.indexOf("Arduino")!=-1) {
				console.log ('<---\t'+str);
			} else {
				console.log ('\n===============   ---->   Sending From Arduino  ---->    =================');
				console.log (str);
				console.log ('===================================\n');

			}
/*
			request('http://140.112.93.11:666/biobio', function (error, response, body) {
			  if (!error && response.statusCode == 200) {
			    console.log(body) // Show the HTML for the Google homepage.
			  }
			})

*/
//    ,  body: JSON.stringify({foo: 'bar', _attachments: {'message.txt': {follows: true, length: 18, 'content_type': 'text/plain' }}})
//			    , uri: 'http://192.168.1.112/NodeDeviceController'


			if ((str.indexOf("Humidity")!=-1)||(str.indexOf("DS18B20Temperature")!=-1)) {
                            request(
                                { method: "POST"
                                , uri: 'http://192.168.1.112/MCUSensorValueController'
                                , json: {nodeid: nodeid, value: str, type: 'tmp'}
                                }
                                , function (error, response, body) {
                                  if(response.statusCode == 201){
                                    console.log('document saved as: http://mikeal.iriscouch.com/testjs/'+ rand)
                                  } else {
                                    console.log('error Fetch sensorValue: '+ response.statusCode)
                                    console.log(body)
                                  }
                                }
                            )
			}
                        str="";
		} else {
			str = str+String.fromCharCode(data[i]);
		}

	}
//	powerCount=1;
	sensorCount++;

	if (sensorCount>1200) {
		// I will send a close flag to server for logging the job in sucess ending. 
		// Now I have not send the flag yet.
		console.log ("******************* Arduino_DHT22.js is End **************");
		process.exit(1);
	}
	isSerialData = false;
//    myApp.emit('heartrate','', data); // upload to MCS
  });
});


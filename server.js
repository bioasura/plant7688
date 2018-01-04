var http = require("http");
var url = require('url');
var fs = require('fs');
var os = require('os');

var responseStr="";
var DHT22Str = "";
var DS18B20Str = "";
var CO2Str = "";
var PM25Str = "";
var PMATStr = "";
var PHSensorStr = "";
var LightSensorStr = "";

var PMCF010Str = "";
var PMCF025Str = "";
var PMCF100Str = "";
var PMAT010Str = "";
var PMAT025Str = "";
var PMAT100Str = "";


var count=0;
var realCount=0;
var averagePH = 0;
var totalPH = 0;
var phCount = 1;

var lightOn = true;
var motorOn = true;
var fan1On  = true;
var fan2On  = true;

var isShowDB = true;
var isDebug = false;

var isNegLogic = false;
var isAutoPower = true;
var autoPower = true;

var negLogicStr = "";
var phSet     = "PH";
var phValue	= "";

var autoPowerStr = "";
var prePowerStr = "";

var powerStr = "0,0,0,0,";

var autoPowerSetting="1";
var autoPowerCount=0;

// ------- sensor setting ------------
var isDHT22	= true;
var isDS18B20	= true;
var isLight	= true;
var isPM25	= true;
var isCO2	= true;
var isPH	= true;
var isEC	= true;

var isDoneDHT22	= false;
var isDoneDS18B20	= false;
var isDoneLight	= false;
var isDonePM25	= false;
var isDoneCO2	= false;
var isDonePH	= false;
var isDoneEC	= false;

var PH4SetTime = "";
var PH7SetTime = "";

var countStatus = "";

var jsonObj = {};

var sensorCheckNumber = 0;

var dbHost = "www.grid.tw:1210"
//var dbHost = "10.2.6.118"

var getPH7 = function() {

	fs.readFile(__dirname + '/PHParam.json', function(error, data) {
		var jsonObj = JSON.parse(data);
		ph7 = parseFloat(jsonObj.PH7);
		PH7SetTime = jsonObj.PH7SetTime;
	});
	console.log ('getPH7: '+ph7)

}

var getPH4 = function() {

	fs.readFile(__dirname + '/PHParam.json', function(error, data) {
		var jsonObj = JSON.parse(data);
		ph4 = parseFloat(jsonObj.PH4);
		console.log ('getPH4: '+ph4)
		PH4SetTime = jsonObj.PH4SetTime;
	});

}

var initial = function(path, result) {
	getPH7();
	getPH4();
}

initial();

var params=function(req){
  var q=req.url.split('?'),result={};
  if(q.length>=2){
      q[1].split('&').forEach(function (item) {
           try {
             result[item.split('=')[0]]=item.split('=')[1];
           } catch (e) {
             result[item.split('=')[0]]='';
           }
      })
  }
  return result;
}

var server = http.createServer(function(request, response) {

//  console.log('Connection:\t'+count+'\t'+realCount);
  var path = url.parse(request.url).pathname;

  switch (path) {
    case '/':
	response.writeHead(200, {'Content-Type': 'text/html'});
	response.write('Hello, World.'+count);
	response.end();
	count++;
	break;

    case '/test.html':
	fs.readFile(__dirname + path, function(error, data) {

      	if (error){
        	response.writeHead(404);
        	response.write("opps this doesn't exist - 404");
        } else {
          	response.writeHead(200, {"Content-Type": "text/html"});
          	response.write(data, "utf8");
        }
        response.end();
	});

	response.writeHead(200, {'Content-Type': 'text/html'});
	response.write ();
	break;
	
    case '/status.html':
	request.params=params(request);
//	console.log(request.params.name);

	var npin = request.params.npin;
	var pstate=request.params.pstate;
	var sensorIntervalStr = request.params.sensorInterval;

	autoPowerSetting = request.params.autoPower;
	phSet = request.params.phSet;

//	console.log ("phSet: "+phSet);
	
	negLogicStr =  request.params.negLogic;

	if (sensorIntervalStr != null) sensorInterval = parseInt(sensorIntervalStr);

	if (phSet=="PH7") {
		console.log ("phSet is PH7");
		var nowStr = new Date().toISOString().replace(/T/, ' ').replace(/\..+/, '');
		PH7SetTime = nowStr;
		ph7 = averagePH;
		
		jsonObj.ph7 = averagePH;
		jsonObj.PH7SetTime = PH7SetTime;

		fs.writeFile(__dirname+'/PHParam.json',JSON.stringify(jsonObj)+'\n',function(error){ 
			if(error){
				console.log ('write error');
			}
		});		
	}
	if (phSet=="PH4") {
		console.log ("phSet is PH4");
		var nowStr = new Date().toISOString().replace(/T/, ' ').replace(/\..+/, '');
		PH4SetTime = nowStr;
		ph4 = averagePH;

		jsonObj.ph4 = averagePH;
		jsonObj.PH4SetTime = PH4SetTime;

		fs.writeFile(__dirname+'/PHParam.json',JSON.stringify(jsonObj)+'\n',function(error){ 
			if(error){
				console.log ('write error');
			}
		});		

	}

	var isDHT22Str	= request.params.isDHT22;
	var isPM25Str 	= request.params.isPM25;
	var isCO2Str	= request.params.isCO2;
	var isLightStr	= request.params.isLight;
	var isECStr	= request.params.isEC;
	var isDS18B20Str= request.params.isDS18B20;
	var isPHStr	= request.params.isPH;
	var PH4		= request.params.PH4;
	var PH7		= request.params.PH7;
	var resetPH	= request.params.resetPH;

	if (resetPH=="1") {
//		N = 6;
//		MeanSize = 10;
//		MovingMeanSize = 6;
//		FinalMovingMeanSize = 60;

		
		rawData = [];

		meanData= [];
		moveMeanData=[];
		movingData=[];
		FinalMovingMeanData=[];

		movingCount=0;
		meanDataCount=0;
		moveMeanDataCount=0;
		finalMovingMeanDataCount=0;
		
		phCount=0;
	}

	if (PH4!=null) {
		ph4 = parseInt(PH4);
		var nowStr = new Date().toISOString().replace(/T/, ' ').replace(/\..+/, '');
		PH4SetTime = nowStr;

	}
	if (PH7!=null) {
		ph7 = parseInt(PH7);
		var nowStr = new Date().toISOString().replace(/T/, ' ').replace(/\..+/, '');
		PH7SetTime = nowStr;
	}		

	if (isDHT22Str	=="1") isDHT22	= true;
	if (isDHT22Str	=="0") isDHT22	= false;
	if (isPM25Str	=="1") isPM25	= true; 
	if (isPM25Str	=="0") isPM25	= false;
	if (isCO2Str	=="1") isCO2	= true;
	if (isCO2Str	=="0") isCO2	= false;
	if (isLightStr	=="1") isLight	= true;	
	if (isLightStr	=="0") isLight	= false;
	if (isDS18B20Str=="1") isDS18B20= true;
	if (isDS18B20Str=="0") isDS18B20= false;
	if (isPHStr	=="1") isPH	= true;
	if (isPHStr	=="0") isPH	= false;
	if (isECStr	=="1") isEC	= true;
	if (isECStr	=="0") isEC	= false;
	
	sensorCheckNumber = 0;
	if (isDHT22) sensorCheckNumber++;
	if (isPM25) sensorCheckNumber++;
	if (isCO2) sensorCheckNumber++;
	if (isLight) sensorCheckNumber++;
	if (isDS18B20) sensorCheckNumber++;
	if (isPH) sensorCheckNumber++;
	if (isEC) sensorCheckNumber++;

	if (autoPowerSetting=="1") {
		autoPower=true;
	} else {
		autoPowerCount=0;
		autoPower=false;
	}
	if (negLogicStr=="1") {
		
		isNegLogic=true;
	}
	
	var nowStr = new Date().toLocaleTimeString();

//	console.log ("nowStr:"+nowStr);
	if (isDebug) {
		console.log ("nowStr: "+nowStr);
	}
	var nowHour= nowStr.split(":")[0];
	var nowMin = nowStr.split(":")[1];

	var nH = parseInt(nowHour);

	if (!autoPower) {
		npinStr = npin;
		pstateStr = pstate;
		powerStr = pstate;
		sendSerialData ("setPower\t"+powerStr+"\t"+npin+"\n");
	}

	
	jsonObj = { "nodeid": nodeid, "isDHT22": isDHT22, 
			"rawData": rawData,
			"meanData": meanData,
			"moveMeanData": moveMeanData,
			"FinalMovingMeanData": FinalMovingMeanData,
			"countStatus": countStatus,
			"autoPowerCount": autoPowerCount, "autoPowerSetting": autoPowerSetting,
			"phCount": phCount, "PH7": ph7, "PH4": ph4, 
			"PH4SetTime": PH4SetTime, "PH7SetTime": PH7SetTime,
			"isDS18B20": isDS18B20, "isPH": isPH, "isLight": isLight, "isCO2" : isCO2, 
			"isEC": isEC, "isPM25": isPM25, "nowHour": nowHour, "nH" : nH, 
			"autoPowerStr": autoPowerStr, "powerStr": powerStr,
			"sensorCheckNumber": sensorCheckNumber,
			"PH" : nowPH, "nowPHValue": phValue, "meanPHValue": phMean, "moveMean": phMoveMean,
			"sensorCount": sensorCount, "sensorInterval": sensorInterval,
			"DHT22": DHT22Str, "DS18B20": DS18B20Str, "PHSensor": PHSensorStr, "LightSensor": LightSensorStr,
			"PMCF_010": PMCF010Str, "PMCF_025": PMCF025Str, "PMCF_100" : PMCF100Str };
	
//	console.log (JSON.stringify(jsonObj).replace(',',',\r\n'));

	response.writeHead(200, {'Content-Type': 'application/json'});

//	response.writeHead(200);
/*
	response.write ("DHT22:\t"+DHT22Str+os.EOL);
	response.write ("DS18B20:\t"+DS18B20Str+os.EOL);
	response.write ("PHSensor:\t"+PHSensorStr);
*/
//	response.write (JSON.stringify(jsonObj).replace(/,/g,',\r\n'));
	response.write (JSON.stringify(jsonObj));

	response.end();
	break;

    case '/ct.html':
	

//      fs.readFile(__dirname + path, function(error, data) {
        fs.readFile(__dirname + '/control.html', function(error, data) {

        if (error){
          response.writeHead(404);
          response.write("opps this doesn't exist - 404");
        } else {
          response.writeHead(200, {"Content-Type": "text/html"});
          response.write(data, "utf8");
        }
        response.end();
      });

      break;
    case '/ph.html':
	

//      fs.readFile(__dirname + path, function(error, data) {
        fs.readFile(__dirname + '/ph.html', function(error, data) {

        if (error){
          response.writeHead(404);
          response.write("opps this doesn't exist - 404");
        } else {
          response.writeHead(200, {"Content-Type": "text/html"});
          response.write(data, "utf8");
        }
        response.end();
      });

      break;
    default:
      response.writeHead(404);
      response.write("opps this doesn't exist - 404");
      response.end();
      break;
  }
  realCount++;
});

server.listen(888);

var exec = require('child_process').exec;
var timeCMD='/bin/date > /tmp/date'
var cmd = '/root/reset.sh';
var SerialPort = require("serialport").SerialPort
var serialPort = new SerialPort("/dev/ttyS0", {
  baudrate: 9600
});

var sensorInterval=1000;
var powerInterval =1000;
var powerCount=-20;
var sensorCount=0;
var str="";
//var ph7 = process.argv[4];
//var ph4 = process.argv[5];
var ph7 = 760;
var ph4 = 905;
var nowPH = 0;
var nodeid = process.argv[2];
var negLogicArgvStr = process.argv[3];

var request = require('request');
var Array = require('node-array');
var m = require('mraa');
var isSerialData = true;
var pstateStr = "";
var npinStr = "3,4,5,6,";
var npinStrDef="3,4,5,6,";
var powerState = [];

//setInterval (getArduino, sensorInterval);
//setInterval (setPower, powerInterval);


function setPower() {
	var autoPowerOff = parseInt(autoPowerSetting);
	if (autoPowerCount > autoPowerOff) {
		autoPower = true;
	}
	if (autoPowerSetting=="0" && autoPowerCount>10) {
		// use autoPowerCount to automatic power control variable,
		// if (autoPowerCount > 10) then autoPower setting to true.
		// it means when user set the autoPower = 0 after 10 seconds , system will change to be autoPower state.
		autoPower = true;
	}
	if (autoPowerCount>1000) autoPowerCount=0;
/*
        exec(timeCMD, function(error, stdout, stderr) {
                                          // command output is in stdout
		console.log (stdout);
	});

        fs.readFile('/tmp/date', function(error, data) {
                if (error){
			console.log (err);
			console.log (data);
                } else {
			console.log (data);
                }
        });
*/

//	var nowStr = new Date().toISOString().replace(/T/, ' ').replace(/\..+/, '');
	var nowStr = new Date().toLocaleTimeString();

	console.log ("setPower nowStr:"+nowStr);
	if (isDebug) {
		console.log ("nowStr: "+nowStr);
	}
	var nowHour= nowStr.split(":")[0];
	var nowMin = nowStr.split(":")[1];

	var nH = parseInt(nowHour);
	var nM = parseInt(nowMin);

	if (isDebug) {
		console.log ("nH:"+nH+"\tnM:"+nM);
	}

	var aC = nH>=10 && nH <=12;
	var bC = nH>=0  && nH <=1;
	var cC = nH>=18  && nH <24;

	var dC = nH%2==0;
	var eC = nM%2==0;
	var fC = nM > 30;

	if (((aC && fC) || bC || cC) && dC) {
//		console.log ('1111');
		powerState[0]=true; 
	} else {
//		console.log ('22222');
		powerState[0]=false;
	}
	if (((aC && fC) || bC || cC) && !dC) {
//		console.log ('33333');
		powerState[1]=true;
	} else {
///		console.log ('55555');
		powerState[1]=false;
	}

/*
	if (fan1On ) powerState[0]=true; else powerState[0]=false;
	if (fan2On ) powerState[1]=true; else powerState[1]=false;
	if (lightOn) powerState[2]=true; else powerState[2]=false;
	if (motorOn) powerState[3]=true; else powerState[3]=false;
*/
	if (isDebug) {
		console.log ("nowHour: "+nowHour+"\tnowMin: "+nowMin);
	}

	autoPowerStr = "";


//	console.log ("negLogicArgvStr:"+negLogicArgvStr);
//	console.log ("negLogicStr:"+negLogicStr);
	
	if (negLogicArgvStr=="1") {
//		console.log ("negLogicArgvStr is 1 ");
		isNegLogic=true; 
	} else {
//		console.log ("negLogicArgvStr is not 1 ");

		 isNegLogic=false;
	}
	if (negLogicStr=="1") {
//		console.log ("negLogicStr is 1 ");
		isNegLogic=true;
	}
	if (negLogicStr=="0") {
//		console.log ("negLogicStr is 0 ");
		isNegLogic=false;
	}
	
	
	
	for (var i=0;i<powerState.length;i++) {
		if (isNegLogic) {
//			console.log ("origin powerState["+i+"]="+powerState[i]);
			powerState[i] = !powerState[i];
//			console.log ("new powerState["+i+"]="+powerState[i]);
		}
//		console.log ("powerState\t"+i+"\t"+powerState[i]);
		if (powerState[i]) {
			autoPowerStr = autoPowerStr + "1,";
		} else {
			autoPowerStr = autoPowerStr + "0,";
		}
	}
	if (isDebug) {
		console.log ("setPower\tA:"+autoPowerStr+"\tP:"+powerStr+"\t"+npinStr);
	}
	if (autoPowerStr) {
		if (powerStr==undefined) {
			powerStr = autoPowerStr;
		}
		if (npinStr==undefined) {
			npinStr = npinStrDef;
		}
	}
	if (autoPower) {
		if (autoPowerStr!=prePowerStr) {
			console.log ("autoPowerStr != prePowerStr\t"+autoPowerStr+"\t"+prePowerStr);
			sendSerialData ("setPower\t"+autoPowerStr+"\t"+npinStr);
			prePowerStr = autoPowerStr;
		} else {
//			console.log ("autoPowerStr == prePowerStr, don't sendTo Arduino PowerCMD");
		}
	} else {
		if (powerStr!=prePowerStr) {
			console.log ("powerStr != prePowerStr\t"+powerStr+"\t"+prePowerStr);
			sendSerialData ("setPower\t"+powerStr+"\t"+npinStr);
			prePowerStr = powerStr;
		} else {
//			console.log ("powerStr == prePowerStr, don't sendTo Arduino PowerCMD");
		}
	}
	autoPowerCount++;
}

function sendSerialData(sendStr) {
	while (!isSerialData);
	isSerialData = false;

	serialPort.write (sendStr+"\n");
		
	isSerialData = true;
}

function showLog(str, debug) {
	if (debug==null) {
		console.log ("To Arduino --> \t"+str);
	} else {
		if (isDebug) {
			console.log ("===== "+debug+" =====>\t"+str);
		}
	}
}

var getArduino = function() {
	serialData = [];
	serialCount= 0;
	serialRealData = [];

        if (isDHT22 && !isDoneDHT22 && sensorCount>=1) {
                showLog ('getDHT22..\t'+nodeid+'\t'+sensorCount);
                sendSerialData ("getDHT22\n");
                isDoneDHT22 = true;
                sensorCount++;
                return;
        }
        if (isPH && !isDonePH && sensorCount>=1) {
                showLog ('getPHSensor..\t'+nodeid+'\t'+sensorCount);
                sendSerialData ("getPHSensor\n");
                isDonePH = true;
                sensorCount++;
                return;
        }
        
        if (isPM25 && !isDonePM25 && sensorCount>=1) {
                showLog ('getPM25..\t'+nodeid+'\t'+sensorCount);
                sendSerialData ("getPMS5003\n");
                isDonePM25 = true;
                sensorCount++;
                return;
        }

        if (isDS18B20 && !isDoneDS18B20 && sensorCount>=1) {
                showLog ('getDS18B20..\t'+nodeid+'\t'+sensorCount);
                sendSerialData ("getDS18B20\n");
                isDoneDS18B20 = true;

                sensorCount++;
                return;
        }
        if (isLight && !isDoneLight && sensorCount>=1) {
                showLog ('getLightSensor..\t'+nodeid+'\t'+sensorCount);
                sendSerialData ("getLightSensor\n");
                isDoneLight = true;

                sensorCount++;
                return;
        }

        if (isCO2 && !isDoneCO2 && sensorCount>=1) {
                showLog ('getCO2..\t'+nodeid+'\t'+sensorCount);
                sendSerialData ("getCO2\n");
                isDoneCO2 = true;

                sensorCount++;
                return;
        }

        if (isEC && !isDoneEC && sensorCount>=1) {
                showLog ('getEC..\t'+nodeid+'\t'+sensorCount);
                sendSerialData ("getEC\n");
                isDoneEC = true;

                sensorCount++;
                return;
        }

        if (sensorCount > sensorCheckNumber) {
                sensorCount=0;

		isDoneDHT22 = false;
		isDonePM25 = false;
		isDonePH = false;
		isDoneDS18B20 = false;
		isDoneLight = false;
		isDoneCO2 = false;
		isDoneEC = false;
		return;
        }
	if (sensorCount==0) sensorCount++;

	clearInterval(sensorIntervalFun);
	sensorIntervalFun = setInterval (getArduino, sensorInterval);
}
var sensorIntervalFun = setInterval(getArduino, sensorInterval);

var serialCount=0;
var serialData = [];
var serialRealData = [];

function toggleMotor() {
	motorOn = !motorOn;
}
function setLightOn(status) {
	if (status) {
		lightOn = true;
	}
}

function sendDataToDB(service, str, type) {
	if (typeof str=="undefined") return;
	if (isShowDB) {
		console.log ("str---> "+str);
		console.log ("sendDataToDB->\t"+nodeid+"\t"+service+"\t"+str+"\t"+type+"\n");

		if ((typeof str=="String") && str.indexOf("Receive")==-1) {
			console.log ("sendDataToDB->\t"+nodeid+"\t"+service+"\t"+str+"\t"+type+"\n");
		}
	}
        request(
                { method: "POST"
                        , uri: 'http://'+dbHost+'/'+service
                        , json: {nodeid: nodeid, value: str, type: type}
                }
                , function (error, response, body) {
/*
                        if(response.statusCode == 201){
                                console.log('document saved as: http://mikeal.iriscouch.com/testjs/'+ rand)
                        } else {
//                                console.log('error Fetch sensorValue: '+ response.statusCode)
//                                console.log(body)
                        }
*/
                }
	);
}

serialPort.on("open", function () {
  serialPort.on('data', function(data) {
	serialData.push (data);

	isSerialData = false;

	var i=0;
	var nowData = serialData[serialCount];


	for (i=0;i<nowData.length;i++) {
		if (data[i]==13) continue;
 		if (data[i]==10) {
//			str="";
			var request = require('request');
			var rand = Math.floor(Math.random()*100000000).toString();
		
//			console.log ('powerCount:\t'+powerCount);

			if (str.indexOf("Arduino")!=-1) {
				if (isDebug) {
					console.log ('<---------- \t'+str);
				}
			} else {
				if (isDebug) {
					console.log ("Serial Ar-> \t"+str);
				}

			}


			if (str.indexOf("Humidity")!=-1) {
				var nowStr = new Date().toISOString().replace(/T/, ' ').replace(/\..+/, '');
				DHT22Str = nowStr+"\t"+str;

				sendDataToDB('MCUSensorValueController', str, 'DHT22Temperature');
			}

			if (str.indexOf("CO2")!=-1) {
				var nowStr = new Date().toISOString().replace(/T/, ' ').replace(/\..+/, '');
				CO2Str = nowStr+"\t"+str;

				sendDataToDB('MCUSensorValueController', str, 'CO2');
			}


			if (str.indexOf("DS18B20Temperature")!=-1) {
				var nowStr = new Date().toISOString().replace(/T/, ' ').replace(/\..+/, '');
				DS18B20Temperature = nowStr+"\t"+str;

				sendDataToDB('MCUSensorValueController', str, 'DS18B20');
			}

			if (str.indexOf("PMAT")!=-1) {
				var nowStr = new Date().toISOString().replace(/T/, ' ').replace(/\..+/, '');
				PMATStr = nowStr+"\t"+str;
				console.log ("PMATStr: "+PMATStr);
				showLog (PMATStr, "debug");

//				var PMCF010XStr = PMATStr.split("\t")[2];

				PMCF010Str = PMATStr.split("\t")[2].split(" ")[1];
				PMCF025Str = PMATStr.split("\t")[3].split(" ")[1];
				PMCF100Str = PMATStr.split("\t")[4].split(" ")[1];
				PMAT010Str = PMATStr.split("\t")[5].split(" ")[1];
				PMAT025Str = PMATStr.split("\t")[6].split(" ")[1];
				PMAT100Str = PMATStr.split("\t")[7].split(" ")[1];
/*
				console.log ("PMCF010: "+PMCF010Str);
				console.log ("PMCF025: "+PMCF025Str);
				console.log ("PMCF100: "+PMCF100Str);
				console.log ("PMAT010: "+PMAT010Str);
				console.log ("PMAT025: "+PMAT025Str);
				console.log ("PMAT100: "+PMAT100Str);
*/
				sendDataToDB('MCUSensorValueController', str, 'PMCF010');
			}

			if (str.indexOf("Light")!=-1) {
				var nowStr = new Date().toISOString().replace(/T/, ' ').replace(/\..+/, '');
				LightSensorStr = nowStr + "\t"+ str;

				showLog (LightSensorStr, "debug");

				var light = str.split(" ")[1];
				var inverseLight = 1024 - parseInt(light);
				showLog ("insverseLight: "+inverseLight, "debug");

				if (parseInt(light) < 500) {
					lightOn = false;
				} else {
					lightOn = true;
				}
				sendDataToDB('MCUSensorValueController', str, 'Light');
			}


			if (str.indexOf("PHSensor")!=-1) {
				var nowStr = new Date().toISOString().replace(/T/, ' ').replace(/\..+/, '');
				PHSensorStr = nowStr+"\t"+str;
				showLog ("phCount:\t"+phCount+"\t"+totalPH+"\t"+phValue+"\t"+averagePH, "debug");

				console.log ("phCount:\t"+phCount+"\t"+totalPH+"\t"+phValue+"\t"+averagePH);
				phValue = str.split(" ")[1];

				if (phCount>10) {
					averagePH = 0;
					totalPH = 0;
					phCount=1;
				} else {
					console.log ("phValue:"+phValue);
					if (phValue!="Receive") {
						totalPH = totalPH + parseInt(phValue);
						averagePH = totalPH / phCount;
//						movingAverage(averagePH);
						movingAverage(phValue);


						if (phSet=="PH7") ph7 = averagePH;
						if (phSet=="PH4") ph4 = averagePH;

						var ph7_4 = parseInt(ph4)-parseInt(ph7);
						var scale_7_4 = parseInt(ph7_4) / 3;
						nowPH = 0;

						console.log ("ph7_4: "+ph7+"\t"+ph4+"\t"+ph7_4);
						
						console.log ("scale_7_4: "+scale_7_4);

						averagePH = moveMean;
						if (averagePH > ph7) {
//							console.log ("averagePH > pH7");
							nowPH = (averagePH - ph7)/scale_7_4;
//							console.log ("nowPH:"+nowPH);
							nowPH = 7 - nowPH;
//							console.log ("7-nowPH:"+nowPH);
						}
						if (averagePH < ph7) {
//							console.log ("averagePH < pH7");

							nowPH = (ph7 - averagePH)/scale_7_4;
//							console.log ("nowPH:"+nowPH);

							nowPH = 7 + nowPH;
//							console.log ("7+nowPH:"+nowPH);

						}
						if (averagePH > ph4) {
							nowPH = (averagePH - ph4)/scale_7_4;
							nowPH = 4 - nowPH;
						}
						console.log ("\n------> phCount:\t"+phCount+"\t"+totalPH+"\t"+phValue+"\t"+Number(averagePH).toFixed(2)+"\t"+Number(ph7).toFixed(2)+"\t"+Number(ph4).toFixed(2)+"\t"+Number(nowPH).toFixed(2));

						sendDataToDB('MCUSensorValueController', 'PHValue: '+phValue, 'PHValue');
						sendDataToDB('MCUSensorValueController', 'nowPH: '+nowPH, 'nowPH');

//						console.log ('sendDataToDB=====> '+phSet+' =====>\t'+str+"!!!!!");


						
						phCount++;
					}
				}
					

				if (averagePH > 900) {
					motorOn = true;
				}
				if (averagePH < 800) {
					motorOn = false;
				}
				// if phSet is not PH7 or PH4, then calculate nowPH;
			}
/*
		// éthis is old PHSection , can be deleted.
			if (str.indexOf("PHSensor")!=-1) {
				var nowStr = new Date().toISOString().replace(/T/, ' ').replace(/\..+/, '');
				PHSensorStr = nowStr+"\t"+str;
				showLog ("phCount:\t"+phCount+"\t"+totalPH+"\t"+phValue+"\t"+averagePH, "debug");

				var phValue = str.split(" ")[1];

				if (phCount>10) {
					averagePH = 0;
					totalPH = 0;
					phCount=1;
				} else {
					if (phValue!="Receive") {
						totalPH = totalPH + parseInt(phValue);
						averagePH = totalPH / phCount;

//						console.log ("\n------> phCount:\t"+phCount+"\t"+totalPH+"\t"+phValue+"\t"+averagePH+"\n");
						phCount++;
					}
				}
					

				if (averagePH > 900) {
					motorOn = true;
				}
				if (averagePH < 800) {
					motorOn = false;
				}
//				sendDataToDB('MCUSensorValueController', str, 'PH');

			}
*/
			serialRealData.push (str);

                        str="";
//			sensorCount++;

		} else {
			str = str+String.fromCharCode(nowData[i]);
		}


	}
/*
        serialRealData.forEach (function (data, index) {
                console.log ("serialRealData is: "+index+"\t"+data);
        });
*/
	serialCount++;

	if (sensorCount>1200) {
		// I will send a close flag to server for logging the job in sucess ending. 
		// Now I have not send the flag yet.
		console.log ("******************* Arduino_DHT22.js is End **************");
		process.exit(1);
	}
	isSerialData = true;
	//    myApp.emit('heartrate','', data); // upload to MCS
  });
});

var N = 10;
var MeanSize = 10;
var MovingMeanSize = 10;
var FinalMovingMeanSize = 10;

var rawData = [];
var meanData= [];
var movingCount=0;
var moveMeanData = [];
var FinalMovingMeanData = [];

var phMean = 0;
var phMoveMean = 0;
var moveMean=0;
var finalMoveMean = 0;

var meanDataCount=0;
var moveMeanDataCount=0;
var finalMovingMeanDataCount = 0;

function movingAverage(data) {
	console.log ("movingAverage: "+movingCount+"\t"+data);
	rawData[movingCount%N] = data;

	console.log ("rawData.length: "+movingCount%N+"\t"+rawData.length);
	console.log (rawData);
	
	var mean = 0;
	var total= 0;


	if (rawData.length<N-1) {
		movingCount++;
		return;
	} else {
		movingCount++;
	}

	for (var i = 0; i < rawData.length; i++) {
		var nowValue = parseInt(rawData[i]);
		total = total + nowValue;
//		console.log ("total: "+total+"\trawData["+i+"][1]="+rawData[i][1]);
	}

	mean = total / rawData.length;
	phMean = mean;
	meanData[meanDataCount % MeanSize] = mean;

	console.log ("meanData.length: "+meanDataCount%MeanSize+"\t"+meanData.length+"\t"+meanDataCount);
	console.log (meanData);
	if (meanData.length<MeanSize-1) {
		meanDataCount++;
		return;
	} else {
		meanDataCount++;
	}


	moveMean = 0;

	total= 0;
	for (var i = 0; i < meanData.length; i++) {
		var nowValue = meanData[i];
		total = total + nowValue;
//		console.log ("total: "+total+"\trawData["+i+"][1]="+rawData[i][1]);
	}
	moveMean = total / meanData.length;

	moveMeanData[moveMeanDataCount % MovingMeanSize] = moveMean;
	console.log ("moveMeanData.length:"+moveMeanDataCount % MovingMeanSize+"\t"+moveMeanData.length+"\t"+moveMeanDataCount);
	console.log ("moveMeanData: "+moveMeanData);

	if (moveMeanData.length<MovingMeanSize-1) {
		moveMeanDataCount++;
		return;
	} else {
		moveMeanDataCount++;
	}


	total = 0;
	for (var i = 0; i < moveMeanData.length; i++) {
		var nowValue = moveMeanData[i];
		total = total + nowValue;
//		console.log ("total: "+total+"\trawData["+i+"][1]="+rawData[i][1]);
	}

	phMoveMean = total / moveMeanData.length;

	FinalMovingMeanData[finalMovingMeanDataCount % FinalMovingMeanSize] = phMoveMean;

	console.log ("FinalMovingMeanData.length:"+finalMovingMeanDataCount % FinalMovingMeanSize+"\t"+FinalMovingMeanData.length+"\t"+finalMovingMeanDataCount);
	console.log (FinalMovingMeanData);

	if (FinalMovingMeanData.length < FinalMovingMeanSize - 1) {
		finalMovingMeanDataCount++;
		return;
	} else {
		finalMovingMeanDataCount++;
	}


	if ((phMoveMean>2) && (phMoveMean<12)) {
//		sendDataToDB ('MCUSensorValueController', 'phMoveMean: '+phMoveMean, 'phMoveMean');
	}

	if ((phMoveMean>2) && (phMoveMean<12)) {
		total = 0;
		for (var i = 0; i < FinalMovingMeanData.length; i++) {
			var nowValue = FinalMovingMeanData[i];
			total = total + nowValue;
	//		console.log ("total: "+total+"\trawData["+i+"][1]="+rawData[i][1]);
		}

		finalMoveMean = total / FinalMovingMeanData.length;

//		sendDataToDB ('MCUSensorValueController', 'phFinalMoveMean: '+finalMoveMean, 'phFinalMoveMean');

		sendDataToDB ('MCUSensorValueController', 'phMoveMean: '+finalMoveMean, 'phMoveMean');
	}
	

}

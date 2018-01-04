var m = require('mraa');

var myLed1 = new m.Gpio(19);
var myLed2 = new m.Gpio(18);
var myLed3 = new m.Gpio(43);
var myLed4 = new m.Gpio(20);
var https = require('https');
var http = require('http');
/*
var timerjson = "";
var url2 = "";
var gastimerurl = "https://script.google.com/macros/s/AKfycbxJP9hdckSwtXlC67csDOW-p-BdU1sRk7TZcLGmcYqjgT0F12XH/exec";
var gassensorurl = "https://script.google.com/macros/s/AKfycbzGVIYncI7zEhyfSejVZUh3MizJOVmemjjj_JABmvaDiNzHRSQ/exec";

var now = new Date();

var sensordata = "";

var SerialPort = require("serialport").SerialPort;
var serialPort = new SerialPort("/dev/ttyS0", {
    baudrate: 57600
});
*/
/*
serialPort.on("open", function () {
  serialPort.on('data', function(data) {
    // console.log(data.toString());

    tmpurl = gassensorurl + data.toString();

    https.get(tmpurl, function(res)  {
      res.on('data', function(d) {
        sensordata = data.toString();

        sensorpost();
        // process.stdout.write(d);
      });
    }).on('error', function(e) {
      // console.error(e);
      process.exit(1);
    });
  });
});

*/
function powerQueryGet() {
  var tt = {};
  tt.nodeid = [];

  var t1 = {};
  t1.nodeid = "N1";

  var options = {
    hostname: '192.168.1.200',
    port: 80,
    path: '/MCUPowerQueryController',
    method: 'POST',
    headers: {
        'Content-Type': 'application/json',
    }

  };

  var req = http.request(options, function(res) {
    res.setEncoding('utf8');

    res.on('data', function (body) {
	console.log(body);
    	powerjson = body;
//	console.log(powerjson)

    var obj = JSON.parse(powerjson);

    var devicePowerList = obj.devicePowerList;
//    console.log (devicePowerList);     

//    if (obj.devicePowerList

    for (var key in devicePowerList) {

	var nowDev = devicePowerList[key];
	var npin   = nowDev.npin;
	var pstate = nowDev.pstate;
	var devid  = nowDev.devid;

//	console.log (nowDev);

	console.log (nowDev.npin);
	console.log (nowDev.devid);
	console.log (nowDev.pstate);

	if ( devid=='Dev1' && pstate == '1' ) {
	 	myLed1.dir (m.DIR_OUT_HIGH);
		myLed1.write(1);
		console.log ("Dev1 && pstate->1");
	}

	if ( devid=='Dev1' && pstate == '0' ) {
		myLed1.dir(m.DIR_OUT_LOW);
		myLed1.write(0);
		console.log ("Dev1 && pstate->0");
	}

	if ( devid=='Dev2' && pstate == '1' ) {
	 	myLed2.dir (m.DIR_OUT_HIGH);
		myLed2.write(1);
		console.log ("Dev2 && pstate->1");
	}

	if ( devid=='Dev2' && pstate == '0' ) {
	 	myLed2.dir (m.DIR_OUT_LOW);
		myLed2.write(0);
		console.log ("Dev2 && pstate->0");
	}

	if ( devid=='Dev3' && pstate == '1' ) {
	 	myLed3.dir (m.DIR_OUT_HIGH);
		myLed3.write(1);
		console.log ("Dev3 && pstate->1");
	}

	if ( devid=='Dev3' && pstate == '0' ) {
	 	myLed3.dir (m.DIR_OUT_LOW);
		myLed3.write(0);
		console.log ("Dev3 && pstate->0");
	}

	if ( devid=='Dev4' && pstate == '1' ) {
	 	myLed4.dir (m.DIR_OUT_HIGH);
		myLed4.write(1);
		console.log ("Dev4 && pstate->1");
	}

	if ( devid=='Dev4' && pstate == '0' ) {
	 	myLed4.dir (m.DIR_OUT_LOW);
		myLed4.write(0);
		console.log ("Dev4 && pstate->0");
	}



//	console.log (devicePowerList[key]);
//	console.log (key.npin);
    }
//    req.write(JSON.stringify(t1));
//    console.log (JSON.stringify(t1));
//    req.end(); 

    if (obj.light18==1) {
//    serialPort.write("light1off")
    }

    if (obj.light18==0) {
//    serialPort.write("light1on")
	myLed1.dir(m.DIR_OUT_LOW);
	myLed1.write(0);
    }

    if (obj.light19==1) {
//    serialPort.write("light1off")
	myLed2.dir(m.DIR_OUT_HIGH);
	myLed2.write(1);
    }

    if (obj.light19==0) {
//    serialPort.write("light1on")
	myLed2.dir(m.DIR_OUT_LOW);
	myLed2.write(0);
    }

    if (obj.light2==0) {
//    serialPort.write("light2off")
    }

    if (obj.light2==1) {
//    serialPort.write("light2on")
    }

    if (obj.light3==0) {

    }

    if (obj.light3==1) {

    }

    if (obj.light4==0) {

    }

    if (obj.light4==1) {

    }

    if (obj.light5==0) {

    }

    if (obj.light5==1) {

    }

    if (obj.light6==0) {

    }

    if (obj.light6==1) {

    }

    if (obj.light7==0) {

    }

    if (obj.light7==1) {

    }

    if (obj.light8==0) {

    }

    if (obj.light8==1) {

    }

    });
//    setInterval(powerQueryGet, 5000);
  });

  req.on('error', function(e) {
    console.log(e);
  });

  req.write(JSON.stringify(t1));
  req.end();

}

powerQueryGet();

//periodicActivity2();

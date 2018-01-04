const SerialPort = require("serialport");
const serialPort = new SerialPort("/dev/ttyS0", {
  baudrate: 57600
});

var str = "";

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
      if (count%10==0) {
        console.log (str);
      }    
          
      str = "";
    }

/*    if (temp.indexOf("x")!=-1) {
      console.log (str);
      str = "";
    }*/
    /*
    for (int count=0;count<temp.length;count++) {
      if (temp[i]!='x') {
        
      }
    }*/
//	serialData.push (data);
  });
});

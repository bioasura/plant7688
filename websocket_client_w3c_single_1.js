var W3CWebSocket = require('websocket').w3cwebsocket;
var client1 = new W3CWebSocket('ws://192.168.43.58:1337/');

client1.onerror=onerror;
var onerror = function() {
    console.log('Connection Error');
};
var action=0;
var npin=14;
var pstate=0;

client1.onopen = function() {
    console.log('WebSocket Client Connected');
    function sendNumber() {
        if (this.readyState === this.OPEN) {
            var number = Math.round(Math.random() * 0xFFFFFF);
            try {
                
                var jsonTest = {client:'123',action:action%4,pstate:"0,0,0,0,1,1,1,1,", npin: "2,3,4,5,14,15,16,17,"};
                npin++;
                if  (npin>17) {
                    npin=13;
                    if (pstate==0) {
                        pstate=1;
                    } else {
                        pstate=0;
                    }
                }
                client1.send(JSON.stringify(jsonTest));
                action++;
            } catch (e) {
                console.log (e);
                client1 = new W3CWebSocket('ws://192.168.43.58:1337/');
            }
            setTimeout(sendNumber, 2000);
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
        var npin='';
        var PH7='';
        try {
            npin = JSON.parse(e.data).npin;
            PH7  = JSON.parse(e.data).PH7;
        } catch (e) {
            console.log (e);
        }
        
        console.log ('npin:'+npin);
        console.log ('PH7:'+PH7);
        var token = e.data.split("\t");
        token.forEach( (data, index) => {
//            console.log (index+"\t"+data);
        });
    }
};

const { Client } = require('pg')

var W3CWebSocket = require('websocket').w3cwebsocket;
var wsHost = "192.168.43.65";
var client1 = new W3CWebSocket('ws://'+wsHost+':1337/');

client1.onerror=onerror;
var onerror = function() {
    console.log('Connection Error');
};
var action=0;
var npin=14;
var pstate=0;

var npins=[2,3,4,5,14,15,16,17,30];
var npinCount=0;
var Saction="setPower";
//------------------------------------------------

var stdin = process.stdin;

// without this, we would only get streams once enter is pressed
stdin.setRawMode( true );

// resume stdin in the parent process (node app won't quit all by itself
// unless an error or process.exit() happens)
stdin.resume();

// i don't want binary, do you?
stdin.setEncoding( 'utf8' );

// on any data into stdin
stdin.on( 'data', function( key ){
  // ctrl-c ( end of text )
  if ( key === '\u0003' ) {
    process.exit();
  }
  // write the key to stdout all normal like
  process.stdout.write( key );
//  npin="5,6,7,8,9,10"; 
  
  if (key=='A'||key=='a') {
      npin="4,5,";
      pstate ="1,0"; 
  }
  if (key=='D'||key=='d') {
      npin="4,5";
      pstate ="0,1"; 
  }
  if (key=='S'||key=='s') {
      npin="7,8,9,10";
      pstate ="0,1,0,1"; 
  }
  if (key=='W'||key=='w') {
      npin="7,8,9,10";
      pstate ="1,0,1,0";
  }

  if (key=='X'||key=='x') {
      npin="4,5,6,7,8,9,10";
      pstate ="0,0,0,0,0,0,0";
  }
  
  var jsonTest = {client:'123',action:Saction,pstate: pstate+",", npin: npin+","};
  client1.send(JSON.stringify(jsonTest));
  
});
//-------------------------------------------

client1.onopen = function() {
    console.log('WebSocket Client Connected');
    function sendNumber() {
        if (this.readyState === this.OPEN) {
            var number = Math.round(Math.random() * 0xFFFFFF);
            try {
                
                if ((npinCount+1)%9==0) {
                    console.log ("===========> localSend getDHT22 ");
                    Saction="getDHT22";
                } else{
                    Saction="setPower";
                }
/*
                if ((npinCount+1)%3==1) {
                    console.log ("===========> localSend getPMS5003 ");
                    Saction="getPMS5003";
                }
                if ((npinCount+1)%3==2) {
                    console.log ("===========> localSend getSHT31 ");
                    Saction="getSHT31";
                }
  */              
                if  (npinCount>9) {
                    npinCount=0;
                    if (pstate==0) {
                        pstate=1;
                    } else {
                        pstate=0;
                    }
                }
                
                npin=npins[npinCount];
                npin="7,8,9,10,2,3,4,5,14,15,16,17";

//                npin="7,8,9,10";
                if (npinCount%2==0) {
                    pstate="1,0,1,0,0,0,0,0,0,0,0,0,0,";
//                    pstate="1,0,1,0";
                }else{
                    pstate="0,1,0,1,1,1,1,1,1,1,1,1,1,";
//                    pstate="0,1,0,1";
                }
                
                npinCount++;
                action++;
                var jsonTest = {client:'123',action:Saction,pstate: pstate+",", npin: npin+","};
                client1.send(JSON.stringify(jsonTest));
            } catch (e) {
                console.log (e);
                client1 = new W3CWebSocket('ws://'+wsHost+':1337/');
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

const client = new Client({
  user: 'postgres',
  host: 'localhost',
  database: 'knu',
  password: '',
  port: 5432
});

client.connect();
  
// callback

client1.onmessage = function(e) {
    if (typeof e.data === 'string') {
//        console.log("Received: '" + e.data + "'");
        
        var json = JSON.parse(e.data);
//        console.log (json);

        json.forEach( function(key) {
          console.log (key.address+"\t"+key.quality+"\t"+key.essid+"\t"+key.mode+"\t"+key.encryption);

          var query = {
            text: 'INSERT INTO mt7688_signal (station, address, quality, essid, mode, encryption, dtime) VALUES ($1, $2, $3, $4, $5, $6, CURRENT_TIMESTAMP)',
            values: [process.argv[2], key.address, key.quality, key.essid, key.mode, key.encryption],
          }
          client.query(query, (err, res) => {
            if (err) {
              console.log("error:"+err.stack);
              process.exit(0);
            } else {
//              console.log("result:"+JSON.stringify(res));
            }
          })
        });


        
    }
}


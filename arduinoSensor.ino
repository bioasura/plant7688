
String powerCMD = "";

int count=0;
// the setup function runs once when you press reset or power the board
void setup() {
  // initialize digital pin LED_BUILTIN as an output.
  pinMode(LED_BUILTIN, OUTPUT);

//  SSerial.begin(9600);
  Serial.begin(9600); // open serial connection to USB Serial port (connected to your computer)
  Serial1.begin(9600); // open internal serial connection to MT7688

  pinMode(13, OUTPUT);
  pinMode(21, INPUT);
  //  pinMode(14, INPUT);
  //  digitalWrite (14,1);


  pinMode(2, OUTPUT);
  pinMode(3, OUTPUT);
  pinMode(4, OUTPUT);
  pinMode(5, OUTPUT);
  pinMode(6, OUTPUT);
  pinMode(8, OUTPUT);
  pinMode(14, OUTPUT);
  pinMode(15, OUTPUT);
  pinMode(16, OUTPUT);
  pinMode(17, OUTPUT);
  
//  pinMode(16, INPUT);//
//  pinMode(18, OUTPUT);

  pinMode(17, OUTPUT);
  pinMode(20, OUTPUT);
  pinMode(22, INPUT);
  pinMode(23, INPUT); 
}

// the loop function runs over and over again forever
void loop() {
/*
  digitalWrite(LED_BUILTIN, HIGH);   // turn the LED on (HIGH is the voltage level)
  delay(100);                       // wait for a second
  digitalWrite(LED_BUILTIN, LOW);    // turn the LED off by making the voltage LOW
  delay(100);                       // wait for a second
  */
//  Serial1.println ("This is a test: "+(String)count+"x");
//  Serial1.println ("Command "+(String)count+"x");
//  Serial1.println ();

  getCommand();
//  if (count%10==0){
//    Serial.println ("Command: "+(String)count);
//  }
  count++;
//  delay(100);
}

void getCommand() {
  int count=0;
  int c = Serial1.read();

  if ((c == 10) || (c == 13)) {
    powerCMD.trim();
//    Serial1.println ("Arduino Receive CMD:\t" + powerCMD);
    Serial.println (powerCMD + "\t" + count);

    String devid = getValue(powerCMD, '\t', 0);
    String pstate = getValue(powerCMD, '\t', 1);
    String npin  = getValue(powerCMD, '\t', 2);
    powerCMD = "";

    devid.trim();
    String sensors = getValue(powerCMD, '\t', 0);
    Serial.println ("devid:"+devid);
    Serial.println ("pstate:"+pstate);
    Serial.println ("npin:"+npin);
    if (devid == "setPower") {
      setPower(pstate, npin);
    }
  }
  
  if (c != -1) {
    powerCMD = powerCMD + (char)c;
  }
}

void setPower(String pstate, String npin) {
//    Serial1.println ("Arduino receive setPower:\t"+pstate+"\t"+npin+"x");
    int common=0;
    int count=0;
    while (count<npin.length()) {
      if (npin.charAt(count)==',') {
        common++;
      }
      count++;
    }
    Serial.println ("setPower common:"+common);

    
    Serial.println ("setPower common:\t"+(String)common+"\tXXXX");
//    Serial1.println ();
    
    int i=0;
    for (i=0;i<common;i++) {
      String npinC = getValue(npin, ',', i);
      String pstateC=getValue(pstate,',',i);
      Serial.println ("!!!!!!!!!!!!!!!!!!!! set nPin: "+npinC+"\tpstateC: "+pstateC);

      int npinX = npinC.toInt();
      int pstateX=pstateC.toInt();
      Serial.println ("npinX:"+(String)npinX);
      Serial.println ("pstateX:"+(String)pstateX);
      
      pinMode (npinX, OUTPUT);
//      digitalWrite (npinX, pstateX);
      digitalWrite (npinX, pstateX);
    }
    /*
    int npinC = npin.toInt();
    int pstateC = pstate.toInt();

    pinMode (npinC, OUTPUT);
    digitalWrite (npinC, pstateC);
*/
    delay(100);
    
}

String getValue(String data, char separator, int index)
{
  int found = 0;
  int strIndex[] = {0, -1};
  int maxIndex = data.length() - 1;

  for (int i = 0; i <= maxIndex && found <= index; i++) {
    if (data.charAt(i) == separator || i == maxIndex) {
      found++;
      strIndex[0] = strIndex[1] + 1;
      strIndex[1] = (i == maxIndex) ? i + 1 : i;
    }
  }

  return found > index ? data.substring(strIndex[0], strIndex[1]) : "";
}

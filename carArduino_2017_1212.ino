#include <Digital_Light_ISL29035.h>
#include <Digital_Light_TSL2561.h>
#include <SoftwareSerial.h>
#include <Wire.h>
#include <Arduino.h>
#include "SHT31.h"

SHT31 sht31 = SHT31();
SoftwareSerial SSerial(11,12);

//const int PinEN = 12;
//const int PinOUT = 11;
//const int PinEN = 12;
//const int PinOUT = 11;
int enabled = 0;  //sensor detection flag
int current_state = 0;
int state = 0;    //momentary state value
int count = 0;    //state change count
int countxx=0;
long currentMilli = 0;
int trigPin = 12;                  //Trig Pin
int echoPin = 11;                  //Echo Pin
long duration, cm, inches;

long pmcf10 = 0;
long pmcf25 = 0;
long pmcf100 = 0;
long pmat10 = 0;
long pmat25 = 0;
long pmat100 = 0;
String fpmcf010;
String fpmcf025;
String fpmcf100;
String fpmat010;
String fpmat025;
String fpmat100;
String powerCMD = "";

// the setup function runs once when you press reset or power the board
void setup() {
  
//   enable();
//  currentMilli = millis();

  SSerial.begin(9600);
  Serial.begin(9600);
  Serial1.begin(9600);

  Wire.begin();
  TSL2561.init();
  sht31.begin();

/*
  pinMode(13, OUTPUT);
  pinMode(21, INPUT);
  pinMode(6,OUTPUT);
  pinMode(trigPin, OUTPUT);        //Define inputs and outputs 
  pinMode(echoPin, INPUT);
  pinMode(17, OUTPUT);
  pinMode(20, OUTPUT);
  */
  delay(100);
}

void getUltraSound() {
  digitalWrite(trigPin, LOW);
  delayMicroseconds(5);
  digitalWrite(trigPin, HIGH);     // 蝯� Trig 擃雿���� 10敺桃��
  delayMicroseconds(10);
  digitalWrite(trigPin, LOW);

  pinMode(echoPin, INPUT);             // 霈���� echo ��雿�
  duration = pulseIn(echoPin, HIGH);   // ��擃雿�����
  cm = (duration/2) / 29.1;         // 撠������ cm ��� inch  
  inches = (duration/2) / 74; 

  Serial.print("Distance : ");  
  Serial.print(inches);
  Serial.print("in,   ");
  Serial.print(cm);
  Serial.print("cm");
  Serial.println();

  Serial1.print("Distance : ");  
  Serial1.print(inches);
  Serial1.print("in,   ");
  Serial1.print(cm);
  Serial1.print("cm");
  Serial1.println();
    
  delay(250);
  
}

// the loop function runs over and over again forever
void loop() {
 // digitalWrite(6,HIGH);
  getPMS5003();

/*   if(digitalRead(PinOUT) != current_state)
 {
   count++;
   delay(1);
   current_state = -(current_state - 1);  //changes current_state from 0 to 1, and vice-versa
 }

 */
/*
 if(millis()-currentMilli > 500)          //prints the "speed" every half a second
 {
   print_speed();
 }
 */
/*
  digitalWrite(2,HIGH);
  digitalWrite(3,LOW);
  digitalWrite(4,HIGH);
  digitalWrite(5,LOW);
*/

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
  countxx++;
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

    if (devid == "getPMS5003") {
      Serial1.println ("PM "+fpmcf010 + " " + fpmcf025 + " "+fpmcf100+" x");

/*
        Serial.println ("PMCF010: " + fpmcf010 + " PMCF025: " + fpmcf025 + " PMCF100: "  + fpmcf100 + " PMAT010: " + fpmat010 + " PMAT025: " + fpmat025 + " PMAT100: " + fpmat100+" x");
        Serial.flush();
        Serial1.println ("PMCF010: " + fpmcf010 + " PMCF025: " + fpmcf025 + " PMCF100: " + fpmcf100 + " PMAT010: " + fpmat010 + " PMAT025: " + fpmat025 + " PMAT100: " + fpmat100+" x");
        Serial1.flush();
        */
    }
    
    if (devid == "getSHT31") {
       getSHT31();
    }   
    if (devid == "getLight") {
       getLight();
    }   
    if (devid == "getUltraSound") {
       getUltraSound();
    }   
  }
  
  if (c != -1) {
    powerCMD = powerCMD + (char)c;
  }
}

void setPower(String pstate, String npin) {
//    Serial1.println ("Arduino receive setPower:\t"+pstate+"\t"+npin+"x");
    int common=0;
    int countxx=0;
    while (countxx<npin.length()) {
      if (npin.charAt(count)==',') {
        common++;
      }
      countxx++;
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
//      delay(1000);
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

void getPMS5003() {
  SSerial.begin(9600);
  delay(100);
  
  unsigned char cs;
  unsigned char high;
  
  while (SSerial.available()) {
    cs = SSerial.read();

    if ((countxx == 0 && cs != 0x42) || (countxx == 1 && cs != 0x4d)) {
      Serial.println("check failed");
      break;
    }
    if (countxx > 15) {
     break;
    }  
    else if (countxx == 4 || countxx == 6 || countxx == 8 || countxx == 10 || countxx == 12 || countxx == 14) high = cs;
    else if (countxx == 5) {
      pmcf10 = 256 * high + cs;
    }
    else if (countxx == 7) {
      pmcf25 = 256 * high + cs;
    }
    else if (countxx == 9) {
      pmcf100 = 256 * high + cs;
    }
    else if (countxx == 11) {
      pmat10 = 256 * high + cs;
    }
    else if (countxx == 13) {
      pmat25 = 256 * high + cs;
    }
    else if (countxx == 15) {
      pmat100 = 256 * high + cs;
    }
    countxx++;
  }
  
  fpmcf010 = String(pmcf10);
  fpmcf025 = String(pmcf25);
  fpmcf100 = String(pmcf100);
  fpmat010 = String(pmat10);
  fpmat025 = String(pmat25);
  fpmat100 = String(pmat100);
 
//  Serial.println ("\tPMCF010: " + fpmcf010 + " PMCF025: " + fpmcf025 + " PMCF100: " + fpmcf100 + " PMAT010: " + fpmat010 + " PMAT025: " + fpmat025 + " PMAT100: " + fpmat100);
//  Serial.flush();
//  if (countxx%10==0) {
//        Serial1.println ("PMCF010 " + fpmcf010 + " PMCF025 " + fpmcf025 + " PMCF100 " + fpmcf100 + " PMAT010: " + fpmat010 + "  PMAT025: " + fpmat025 + " PMAT100: " + fpmat100+" x");  
//      delay(100);
//        Serial1.println ("PM "+fpmcf010 + " " + fpmcf025 + " "+fpmcf100+" x");
//    Serial1.flush();
    delay(100);
//  }
}

void getSHT31() {
  float temp = sht31.getTemperature();
  float hum = sht31.getHumidity();
  Serial.print("Temp = ");
  Serial.print(temp);
  Serial.println(" C");
  Serial.print("Hum = ");
  Serial.print(hum);
  Serial.println("%");
  Serial.println();
  delay(1000);
  
  Serial1.print("Temp = ");
  Serial1.print(temp);
  Serial1.println(" C");
  Serial1.print("Hum = ");
  Serial1.print(hum);
  Serial1.println(" %x");
//  Serial1.println();
  delay(1000);

}

void getLight() {
    Serial.print("The Light value is: ");
  Serial.println(TSL2561.readVisibleLux());  

  Serial1.print ("The Light value is: ");
  Serial1.println((String)TSL2561.readVisibleLux()+" x");
  delay(1000);
}
/*
void enable()
{
 
 //To start the sensor reading, enable pin EN (pin 9) with HIGH signal
 //To make sure it's a clean HIGH signal, give small LOW signal before
 
 pinMode(PinOUT, INPUT);
 pinMode(PinEN, OUTPUT);
 digitalWrite(PinEN,LOW);
 delayMicroseconds(5);
 digitalWrite(PinEN, HIGH);
 wait();
}

void disable()                        //function not used in this program
{
 pinMode(PinEN, OUTPUT);
 digitalWrite(PinEN, LOW);
}

void wait()                            //waits for the sensor to return a state = 1
{
 while(digitalRead(PinOUT) != 1)
 {
   digitalRead(PinOUT);
 }
 current_state = 1;
 Serial.println("Sensor enabled!");
}

void print_speed()
{
 Serial.print("Speed: ");
 Serial.print(count*2);
 Serial.println(" Changes/s");
 currentMilli = millis();
 count = 0;
}

*/

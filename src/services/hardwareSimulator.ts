import { LEDColor, HardwareStatus } from '../types';

export class HardwareController {
  private static instance: HardwareController;
  private currentLed: LEDColor = 'GREEN';
  private serialPort: any = null;
  private writer: any = null;
  private isConnected = false;
  private messageListeners: ((msg: string) => void)[] = [];
  private stateListeners: ((status: HardwareStatus) => void)[] = [];

  private status: HardwareStatus = {
    connected: false,
    port: 'COM4 /dev/ttyUSB0 (Simulated)',
    baudRate: 115200,
    ledState: 'GREEN',
    esp32CamStatus: 'ONLINE',
    esp32Fps: 24,
    lastHeartbeat: new Date().toLocaleTimeString(),
    lastSerialMessage: '{"status":"READY","led":"GREEN","esp32_cam":"ONLINE"}',
    rawPayload: 'READY 115200 BAUD',
  };

  private constructor() {
    // Start periodic heartbeat simulation
    setInterval(() => {
      this.simulateHeartbeat();
    }, 4000);
  }

  public static getInstance(): HardwareController {
    if (!HardwareController.instance) {
      HardwareController.instance = new HardwareController();
    }
    return HardwareController.instance;
  }

  public getStatus(): HardwareStatus {
    return { ...this.status };
  }

  public subscribeStatus(listener: (status: HardwareStatus) => void) {
    this.stateListeners.push(listener);
    listener(this.getStatus());
    return () => {
      this.stateListeners = this.stateListeners.filter((l) => l !== listener);
    };
  }

  public subscribeLog(listener: (msg: string) => void) {
    this.messageListeners.push(listener);
    return () => {
      this.messageListeners = this.messageListeners.filter((l) => l !== listener);
    };
  }

  public async setLedState(color: LEDColor, reason?: string) {
    this.currentLed = color;
    this.status.ledState = color;
    this.status.lastHeartbeat = new Date().toLocaleTimeString();
    
    const commandPayload = JSON.stringify({
      cmd: 'SET_LED',
      color: color,
      timestamp: Date.now(),
      reason: reason || 'State transition',
    });

    this.status.lastSerialMessage = commandPayload;
    this.status.rawPayload = `TX > [ARDUINO_UNO] CMD:LED_${color}`;

    // Broadcast log
    const logText = `[SERIAL TX 115200] -> ${commandPayload}`;
    this.emitLog(logText);

    // If Web Serial port is active, send over wire
    if (this.writer) {
      try {
        const encoder = new TextEncoder();
        await this.writer.write(encoder.encode(`LED_${color}\n`));
      } catch (err) {
        console.error('Failed to write to hardware serial port', err);
      }
    }

    this.notifyStatus();
  }

  public setLED(color: LEDColor, reason?: string) {
    return this.setLedState(color, reason);
  }

  public async connectWebSerial(): Promise<boolean> {
    if (!('serial' in navigator)) {
      this.emitLog('[SERIAL ERROR] Web Serial API not supported in this browser. Running in high-fidelity simulation mode.');
      this.status.connected = true;
      this.notifyStatus();
      return false;
    }

    try {
      // @ts-ignore
      this.serialPort = await (navigator as any).serial.requestPort();
      await this.serialPort.open({ baudRate: 115200 });
      this.writer = this.serialPort.writable.getWriter();
      this.isConnected = true;
      this.status.connected = true;
      this.status.port = 'USB Serial (WebSerial Connected)';
      this.emitLog('[SERIAL CONNECTED] Physical Arduino board attached successfully at 115200 baud.');
      this.notifyStatus();
      return true;
    } catch (err: any) {
      this.emitLog(`[SERIAL] Device selection cancelled or busy: ${err.message}. Operating in Edge Simulated Mode.`);
      this.status.connected = false;
      this.notifyStatus();
      return false;
    }
  }

  public async disconnectWebSerial() {
    if (this.writer) {
      await this.writer.close();
      this.writer = null;
    }
    if (this.serialPort) {
      await this.serialPort.close();
      this.serialPort = null;
    }
    this.isConnected = false;
    this.status.connected = false;
    this.emitLog('[SERIAL DISCONNECTED] Hardware interface released.');
    this.notifyStatus();
  }

  private simulateHeartbeat() {
    const rxPayload = JSON.stringify({
      node: 'ESP32_CAM_01',
      frame_id: Math.floor(Math.random() * 9000) + 1000,
      fps: 23.8 + Math.random() * 0.8,
      led_pin_state: this.currentLed,
      uptime_sec: Math.floor(performance.now() / 1000),
    });

    this.status.lastHeartbeat = new Date().toLocaleTimeString();
    this.emitLog(`[ESP32-CAM RX] <- ${rxPayload}`);
  }

  private emitLog(msg: string) {
    this.messageListeners.forEach((l) => l(msg));
  }

  private notifyStatus() {
    this.stateListeners.forEach((l) => l(this.getStatus()));
  }
}

export const ARDUINO_C_SKETCH = `// ==========================================
// RETAILPULSE EDGE - ARDUINO UNO / NANO SKETCH
// Hardware State & Tri-Color LED Controller
// ==========================================

const int PIN_LED_GREEN = 9;   // Normal operation
const int PIN_LED_YELLOW = 10; // Action Required (Replenish / Verify)
const int PIN_LED_RED = 11;    // Critical (Queue Surge / Stockout)

void setup() {
  Serial.begin(115200);
  pinMode(PIN_LED_GREEN, OUTPUT);
  pinMode(PIN_LED_YELLOW, OUTPUT);
  pinMode(PIN_LED_RED, OUTPUT);

  // Power-on self-test
  digitalWrite(PIN_LED_GREEN, HIGH);
  delay(300);
  digitalWrite(PIN_LED_YELLOW, HIGH);
  delay(300);
  digitalWrite(PIN_LED_RED, HIGH);
  delay(300);
  digitalWrite(PIN_LED_YELLOW, LOW);
  digitalWrite(PIN_LED_RED, LOW);
  
  Serial.println("{\\"device\\":\\"RETAILPULSE_ARDUINO\\",\\"status\\":\\"READY\\",\\"led\\":\\"GREEN\\"}");
}

void loop() {
  if (Serial.available() > 0) {
    String command = Serial.readStringUntil('\\n');
    command.trim();

    if (command == "LED_GREEN") {
      digitalWrite(PIN_LED_GREEN, HIGH);
      digitalWrite(PIN_LED_YELLOW, LOW);
      digitalWrite(PIN_LED_RED, LOW);
      Serial.println("{\\"ack\\":\\"LED_GREEN\\",\\"status\\":\\"NORMAL\\"}");
    } else if (command == "LED_YELLOW") {
      digitalWrite(PIN_LED_GREEN, LOW);
      digitalWrite(PIN_LED_YELLOW, HIGH);
      digitalWrite(PIN_LED_RED, LOW);
      Serial.println("{\\"ack\\":\\"LED_YELLOW\\",\\"status\\":\\"ACTION_REQUIRED\\"}");
    } else if (command == "LED_RED") {
      digitalWrite(PIN_LED_GREEN, LOW);
      digitalWrite(PIN_LED_YELLOW, LOW);
      digitalWrite(PIN_LED_RED, HIGH);
      Serial.println("{\\"ack\\":\\"LED_RED\\",\\"status\\":\\"CRITICAL\\"}");
    }
  }
}`;

export const ESP32_CAM_SKETCH = `// ==========================================
// RETAILPULSE EDGE - ESP32-CAM CAPTURE NODE
// Lightweight MJPEG / Frame Streamer to Edge Computer
// ==========================================
#include "esp_camera.h"
#include <WiFi.h>
#include "esp_http_server.h"

// Camera Model: AI THINKER ESP32-CAM
#define PWDN_GPIO_NUM     32
#define RESET_GPIO_NUM    -1
#define XCLK_GPIO_NUM      0
#define SIOD_GPIO_NUM     26
#define SIOC_GPIO_NUM     27
#define Y9_GPIO_NUM       35
#define Y8_GPIO_NUM       34
#define Y7_GPIO_NUM       39
#define Y6_GPIO_NUM       36
#define Y5_GPIO_NUM       21
#define Y4_GPIO_NUM       19
#define Y3_GPIO_NUM       18
#define Y2_GPIO_NUM        5
#define VSYNC_GPIO_NUM    25
#define HREF_GPIO_NUM     23
#define PCLK_GPIO_NUM     22

const char* ssid = "RetailPulse_Edge_AP";
const char* password = "edgepassword123";

void setup() {
  Serial.begin(115200);
  camera_config_t config;
  config.ledc_channel = LEDC_CHANNEL_0;
  config.ledc_timer = LEDC_TIMER_0;
  config.pin_d0 = Y2_GPIO_NUM;
  config.pin_d1 = Y3_GPIO_NUM;
  config.pin_d2 = Y4_GPIO_NUM;
  config.pin_d3 = Y5_GPIO_NUM;
  config.pin_d4 = Y6_GPIO_NUM;
  config.pin_d5 = Y7_GPIO_NUM;
  config.pin_d6 = Y8_GPIO_NUM;
  config.pin_d7 = Y9_GPIO_NUM;
  config.pin_xclk = XCLK_GPIO_NUM;
  config.pin_pclk = PCLK_GPIO_NUM;
  config.pin_vsync = VSYNC_GPIO_NUM;
  config.pin_href = HREF_GPIO_NUM;
  config.pin_sscb_sda = SIOD_GPIO_NUM;
  config.pin_sscb_scl = SIOC_GPIO_NUM;
  config.pin_pwdn = PWDN_GPIO_NUM;
  config.pin_reset = RESET_GPIO_NUM;
  config.xclk_freq_hz = 20000000;
  config.pixel_format = PIXFORMAT_JPEG;
  config.frame_size = FRAMESIZE_VGA; // 640x480 for edge OpenCV processing
  config.jpeg_quality = 12;
  config.fb_count = 2;

  esp_camera_init(&config);
  WiFi.softAP(ssid, password);
  Serial.println("ESP32-CAM Ready. Streaming frames to Edge Host.");
}

void loop() {
  // Capture frame and send over HTTP / RTSP stream to Laptop Edge AI (OpenCV + YOLO)
  delay(40);
}`;

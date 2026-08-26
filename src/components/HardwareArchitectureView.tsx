import React, { useState } from 'react';
import { 
  Cpu, 
  Wifi, 
  Terminal, 
  Usb, 
  ShieldCheck, 
  Code, 
  Copy, 
  Check, 
  Sparkles, 
  Layers, 
  Activity, 
  Radio,
  Server
} from 'lucide-react';
import { AI_TECHNOLOGY_TABLE } from '../data/mockStoreData';
import { HardwareController } from '../services/hardwareSimulator';
import { LEDColor } from '../types';

interface HardwareArchitectureViewProps {
  ledState: LEDColor;
  onSetLED: (color: LEDColor, reason: string) => void;
  serialLogs: { timestamp: string; direction: 'TX' | 'RX'; payload: string }[];
}

export const HardwareArchitectureView: React.FC<HardwareArchitectureViewProps> = ({
  ledState,
  onSetLED,
  serialLogs,
}) => {
  const [copiedTab, setCopiedTab] = useState<'ARDUINO' | 'ESP32' | null>(null);
  const [isConnectedSerial, setIsConnectedSerial] = useState(false);
  const [activeCodeTab, setActiveCodeTab] = useState<'ARDUINO' | 'ESP32'>('ARDUINO');

  const hardwareController = HardwareController.getInstance();

  const handleConnectWebSerial = async () => {
    const success = await hardwareController.connectWebSerial();
    setIsConnectedSerial(success);
  };

  const handleCopyCode = (tab: 'ARDUINO' | 'ESP32', code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedTab(tab);
    setTimeout(() => setCopiedTab(null), 2000);
  };

  const arduinoCppCode = `// RetailPulse Edge - Arduino Uno / Nano Hardware Controller
// Listens to USB Serial at 115200 baud for JSON payloads

#include <ArduinoJson.h>

const int PIN_LED_GREEN  = 8;
const int PIN_LED_YELLOW = 9;
const int PIN_LED_RED    = 10;
const int PIN_BUZZER     = 11;

void setup() {
  Serial.begin(115200);
  pinMode(PIN_LED_GREEN, OUTPUT);
  pinMode(PIN_LED_YELLOW, OUTPUT);
  pinMode(PIN_LED_RED, OUTPUT);
  pinMode(PIN_BUZZER, OUTPUT);

  // Initial State: Green Active
  setLeds(HIGH, LOW, LOW);
  Serial.println("{\\"status\\":\\"READY\\",\\"device\\":\\"ARDUINO_UNO\\"}");
}

void loop() {
  if (Serial.available() > 0) {
    String input = Serial.readStringUntil('\\n');
    StaticJsonDocument<200> doc;
    DeserializationError error = deserializeJson(doc, input);

    if (!error) {
      const char* cmd = doc["cmd"];
      const char* color = doc["color"];

      if (strcmp(cmd, "SET_LED") == 0) {
        if (strcmp(color, "GREEN") == 0) {
          setLeds(HIGH, LOW, LOW);
        } else if (strcmp(color, "YELLOW") == 0) {
          setLeds(LOW, HIGH, LOW);
          tone(PIN_BUZZER, 1000, 100); // 100ms chirp
        } else if (strcmp(color, "RED") == 0) {
          setLeds(LOW, LOW, HIGH);
          tone(PIN_BUZZER, 2000, 400); // 400ms alert
        }
        Serial.print("{\\"ack\\":\\"OK\\",\\"color\\":\\"");
        Serial.print(color);
        Serial.println("\\"}");
      }
    }
  }
}

void setLeds(int g, int y, int r) {
  digitalWrite(PIN_LED_GREEN, g);
  digitalWrite(PIN_LED_YELLOW, y);
  digitalWrite(PIN_LED_RED, r);
}`;

  const esp32CamCppCode = `// RetailPulse Edge - ESP32-CAM ROI Capture Node
// Captures OV2640 frames & streams HTTP MJPEG to Edge Processor

#include "esp_camera.h"
#include <WiFi.h>
#include "esp_http_server.h"

#define CAMERA_MODEL_AI_THINKER
#include "camera_pins.h"

const char* ssid = "RETAIL_EDGE_WIFI";
const char* password = "edge_secure_pass";

httpd_handle_t stream_httpd = NULL;

static esp_err_t stream_handler(httpd_req_t *req) {
  camera_fb_t * fb = NULL;
  esp_err_t res = ESP_OK;
  char * part_buf[64];

  res = httpd_resp_set_type(req, "multipart/x-mixed-replace;boundary=123456789000000000000987654321");
  if(res != ESP_OK) return res;

  while(true) {
    fb = esp_camera_fb_get();
    if (!fb) {
      res = ESP_FAIL;
    } else {
      size_t hlen = snprintf((char *)part_buf, 64, "\\r\\n--123456789000000000000987654321\\r\\nContent-Type: image/jpeg\\r\\nContent-Length: %u\\r\\n\\r\\n", fb->len);
      res = httpd_resp_send_chunk(req, (const char *)part_buf, hlen);
      if(res == ESP_OK) res = httpd_resp_send_chunk(req, (const char *)fb->buf, fb->len);
      esp_camera_fb_return(fb);
      fb = NULL;
    }
    if(res != ESP_OK) break;
  }
  return res;
}

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
  config.frame_size = FRAMESIZE_VGA;
  config.jpeg_quality = 12;
  config.fb_count = 2;

  esp_camera_init(&config);
  WiFi.begin(ssid, password);
  while (WiFi.status() != WL_CONNECTED) delay(500);
  Serial.print("Camera Stream Ready at: http://");
  Serial.println(WiFi.localIP());
}

void loop() { delay(10000); }`;

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
        <div>
          <div className="flex items-center space-x-2">
            <span className="w-2 h-2 rounded-full bg-blue-600" />
            <h2 className="text-xs font-bold text-slate-900 uppercase tracking-widest">
              Hardware &amp; Edge IoT Architecture
            </h2>
          </div>
          <p className="text-xs text-slate-500 font-medium mt-0.5">
            ESP32-CAM Video Capture • Arduino Physical LED / Buzzer Signaling • Edge Computer Host
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={handleConnectWebSerial}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-md text-xs font-bold uppercase tracking-wider border transition-all cursor-pointer shadow-xs ${
              isConnectedSerial
                ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200'
            }`}
          >
            <Usb className="w-3.5 h-3.5 text-blue-600" />
            <span>{isConnectedSerial ? 'Arduino Connected (USB)' : 'Connect Physical Arduino (Web Serial)'}</span>
          </button>
        </div>
      </div>

      {/* Hardware Architecture Diagram (3-Tier Block) */}
      <div className="bg-slate-900 text-white p-5 rounded-xl border border-slate-800 shadow-xs">
        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4 flex items-center space-x-1.5">
          <Layers className="w-4 h-4 text-blue-400" />
          <span>Complete Edge AI + Hardware Pipeline</span>
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-3 text-xs">
          {/* Block 1: Camera Node */}
          <div className="bg-slate-800/90 p-3.5 rounded-lg border border-slate-700 space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-bold text-blue-400 uppercase tracking-wider text-[11px]">1. Data Capture</span>
              <Wifi className="w-3.5 h-3.5 text-slate-400" />
            </div>
            <div className="font-mono text-slate-200 font-semibold text-xs">ESP32-CAM / USB CCTV</div>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              Captures shelf bays and checkout queues at 640x480 resolution. Streams low-latency MJPEG RTSP frames.
            </p>
          </div>

          {/* Block 2: Edge Processing */}
          <div className="bg-slate-800/90 p-3.5 rounded-lg border border-blue-500/50 space-y-2 shadow-xs">
            <div className="flex items-center justify-between">
              <span className="font-bold text-emerald-400 uppercase tracking-wider text-[11px]">2. Edge Processor</span>
              <Server className="w-3.5 h-3.5 text-emerald-400" />
            </div>
            <div className="font-mono text-slate-200 font-semibold text-xs">Laptop / Edge Mini-PC</div>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              Runs YOLOv8n object detection, ByteTrack anonymous tracking, and the 4-parameter Reconciliation Engine locally.
            </p>
          </div>

          {/* Block 3: Hardware Signaling */}
          <div className="bg-slate-800/90 p-3.5 rounded-lg border border-slate-700 space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-bold text-amber-400 uppercase tracking-wider text-[11px]">3. IoT Actuator</span>
              <Cpu className="w-3.5 h-3.5 text-amber-400" />
            </div>
            <div className="font-mono text-slate-200 font-semibold text-xs">Arduino Uno (USB)</div>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              Actuates physical Green / Yellow / Red store status LEDs and audible buzzer alerts on floor counters.
            </p>
          </div>

          {/* Block 4: Staff UI */}
          <div className="bg-slate-800/90 p-3.5 rounded-lg border border-slate-700 space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-bold text-purple-400 uppercase tracking-wider text-[11px]">4. Staff Copilot</span>
              <Activity className="w-3.5 h-3.5 text-purple-400" />
            </div>
            <div className="font-mono text-slate-200 font-semibold text-xs">React + Speech Synthesis</div>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              Translates operational actions into 6 vernacular languages (Tamil, Hindi, Telugu, etc.) with audio voice output.
            </p>
          </div>
        </div>
      </div>

      {/* Interactive Hardware Simulator & Live Serial Terminal */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Arduino Visual Simulator (5 Cols) */}
        <div className="lg:col-span-5 bg-white p-4 rounded-xl border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <span className="w-2 h-2 rounded-full bg-blue-600" />
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                Arduino Uno Simulator
              </h3>
            </div>
            <span className="text-[10px] font-mono font-bold text-slate-400 uppercase">115200 BAUD</span>
          </div>

          {/* Arduino Board Graphic */}
          <div className="bg-emerald-950 p-4 rounded-xl border-2 border-emerald-800 text-white space-y-3 relative overflow-hidden">
            <div className="flex justify-between items-center">
              <span className="font-bold font-mono text-xs tracking-wider text-emerald-300">ARDUINO UNO R3</span>
              <div className="flex space-x-1">
                <span className="w-2 h-2 rounded-full bg-blue-400 animate-pulse" />
                <span className="text-[10px] font-mono text-slate-300">USB-TX/RX</span>
              </div>
            </div>

            {/* 3 Physical LEDs on Breadboard */}
            <div className="bg-slate-900/90 p-3.5 rounded-lg border border-slate-700 flex items-center justify-around">
              {/* Green */}
              <div className="text-center space-y-1">
                <div
                  className={`w-6 h-6 rounded-full mx-auto transition-all ${
                    ledState === 'GREEN'
                      ? 'bg-emerald-500 shadow-[0_0_15px_rgba(16,185,129,1)]'
                      : 'bg-emerald-950 border border-emerald-800 opacity-40'
                  }`}
                />
                <span className="text-[10px] font-bold font-mono text-emerald-400 block">GREEN</span>
                <span className="text-[9px] text-slate-400 block">Pin D8 (OK)</span>
              </div>

              {/* Yellow */}
              <div className="text-center space-y-1">
                <div
                  className={`w-6 h-6 rounded-full mx-auto transition-all ${
                    ledState === 'YELLOW'
                      ? 'bg-amber-500 shadow-[0_0_15px_rgba(245,158,11,1)]'
                      : 'bg-amber-950 border border-amber-800 opacity-40'
                  }`}
                />
                <span className="text-[10px] font-bold font-mono text-amber-400 block">YELLOW</span>
                <span className="text-[9px] text-slate-400 block">Pin D9 (Restock)</span>
              </div>

              {/* Red */}
              <div className="text-center space-y-1">
                <div
                  className={`w-6 h-6 rounded-full mx-auto transition-all ${
                    ledState === 'RED'
                      ? 'bg-rose-500 shadow-[0_0_15px_rgba(239,68,68,1)] animate-pulse'
                      : 'bg-rose-950 border border-rose-800 opacity-40'
                  }`}
                />
                <span className="text-[10px] font-bold font-mono text-rose-400 block">RED</span>
                <span className="text-[9px] text-slate-400 block">Pin D10 (Queue)</span>
              </div>
            </div>

            {/* Manual Test Buttons */}
            <div className="flex space-x-1.5 pt-1">
              <button
                onClick={() => onSetLED('GREEN', 'MANUAL_TEST_OPTIMAL')}
                className="flex-1 py-1 rounded bg-emerald-700 hover:bg-emerald-600 text-white text-[10px] font-bold uppercase tracking-wider cursor-pointer transition-all"
              >
                Set Green
              </button>
              <button
                onClick={() => onSetLED('YELLOW', 'MANUAL_TEST_RESTOCK')}
                className="flex-1 py-1 rounded bg-amber-700 hover:bg-amber-600 text-white text-[10px] font-bold uppercase tracking-wider cursor-pointer transition-all"
              >
                Set Yellow
              </button>
              <button
                onClick={() => onSetLED('RED', 'MANUAL_TEST_URGENT')}
                className="flex-1 py-1 rounded bg-rose-700 hover:bg-rose-600 text-white text-[10px] font-bold uppercase tracking-wider cursor-pointer transition-all"
              >
                Set Red
              </button>
            </div>
          </div>
        </div>

        {/* Live Serial JSON Terminal (7 Cols) */}
        <div className="lg:col-span-7 bg-slate-950 text-slate-200 p-4 rounded-xl border border-slate-800 shadow-xs flex flex-col h-[280px]">
          <div className="flex items-center justify-between pb-2 border-b border-slate-800 text-xs">
            <span className="font-mono font-bold flex items-center space-x-1.5 text-emerald-400">
              <Terminal className="w-4 h-4" />
              <span>Serial Monitor (/dev/ttyACM0 • 115200 8N1)</span>
            </span>
            <span className="text-[10px] text-slate-500 font-mono uppercase font-bold tracking-wider">JSON Frame Parser</span>
          </div>

          <div className="flex-1 overflow-y-auto font-mono text-[11px] py-2 space-y-1.5 text-slate-300">
            {serialLogs.map((log, idx) => (
              <div key={idx} className="flex space-x-2">
                <span className="text-slate-500">{log.timestamp}</span>
                <span
                  className={`font-bold ${
                    log.direction === 'TX' ? 'text-blue-400' : 'text-emerald-400'
                  }`}
                >
                  [{log.direction}]
                </span>
                <span className="text-slate-200">{log.payload}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* AI & Software Technology Table (Section 20 & 24) */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-3.5 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <span className="w-2 h-2 rounded-full bg-blue-600" />
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
              AI, IoT &amp; Software Technology Specifications (SIH Benchmark)
            </h3>
          </div>
          <span className="text-[10px] text-slate-400 font-mono uppercase font-bold tracking-wider">100% Truthful Architecture</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50/70 border-b border-slate-200 text-slate-500 font-semibold uppercase">
              <tr>
                <th className="px-4 py-3">Task / Subsystem</th>
                <th className="px-4 py-3">Selected Technology</th>
                <th className="px-4 py-3">Type / Category</th>
                <th className="px-4 py-3">Engineering Justification</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
              {AI_TECHNOLOGY_TABLE.map((row, idx) => (
                <tr key={idx} className="hover:bg-slate-50/70 transition-colors">
                  <td className="px-4 py-2.5 font-bold text-slate-900">{row.task}</td>
                  <td className="px-4 py-2.5 font-mono text-blue-700 font-semibold">{row.technology}</td>
                  <td className="px-4 py-2.5">
                    <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-800 text-[10px] font-bold uppercase tracking-wider">
                      {row.type}
                    </span>
                  </td>
                  <td className="px-4 py-2.5 text-slate-500">{row.whySelected}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Microcontroller Firmware Code Tabs */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-3.5 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Code className="w-4 h-4 text-blue-600" />
            <span className="text-xs font-bold text-slate-900 uppercase tracking-wider">Microcontroller Firmware</span>
          </div>

          <div className="flex items-center space-x-2">
            <div className="flex rounded-md border border-slate-200 bg-white p-0.5 text-xs font-medium">
              <button
                onClick={() => setActiveCodeTab('ARDUINO')}
                className={`px-3 py-1 rounded text-[11px] font-bold uppercase tracking-wider transition-all cursor-pointer ${
                  activeCodeTab === 'ARDUINO' ? 'bg-blue-50 text-blue-700' : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                Arduino Uno (C++)
              </button>
              <button
                onClick={() => setActiveCodeTab('ESP32')}
                className={`px-3 py-1 rounded text-[11px] font-bold uppercase tracking-wider transition-all cursor-pointer ${
                  activeCodeTab === 'ESP32' ? 'bg-blue-50 text-blue-700' : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                ESP32-CAM (C++)
              </button>
            </div>

            <button
              onClick={() =>
                handleCopyCode(
                  activeCodeTab,
                  activeCodeTab === 'ARDUINO' ? arduinoCppCode : esp32CamCppCode
                )
              }
              className="flex items-center space-x-1 px-3 py-1 rounded-md bg-slate-100 hover:bg-slate-200 text-slate-700 text-[11px] font-bold uppercase tracking-wider cursor-pointer"
            >
              {copiedTab === activeCodeTab ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                  <span className="text-emerald-700 font-semibold">Copied!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>Copy Code</span>
                </>
              )}
            </button>
          </div>
        </div>

        <div className="p-4 bg-slate-950 text-slate-200 font-mono text-[11px] max-h-72 overflow-y-auto">
          <pre>{activeCodeTab === 'ARDUINO' ? arduinoCppCode : esp32CamCppCode}</pre>
        </div>
      </div>
    </div>
  );
};

# 🌊 RiverWatch PRO — Local Forwarder Installation Guide

This guide covers how to pair your ESP32 device ("RiverWatch_PRO"), run the standalone local forwarder client, and send live river/lake water telemetry securely to your cloud backend.

---

## 🔌 Decoupled Telemetry Architecture

To run the system in the cloud (Vercel + Render/Railway) while keeping the physical Bluetooth connection active:
1. The **Backend Service** runs in the cloud and exposes a secure `/api/ingest` endpoint.
2. The **Local Forwarder Client** (packaged as a single binary executable) runs on the laptop/PC physically paired with the ESP32.
3. The forwarder reads serial data over Bluetooth SPP, parses it, and forwards it instantly via HTTP POST.

---

## 🛠️ Step 1: Pair the ESP32 Device

Before running the forwarder, make sure the ESP32 device is powered on, advertising, and paired with your host machine.

### 🍎 macOS
1. Open **System Settings** → **Bluetooth**.
2. Locate **RiverWatch_PRO** under "Nearby Devices" and click **Connect/Pair**.
3. Once paired, macOS automatically maps the Bluetooth serial connection to a device path under `/dev/cu.RiverWatch_PRO` (or `/dev/tty.RiverWatch_PRO-*`).

### 🪟 Windows
1. Open **Settings** → **Bluetooth & devices** → **Add device**.
2. Select **Bluetooth** and pair with **RiverWatch_PRO**.
3. Open **Device Manager** and expand **Ports (COM & LPT)** to find the COM port number assigned to the incoming/outgoing Bluetooth SPP connection (e.g. `COM6`).

### 🐧 Linux
1. Open a terminal and use `bluetoothctl` to pair the device:
   ```bash
   bluetoothctl
   power on
   agent On
   default-agent
   scan on
   # Locate the MAC address of RiverWatch_PRO
   pair <MAC_ADDRESS>
   trust <MAC_ADDRESS>
   ```
2. Bind the Bluetooth serial connection to a rfcomm port:
   ```bash
   sudo rfcomm bind /dev/rfcomm0 <MAC_ADDRESS>
   ```

---

## 🏃 Step 2: Run the Standalone Forwarder

### 🍎 macOS
1. Download or locate the `RiverWatch-Forwarder` binary in the `dist` folder.
2. Open **Terminal**, navigate to the binary directory, and execute:
   ```bash
   ./RiverWatch-Forwarder
   ```
3. **Security Warning (Gatekeeper)**: If macOS blocks the app with an untrusted developer warning:
   - Go to **System Settings** → **Privacy & Security**.
   - Scroll down to the "Security" section and click **Open Anyway** next to the RiverWatch-Forwarder notice.

### 🪟 Windows
1. Locate `RiverWatch-Forwarder.exe` in the `dist` folder.
2. Double-click to launch, or open **Command Prompt** (cmd) / **PowerShell** and run:
   ```cmd
   RiverWatch-Forwarder.exe
   ```

### 🐧 Linux
1. Locate `RiverWatch-Forwarder` in the `dist` folder.
2. Make it executable and run it:
   ```bash
   chmod +x RiverWatch-Forwarder
   ./RiverWatch-Forwarder
   ```

---

## ⚙️ Step 3: Interactive Configuration (First Run Only)

Upon its first execution, the forwarder will guide you through an interactive setup and save your settings to a local `config.json` file in the same directory:

1. **Backend URL**: Input your deployed cloud backend URL (e.g., `https://riverwatch-pro.up.railway.app`) or `http://localhost:5000` for local dev.
2. **Ingest Key**: Enter the shared secret key (e.g., `riverwatch-demo` or your custom production key).
3. **Serial Port selection**: The forwarder automatically scans your system ports, detects recommended Bluetooth ports, and displays them as selection choices (or allows typing a custom port path).

---

## 🔍 Troubleshooting & FAQs

### 🚨 "Port not found" or "Cannot open serial port"
- Make sure the ESP32 is powered on and within Bluetooth range.
- Verify the Bluetooth device is actively paired in your OS settings.
- If on macOS, use `/dev/cu.RiverWatch_PRO` rather than `/dev/tty.*` for optimal serial read stability.
- If the port is busy, ensure no other terminal apps or Arduino IDE serial monitors are using that same port.

### 🚨 "401 Unauthorized"
- Your local `config.json` ingest key does not match the `INGEST_KEY` environment variable set on your backend server.
- **Railway/Render Fix**: Ensure `INGEST_KEY=your-secure-key` is correctly set in your backend's Environment Variables dashboard, and that your local `config.json` has the same key.

### 🚨 "Connection refused" or "HTTP connection failed"
- Check that your Railway/Render server is active and the URL is spelled correctly (including `https://`).
- To re-run the configuration wizard, simply delete `config.json` in the forwarder folder and restart the app.

---

## 🚀 Re-Building from Source

If you make modifications to `bluetooth_reader.py` and want to compile a fresh standalone binary:
1. Install Python 3.10+ and pip.
2. Navigate to the `riverwatch-backend` folder and run:
   ```bash
   python build_forwarder.py
   ```
This will automatically download and install PyInstaller and compile a fresh standalone executable into `dist/`.

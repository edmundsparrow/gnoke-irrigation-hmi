# 💧 Gnoke Irrigation

A high-performance, offline-first HMI (Human-Machine Interface) template
designed for industrial scheduling and flow monitoring.

> Portable. Private. Persistent.

------------------------------------------------------------------------

## 🚀 The HMI Strategy

This project serves as a functional UI/UX boilerplate for hardware
control. It demonstrates how to manage complex industrial
workflows---zones, scheduling, and real-time logging---using a
lightweight, zero-dependency architecture.

-   **Developer Ready:** Modular Vanilla JS components (`ui.js`,
    `state.js`, `theme.js`)
-   **Hardware Agnostic:** Designed as a frontend shell. Supports
    integration with WebSerial, WebUSB, or Bluetooth via
    `connections.js`
-   **Low-Power Optimized:** Runs smoothly on low-spec tablets and
    embedded browsers

------------------------------------------------------------------------

## ⚙️ What It Does

-   Zone Management: Define zones with custom flow rates
-   Smart Scheduling: Program operations by time and day of week
-   Dynamic Logging: Automatic calculation of consumption (litres) based
    on runtime
-   Data Portability: Export usage logs to CSV
-   PWA Ready: Installable on Android, iOS, and Desktop
-   Works 100% offline
-   No account. No server. No tracking

------------------------------------------------------------------------

## 🧱 Tech Stack

-   **UI:** Gnoke Design System (Custom CSS Variables)
-   **Core:** Vanilla JavaScript (ES6+)
-   **Persistence:** localStorage (serverless CRUD)
-   **Offline:** Service Worker caching

------------------------------------------------------------------------

## ▶️ Run Locally

``` bash
git clone https://github.com/edmundsparrow/gnoke-irrigation.git
cd gnoke-irrigation
python -m http.server 8080
```

Open: http://localhost:8080

------------------------------------------------------------------------

## 📁 Project Structure

    gnoke-irrigation/
    ├── index.html
    ├── main/
    │   └── index.html
    ├── js/
    │   ├── state.js
    │   ├── theme.js
    │   ├── ui.js
    │   ├── connections.js
    │   ├── update.js
    │   └── app.js
    ├── style.css
    ├── sw.js
    ├── manifest.json
    ├── global.png
    └── LICENSE

------------------------------------------------------------------------

## 🔌 Customization & Support

Need a specific driver implementation or a custom HMI layout?

👉 Request customization or support via Selar:
https://selar.com/showlove/edmundsparrow

------------------------------------------------------------------------

## 🔐 Privacy

-   No tracking
-   No telemetry
-   No ads
-   Your data stays on your device

------------------------------------------------------------------------

## 📜 License

Copyright © 2026 Edmund Sparrow\
Licensed under GNU GPL v3

# StreamPulse | Live IPTV & OTT Web & Mobile Suite

A full-stack, enterprise-grade Live IPTV streaming platform built with **Python Django (Backend)**, **React.js & Material-UI (Web Frontend)**, and **React Native & React Native Paper (Cross-Platform Mobile)**.

Includes 100% free, active, tested TV channels (Tamil, Indian, Kids & Animation, Sports, News 24x7, Music, Infotainment).

---

## 🌟 Key Features

* **Real-time Live Streaming**: High-definition HLS (m3u8) adaptive streaming powered by `Hls.js` with sub-second buffer latency.
* **CORS Proxy Engine**: Built-in Django stream proxy (`/api/proxy/`) to effortlessly stream cross-origin protected IPTV links directly in web browsers without browser blocking.
* **Material-UI (MUI v5) Cyber-Dark Theme**: Sleek, glassmorphic UI with dynamic animated live status badges, custom volume slider, fullscreen support, and category pills.
* **Smart Search & Filters**: Filter instantly by category (Tamil Live, Kids, News, Music, Infotainment) or search across names and genres.
* **Offline Favorites Engine**: Bookmark and save favorite channels locally.
* **Cross-Platform Mobile Ready**: React Native project architecture powered by `react-native-paper` MD3 design system and `expo-av`.

---

## 🚀 Quick Start (1-Click Run)

### 1. Start Backend (Django REST Framework):
```bash
cd backend
python manage.py runserver 127.0.0.1:8000
```

### 2. Start Frontend (React.js + Vite):
```bash
cd frontend
npm run dev
```

Visit: **`http://localhost:5173`** in your browser!

---

## 📺 Verified Preloaded Channels:
* **Tamil Live**: DD Tamil HD, Colors Tamil HD, Polimer TV, Kalaignar TV, Jaya TV, IBC Tamil, Makkal TV.
* **Kids & Cartoons**: Hungama TV (Shinchan & Doraemon), Disney Channel HD, Disney Channel, Nickelodeon (Nick), ETV Bal Bharat.
* **News 24x7**: News18 Tamil Nadu, News7 Tamil, Polimer News, Puthiya Thalaimurai, News Tamil 24x7.
* **Music & Lifestyle**: 7S Music, NDTV Good Times, Isai Aruvi.
* **Infotainment**: History TV18 HD.

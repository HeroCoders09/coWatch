# CoWatch 🎬

A web-based, real-time media synchronization platform tailored for large-group events and campus movie screenings. CoWatch allows hundreds of users to join a virtual theater and watch video media in perfect sync, complete with live chat and interactive reactions.

## 🚀 The Problem
Currently, hosting remote movie nights relies on uncoordinated screen-sharing via standard meeting apps, resulting in severe frame-rate drops, out-of-sync audio, and a poor viewing experience. CoWatch solves this by providing a dedicated, synchronized environment designed specifically for high-capacity media consumption rather than video conferencing. 

## ✨ Key Features
* **Perfect Synchronization:** Sub-second media syncing across all connected clients.
* **Master Admin Controls:** A single administrator controls playback (play, pause, seek, subtitles), which instantly updates the video state for the entire room.
* **Digital Ticketing:** Secure room access codes to distribute to the campus student body.
* **Theater-style Interaction:** A live, moderated text chat and a "Live Reaction" overlay for floating emojis to simulate the energy of a physical screening.

## 🛠️ Tech Stack
* **Frontend:** React.js, Tailwind CSS
* **Backend & State Management:** Firebase / Supabase (Realtime Database & Authentication)
* **Networking:** WebSockets (for play/pause state syncing), WebRTC (for peer-to-peer low-latency communication)


## 🤝 The Team
Built by a team of 6 student developers as a semester project to tackle complex logic in real-time state management, user permissions, and peer-to-peer networking.

## ⚙️ Local Setup & Installation

1. Clone the repository:
   ```bash
   git clone [https://github.com/your-username/cowatch.git](https://github.com/your-username/cowatch.git)
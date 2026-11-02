# LabJamu — Traditional Nusantara Skin Ethnopharmacology & On-Device Causal Engine

[![License: MIT](https://img.shields.io/badge/License-MIT-emerald.svg)](LICENSE)
[![React 19](https://img.shields.io/badge/React-19.0-61dafb.svg)](https://react.dev)
[![Vite 6](https://img.shields.io/badge/Vite-6.0-646cff.svg)](https://vitejs.dev)
[![Tailwind CSS v4](https://img.shields.io/badge/TailwindCSS-v4.0-38bdf8.svg)](https://tailwindcss.com)
[![NVIDIA NIM](https://img.shields.io/badge/NVIDIA%20NIM-Nemotron--3--Nano-76b900.svg)](https://build.nvidia.com)
[![YouCam HD](https://img.shields.io/badge/YouCam%20API-v2.0%20S2S-ff4081.svg)](https://www.perfectcorp.com)
[![Privacy](https://img.shields.io/badge/Privacy-Zero--Cloud%20Retention-success.svg)](#privacy--security-architecture)

> **LabJamu** is an authentic, privacy-preserving, on-device clinical intelligence system that transforms centuries-old Indonesian traditional herbal skincare (*Jamu*) into mathematically verifiable dermatological science. Powered by **Perfect Corp YouCam HD Skin Analysis v2.0 S2S API**, **NVIDIA Nemotron NIM Causal Reasoning**, and **Pearl's Do-Calculus**, LabJamu isolates genuine botanical bioactivity from confounding tropical environmental noise (humidity, UV, temperature) in real time.

---

## Inspiration

For centuries across the Indonesian archipelago, traditional herbalists developed *Jamu*—botanical skincare formulations derived from indigenous rhizomes, leaves, and mineral starches (such as *Curcuma heyneana*, *Kaempferia galanga*, and *Centella asiatica*) to calm cutaneous inflammation, repair barrier breakdown, and protect against equatorial UV radiation.

However, modern dermatology has largely ignored or struggled to validate these remedies for two critical reasons:
1. **The Confounder Dilemma:** In tropical equatorial climates, extreme ambient humidity (75–90% RH) and intense solar radiation fluctuate daily. When a user's redness subsides or moisture rises, is it genuine botanical bioactivity, or did the weather simply change?
2. **The Cosmetic Whitening Trap & Privacy Concerns:** The regional beauty industry is flooded with toxic chemical bleaching products promoting artificial "whitening," while modern beauty tech apps routinely upload sensitive, unencrypted facial biometrics to centralized corporate cloud servers.

We built **LabJamu** to solve both challenges: an authentic, privacy-preserving on-device clinical intelligence system that employs **Pearl's Causal Do-Calculus** and **NVIDIA Nemotron NIM** to mathematically isolate botanical efficacy from tropical climate noise, backed by **Perfect Corp's YouCam HD Skin Analysis v2.0 S2S API** and **Zero-Cloud Retention**.

---

## What it does

LabJamu operates as an on-device N-of-1 clinical research trial engine directly on your smartphone:

1. **Objective 7-Parameter YouCam HD Biometrics:**
   * Ingests face photographs via an interactive alignment canvas ensuring the face occupies **>60%** of the frame.
   * Calls Perfect Corp's YouCam HD v2.0 S2S API to extract scientific, photometric scores (0–100) for **Moisture**, **Erythema (Redness)**, **Texture Smoothness**, **Radiance**, **Pore Refinement**, **Hyperpigmentation (Spots)**, and **Acne/Blemishes**, alongside skin typology segmentation (T-zone vs. U-zone).
2. **Diagnostic Heatmap Layer with Opacity Control:**
   * Fetches real transparent PNG diagnostic heatmaps returned by YouCam.
   * Users can toggle between *Redness*, *Pores*, *Spots*, *Acne*, and *Texture* heatmaps directly over their face photograph with a live **0–100% opacity slider**.
3. **2-Step Adaptive Clinical Intake Flow:**
   * Immediately following a scan, **NVIDIA Nemotron** evaluates live biometric shifts and asks a targeted clinical check-in question (e.g. application duration, warm/tingling sensations, recent sun exposure).
   * Evaluates user context with YouCam photometrics to derive genuine causal attribution weights and clinical notes before navigating to the dashboard.
4. **Pearl's Causal Do-Calculus DAG:**
   * Mathematically isolates the intervention $\mathbb{P}(\text{Skin Outcome} \mid \text{do}(\text{Herb}))$ from environmental noise (ambient humidity, UV index).
   * Displays isolated causal attribution percentages (e.g., *86% Botanical Attribution vs. 14% Environmental Noise*) with $p < 0.05$ significance markers.
5. **Nusantara Protocol Switcher & AI Compatibility Dossier:**
   * Users choose from 5 authentic Indonesian recipes (*Masker Temugiring*, *Bedak Dingin Beras Kencur*, *Sari Pegagan*, *Kunyit Asam*, *Kompres Daun Sirih*) with customizable trial lengths (7, 14, or 21 days).
   * Clicking **"Analyze & Activate Protocol"** prompts NVIDIA Nemotron to generate an instant clinical dossier (Compatibility Score, Target Molecular Pathways, Predicted Biomarker Trajectory, and Patch Test Advisory).
   * Automatically cross-syncs the briefing into the Chat timeline.
6. **Zero Mock / Hardcoded Data:**
   * The dashboard features clean uncalibrated zero-states until scans are recorded. Every number, delta, and causal weight derives strictly from live API calls and IndexedDB.
7. **Multimodal Clinical Chat Partner:**
   * Features **Hands-Free Voice Dictation** using the native **Web Speech API** (`SpeechRecognition`).
   * Direct face photo attachment button in the input bar.
   * Renders native **BiometricScanCards** and parses responses cleanly without raw formatting asterisks.
8. **Deterministic Safety Circuit Breaker:**
   * Monitored non-LLM trip-wire: if erythema increases by **>+20.0%**, the circuit trips instantly, alerting the user to rinse immediately and discontinue use.

---

## How we built it

* **Frontend:** Built with **React 19**, **Vite 6**, and **Tailwind CSS v4** (`@theme` modern design system).
* **Local Database & Storage:** **Dexie.js v4** with typed `EntityTable` for IndexedDB, storing sessions, metrics, safety logs, and chat messages. High-resolution face photographs are stored in the browser's **Origin Private File System (OPFS)**.
* **Computer Vision & Dermatology API:** **Perfect Corp / YouCam AI Skin Analysis v2.0 S2S API** via an asynchronous 4-step pipeline with presigned AWS S3 uploads.
* **AI & Causal Reasoning:** **NVIDIA NIM** (`nvidia/nemotron-3-nano-omni-30b-a3b-reasoning`) accessed via stateless serverless edge proxies with 1024 token budgets for chain-of-thought reasoning.
* **Edge Proxy:** Deployed on **Node.js 20** serverless runtime in Singapore (`sin1`) with zero cloud image retention (`buffer.fill(0)` instant memory scrubbing).

---

## Challenges we ran into

1. **YouCam >60% Face Framing Threshold:** Raw camera/phone photos naturally capture shoulders and background, resulting in face widths of 35–45% and triggering HTTP 422 `error_src_face_too_small`. We engineered an interactive alignment viewport with automatic 1.25× zoom and pan calibration that crops to a 1080×1080 canvas, ensuring YouCam always receives a valid, perfectly framed face.
2. **YouCam S2S Parameter Naming Nuances:** Discovered through systematic API probing that YouCam rejects parameter names like `spot`, requiring the exact string `age_spot`.
3. **Nemotron Reasoning Token Budgets:** The `nemotron-3-nano-omni-30b-a3b-reasoning` model generates comprehensive chain-of-thought reasoning tokens in `reasoning_content` before writing its final JSON. Standard 350–500 token limits caused `content: null` truncations. Expanding the token allocation to 1024 ensured smooth, robust JSON generation.
4. **The Zero-Mock Architecture Mandate:** Removing all synthetic mock data across all 5 Studio modules required rigorous synchronization between Dexie `useLiveQuery`, baseline session tracking, and fallback zero-states.

---

## Accomplishments that we're proud of

* **Authentic S2S Verification:** Successfully retrieved full 7-parameter biometric scores and signed AWS S3 transparent PNG diagnostic masks from Perfect Corp's live enterprise API.
* **100% Privacy-Preserving Architecture:** Zero cloud retention for face photographs. Biometric images never touch a persistent database or third-party cloud disk.
* **Reclaiming Indigenous Ethnopharmacology:** Transforming traditional Indonesian herbal wisdom from folk lore into mathematically validated, clinically transparent dermatological science.
* **Silky Smooth PWA Performance:** Production build compiles in under 900ms with a total asset bundle under 455 kB.

---

## What we learned

* How to formulate Pearl's Do-Calculus in accessible, consumer-friendly UI graphs to help non-technical users understand causal attribution versus environmental noise.
* Best practices for handling modern asynchronous Server-to-Server biometric vision pipelines with strict framing constraints.
* Optimizing prompt engineering for reasoning-centric LLMs (`nemotron-3-nano`) to produce guaranteed valid JSON schemas.

---

## What's next for LABJAMU

* **Web Worker Peter-Clark (PC) Causal Worker:** Offloading continuous constraint-based causal discovery to an isolated browser thread.
* **Bluetooth Microclimate Hygrometer Pairing:** Streaming real-time ambient relative humidity and temperature directly from wearable sensors via Web Bluetooth API.
* **Client-Side PDF Clinical Trial Certificates:** Enabling local herbal producers and cooperatives to print cryptographically verifiable N-of-1 trial certificates using `jsPDF`.
* **Clinical Pilot with Indonesian Jamu Cooperatives (GP Jamu):** Bringing standardized trial validation to grassroots traditional herbalists across Java and Bali.

---

## 🔒 Privacy & Security Architecture

* **Zero-Cloud Facial Image Retention:** Raw face photographs are stored exclusively within the browser's local **Origin Private File System (OPFS)** and IndexedDB (`Dexie.js`).
* **RAM-Only Serverless Processing:** Vercel/Vite serverless API proxies process image buffers strictly in volatile RAM memory; memory buffers are forcefully cleared (`imageBuffer.fill(0)`) immediately following upstream transmission.
* **Global Data Portability (GDPR Art. 20):** 100% on-device sandboxing with zero user tracking, zero external telemetry, and immediate local data erasure capabilities in the Settings tab.

---

## 🏗️ Technology Stack

| Layer | Technologies |
| :--- | :--- |
| **Frontend Framework** | [React 19](https://react.dev) + [TypeScript 5.7](https://www.typescriptlang.org) |
| **Bundler & Dev Server** | [Vite 6](https://vitejs.dev) + [vite-plugin-pwa](https://vite-pwa-org.netlify.app) |
| **Styling & Design System** | [Tailwind CSS v4](https://tailwindcss.com) (`@theme` modern tokens) + [Lucide React](https://lucide.dev) |
| **Local Storage & Database** | [Dexie.js v4](https://dexie.org) (`EntityTable` IndexedDB) + Origin Private File System (OPFS) |
| **AI Causal Reasoning** | [NVIDIA NIM](https://build.nvidia.com) (`nvidia/nemotron-3-nano-omni-30b-a3b-reasoning`) |
| **Biometric Skin Diagnostics**| [Perfect Corp YouCam HD Skin Analysis v2.0 S2S API](https://www.perfectcorp.com) |
| **Edge Proxies & Runtime** | Node.js 20.x, Vercel Serverless Functions (`sin1` Singapore edge cluster) |

---

## 🚀 Getting Started

### Prerequisites
* **Node.js:** `v20.x` or higher
* **npm:** `v10.x` or higher
* **API Keys Required:**
  * **NVIDIA NIM Key:** From [build.nvidia.com](https://build.nvidia.com)
  * **YouCam API Token:** From [Perfect Corp Developer Portal](https://www.perfectcorp.com)

### Installation

1. **Clone the repository:**
   ```bash
   git clone https://github.com/masbroustudio/LabJamu.git
   cd LabJamu
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Configure Environment Variables:**
   Copy `.env.example` to `.env.local` in the project root directory:
   ```bash
   cp .env.example .env.local
   ```
   Populate your actual keys in `.env.local`:
   ```ini
   YOUCAM_API="your_youcam_bearer_token"
   YOUCAM_BASE_URL="https://yce-api-01.makeupar.com"
   YOUCAM_SECRET="your_rsa_public_key"

   NIM_KEY="nvapi-your_nvidia_nim_key"
   NIM_BASE_URL="https://integrate.api.nvidia.com/v1"
   NIM_MODEL="nvidia/nemotron-3-nano-omni-30b-a3b-reasoning"
   ```
   > ⚠️ **Security Notice:** `.env.local` is strictly ignored by Git and will never be committed or exposed.

4. **Launch Local Development Server:**
   ```bash
   npm run dev
   ```
   Open [http://localhost:5173](http://localhost:5173) in your browser.

5. **Build for Production:**
   ```bash
   npm run build
   ```

---

## 📜 Ethical & Traditional Knowledge Attribution

LabJamu honors the rich intangible cultural heritage of traditional Indonesian medicine (*Jamu*). Ethnopharmacological profiles are curated based on empirical peer-reviewed literature documenting botanical taxa native to the Indonesian archipelago, including *Curcuma heyneana*, *Kaempferia galanga*, *Centella asiatica*, *Curcuma longa*, and *Piper betle*.

---

## 📄 License

Distributed under the MIT License. See [LICENSE](LICENSE) for details.

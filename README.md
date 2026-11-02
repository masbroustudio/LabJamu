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

## 🌟 Key Features

### 1. Real-Time YouCam HD v2.0 S2S Skin Analysis
* **7-Parameter Objective Biometric Panel:** Direct server-to-server integration measuring:
  * **Moisture / Hydration** (`/100`)
  * **Erythema (Redness)** (`/100`)
  * **Texture Smoothness** (`/100`)
  * **Radiance & Evenness** (`/100`)
  * **Pore Refinement** (`/100`)
  * **Spot & Pigment Clarity** (`/100`)
  * **Acne & Blemish Calm** (`/100`)
  * **Skin Type Classification:** Automated T-zone and U-zone cutaneous segmentation.
* **Smart Face Alignment & Cropping:** User-guided viewport ensuring face width exceeds YouCam's strict **>60%** framing threshold with interactive zoom (1.0x–2.5x) and pan controls.
* **Diagnostic Heatmap Layer:** Real transparent PNG diagnostic masks (Redness, Pores, Spots, Acne, Texture) rendered directly over high-resolution face photographs with a live **0–100% opacity slider**.

### 2. NVIDIA Nemotron NIM Clinical Causal Engine
* **2-Step Adaptive Clinical Intake:** Between image capture and dashboard viewing, Nemotron evaluates live YouCam biometric scores and formulates an adaptive clinical check-in question (e.g. application duration, heat sensations, sun exposure) with interactive quick-chips.
* **Pearl's Do-Calculus Graph:** Mathematical isolation of the causal effect:
  $$\mathbb{P}(\text{Skin Outcome} \mid \text{do}(\text{Herb}))$$
  Differentiates genuine phytochemical intervention from environmental confounders (ambient humidity, UV index).
* **Deterministic Safety Circuit Breaker:** Instant automated trip-wire if erythema spikes by >+20.0%, flagging potential contact dermatitis or adverse allergic reactions.

### 3. Nusantara Ethnopharmacology Protocol Switcher
* **5 Verified Traditional Jamu Formulations:**
  * **Masker Temugiring & Beras Putih:** *Curcuma heyneana* + *Oryza sativa* (Stratum corneum smoothing & NF-κB anti-erythema).
  * **Bedak Dingin Beras Kencur:** *Kaempferia galanga* + Rice Ceramides (Natural EPMC broad-spectrum UV absorption & barrier cooling).
  * **Sari Pegagan Restorative Mask:** *Centella asiatica* (Type-I collagen upregulation & IL-6 suppression).
  * **Kunyit Asam Purifying Paste:** *Curcuma longa* + *Tamarindus indica* (COX-2 enzyme inhibition & antimicrobial blemish clearance).
  * **Kompres Daun Sirih Astringent:** *Piper betle L.* (Chavicol antibacterial tone & pore refinement).
* **Instant AI Compatibility Dossier:** NVIDIA Nemotron evaluates the chosen herb against the user's latest biometrics to generate an instant clinical dossier (compatibility score, targeted molecular pathways, predicted biomarker trajectory, patch test advisory).
* **Flexible Protocol Durations:** Standardized 7-day (Rapid Bioassay), 14-day (Standard N-of-1), or 21-day (Epidermal Renewal Cycle) trials.

### 4. Interactive Timeline & Longitudinal Tracking
* **Encrypted OPFS Split Slider:** Compare Day 1 Baseline photographs side-by-side with Day $N$ treatment scans using an interactive draggable comparison divider.
* **Multi-Metric SVG Trajectory Curves:** Native SVG chart plotting individual longitudinal curves for Hydration, Erythema, Texture, and Pores.
* **Zero Mock Data Guarantee:** The dashboard displays uncalibrated zero-states until scans are captured; every number derives strictly from live API calls and Dexie IndexedDB.

### 5. Multimodal Clinical Chat Partner
* **Hands-Free Voice Dictation:** Integrated Web Speech API (`SpeechRecognition`) for effortless clinical inquiries.
* **Direct Photo Ingestion:** Ingest face scans directly from the chat input bar via pre-loaded alignment scanner.
* **Clean Formatting:** All agent responses rendered natively via GitHub-flavored Markdown without raw formatting artifacts.
* **Rich Biometric Scan Cards:** Visual on-device summary cards embedded directly into the conversation stream.

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

## 📁 Repository Structure

```text
labjamu/
├── api/                        # Vercel Serverless Function Edge Proxies
│   ├── nim-proxy.ts            # NVIDIA NIM API Proxy (Zero-Retention)
│   └── youcam-proxy.ts         # YouCam S2S 3-Step Orchestration Proxy
├── public/                     # Static assets, icons, manifest
├── src/
│   ├── components/
│   │   ├── chat/               # Biometric cards, Markdown parsing, bubbles
│   │   ├── layout/             # Navigation bars, shell
│   │   └── studio/             # CameraScanner, Metrics, Timeline, Safety, DAG
│   ├── db/                     # Dexie.js v4 database schema & typed stores
│   ├── lib/
│   │   ├── herbalDatabase.ts   # Indonesian Ethnopharmacology knowledge base
│   │   ├── nim.ts              # NVIDIA NIM Agent Chat client
│   │   ├── nimClinical.ts      # Clinical Question, Evaluation & Compatibility
│   │   └── opfs.ts             # Origin Private File System read/write utilities
│   ├── pages/
│   │   ├── ChatPage.tsx        # Multimodal AI Clinical Partner
│   │   ├── SettingsPage.tsx    # Privacy, GDPR export, data clearance
│   │   └── StudioPage.tsx      # Experiment Studio & Protocol Switcher
│   ├── types/                  # Shared TypeScript interfaces
│   ├── App.tsx                 # Root layout & tab router
│   ├── main.tsx                # React 19 entry point
│   └── index.css               # Tailwind CSS v4 design tokens
├── .env.example                # Environment variable template
├── package.json                # Dependencies & scripts
├── tsconfig.json               # TypeScript strict configuration
└── vite.config.ts              # Vite configuration with local API middleware
```

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
   cd LabJamu/labjamu
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Configure Environment Variables:**
   Copy `.env.example` to `.env.local` in the `labjamu` root directory:
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

## 🧪 Testing Face Analysis with Sample Photos

The repository includes standardized reference test photos located in the `../IMAGE/` directory:
* `BEFORE.png` (Day 1 Baseline Candidate)
* `AFTER.jpg` (Day 14 Treatment Candidate)
* `skin_analysis_08_672d34078f.png` (Standard Reference)

### Ingestion Flow:
1. Navigate to **Experiment Studio** and click **Scan Skin** (or click the **Image Attachment** button in **Chat**).
2. Select **Upload Face Photo** and choose `BEFORE.png` or `AFTER.jpg`.
3. The alignment canvas automatically applies a **1.25x zoom** inside the 72% oval guide to satisfy YouCam's >60% face width requirement. Pan as needed.
4. Click **Analyze Aligned Face Photo**.
5. Answer NVIDIA Nemotron's adaptive check-in question and submit your intake.
6. Click **View Results in Dashboard** to inspect live scores, deltas, and toggle the **Diagnostic Heatmap Layer** with the opacity slider!

---

## 📜 Ethical & Traditional Knowledge Attribution

LabJamu honors the rich intangible cultural heritage of traditional Indonesian medicine (*Jamu*). Ethnopharmacological profiles are curated based on empirical peer-reviewed literature documenting botanical taxa native to the Indonesian archipelago, including *Curcuma heyneana*, *Kaempferia galanga*, *Centella asiatica*, *Curcuma longa*, and *Piper betle*.

---

## 📄 License

Distributed under the MIT License. See [LICENSE](LICENSE) for details.

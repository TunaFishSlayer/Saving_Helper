# GR1 Savings Helper

Welcome to **Savings Helper** — a full-featured, offline-first financial management application with AI-powered receipt scanning, budget tracking, multi-language support (English & Vietnamese), multi-currency handling (VND & USD), and cloud account synchronization.

---

## 🌟 Key Features

- **Offline-First Architecture & Cloud Sync**: Use full app capabilities in Guest Mode without logging in. When creating an account, seamlessly merge offline IndexedDB (Dexie) records with PostgreSQL cloud storage.
- **Multi-Language Support (i18n)**: Instant switching between **English (EN)** and **Vietnamese (VI)** across all views including Sign In, Sign Up, Dashboard, Transactions, Budgets, Subscriptions, Goals, and Profile.
- **Multi-Currency Support**: Format transactions, budgets, and savings goals dynamically in **VND (₫)** or **USD ($)**.
- **AI Receipt Scanning (OCR)**: Microservice powered by FastAPI and Groq Vision API to parse receipt images into structured transactions automatically.
- **Financial Analytics & Budget Alerts**: Interactive visual analytics (Recharts), customizable spending alerts with threshold notifications, cost breakdown for recurring subscriptions, and savings goal portfolio tracking.
- **Cross-Platform (Web & Mobile)**: Runs as a modern Vite/React web application and as an Android WebView app wrapped with Capacitor.

---

## 🏗️ Tech Stack & Architecture

- **Frontend**: React 19, Vite, React Router v7, Lucide Icons, Recharts, Dexie.js (IndexedDB).
- **Backend API**: Node.js, Express.js, Prisma ORM, PostgreSQL database, JWT authentication, Nodemailer (Password Reset).
- **OCR Microservice**: Python 3.10+, FastAPI, Uvicorn, Pillow, Groq Vision API.
- **Mobile Platform**: Capacitor 8 (`@capacitor/android`) for Android WebView packaging.
- **Containerization & Deployment**: Docker, Docker Compose, Nginx reverse proxy, Render Blueprint (`render.yaml`).

---

## 🚀 Running Locally

### Prerequisites
- Node.js 18+ and `npm`
- Python 3.10+ (for OCR Service)
- PostgreSQL database instance (or Docker)

---

### 1️⃣ Express Backend & Database (Port 5000)

```powershell
# Navigate to backend
cd backend

# Install dependencies
npm install

# Run database migrations and generate Prisma Client
npx prisma migrate dev

# Start development server
npm run dev
```

---

### 2️⃣ Vite React Frontend (Port 5173)

```powershell
# Navigate to frontend
cd frontend

# Install dependencies
npm install

# Start development server
npm run dev
```

---

### 3️⃣ Python OCR Microservice (Port 8000)

```powershell
# Navigate to OCR service
cd ocr_service

# Activate virtual environment (Windows)
.venv\Scripts\activate

# Install requirements if needed
pip install -r requirements.txt

# Run FastAPI service
python app.py
```
> 💡 Query health status at `http://localhost:8000/health`.

---

## 🐳 Running with Docker Compose

Run all services (PostgreSQL, Backend API, OCR Microservice, and Frontend Nginx server) simultaneously:

```powershell
docker-compose up --build
```

---

## 📱 Android App (Capacitor)

To build and sync the Android WebView project:

```powershell
cd frontend

# Build frontend & sync to native Android project
npm run cap:sync

# Open in Android Studio
npm run cap:open
```

---

## 📊 Architecture & Sync Flow

```mermaid
sequenceDiagram
    actor User
    participant Client as Vite React (Dexie LocalDB)
    participant Server as Node Backend (PostgreSQL)
    participant AI as FastAPI OCR (Groq Vision)

    alt Offline / Guest Mode
        User->>Client: Create Transaction / Budget / Goal
        Client->>Client: Persist locally in IndexedDB (Dexie)
    else Online Account Sync
        User->>Client: Login / Register
        Client->>Server: POST /api/sync (Batch records with Client UUIDs)
        Server->>Server: Validate & Upsert to PostgreSQL
        Server-->>Client: Sync Confirmation & Cloud Pull
    else AI Receipt Scan
        User->>Client: Upload Receipt Image
        Client->>Server: POST /api/transactions/scan-receipt
        Server->>AI: POST /parse-receipt (Groq Vision)
        AI-->>Server: Structured JSON (Merchant, Date, Total Amount)
        Server-->>Client: Formatted Receipt Data
    end
```

---

## 🛠️ Environment Variables (.env Specifications)

### `backend/.env`
```env
PORT=5000
DATABASE_URL=postgresql://postgres:password@localhost:5432/savings_helper
JWT_SECRET=your_super_secret_jwt_key
GROQ_API_KEY=your_groq_api_key_here
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@gmail.com
SMTP_PASS=your_email_app_password
```

### `ocr_service/.env`
```env
PORT=8000
GROQ_API_KEY=your_groq_api_key_here
```

---

## 📄 License
This project is developed as part of the GR1 Savings Helper Capstone Project.

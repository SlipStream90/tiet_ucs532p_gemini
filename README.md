# 🍳 AI Kitchen Dashboard & Monitoring Ecosystem

A state-of-the-art intelligent kitchen monitoring system that combines **Real-Time Safety Intelligence** with a **Hierarchical Machine Learning Grocery Tracker**. Built with a Next.js 14 frontend and a high-performance FastAPI/OpenCV backend.

---

## 🚀 System Overview

The project is split into two primary operational modules, each serving a critical role in the modern smart kitchen:

### 1. 🛡️ Safety Intelligence Dashboard (`/dashboard`)
Designed to mitigate hazards in real-time using advanced computer vision.
- **HOG-based Person Detection**: Utilizes Histogram of Oriented Gradients (HOG) with improved granularity and confidence weighting to identify humans in the kitchen workspace.
- **Fire & Flare Detection**: Uses HSV-space thresholding to detect open flames.
- **Smart Silhouetting**: Employs a unique masking pipeline that subtracts human silhouettes from the fire detection mask to eliminate false positives caused by skin tones or clothing colors.
- **Hazard State Engine**: A temporal logic system that detects interactions (e.g., human near knife, unattended fire) and escalates risk levels from `Safe` → `Warning` → `Hazard`.

### 2. 🥦 Live Grocery Tracker (`/live-grocery`)
A sophisticated inventory management system powered by a hierarchical expert ML system.
- **Hierarchical ML Architecture (Coarse → Expert)**:
  - **Stage 1 (Coarse)**: A top-level model classifies the item into general groups (e.g., *Fruit*, *Vegetable*).
  - **Stage 2 (Expert)**: Specialized expert models for each group refine the classification with high precision.
  - **Probability Fusion**: Confidence scores are calculated as `P(Item) = P(Item|Group) * P(Group)`, ensuring cross-category errors (like Apple vs. Tomato) are minimized.
- **Feature Extraction Pipeline**: Extracts a feature vector comprising **HOG** (texture), **LBP** (fine pattern), and **64-bin Color Histograms** (color signature).
- **Snapshot Analysis**: A one-click "Capture & Analyze" feature allows manual snips from the live feed for instant high-priority classification.
- **Dynamic Inventory**: Automatically adds detected food items to a virtual pantry with a smart debounce mechanism to prevent duplicate entries.
- **Nutrition Logic**: Tracks real-time protein stock and compares it against adjustable daily goals.

---

## 🛠️ Technology Stack

| Layer | Technologies |
| :--- | :--- |
| **Frontend** | Next.js 14 (App Router), React, Vanilla CSS, Lucide Icons |
| **Backend** | Python 3.10+, FastAPI, Uvicorn, MJPEG Streaming |
| **Computer Vision** | OpenCV (`cv2`), Scikit-Image (`skimage`), Scikit-Learn |
| **ML Models** | SVC, RandomForest, LogisticRegression (Calibrated Ensembles) |
| **Storage** | `joblib` for Model Pickles, JSON for Inventory/State |

---

## 📦 Installation & Setup

Running the system requires two terminal environments: one for the Python processing engine (Backend) and one for the React application (Frontend).

### 1. Backend Setup (Inference Engine)
1. **Navigate to backend**:
   ```bash
   cd backend
   ```
2. **Install Dependencies**:
   ```bash
   pip install -r requirements.txt
   ```
3. **Model Placement**:
   Ensure you have the following structure in the root `models/` folder:
   ```text
   models/
   ├── coarse_model.pkl (and scaler/pca/le)
   ├── Fruit_model.pkl (and scaler/pca/le)
   ├── Vegetable_model.pkl (and scaler/pca/le)
   └── gas.pkl
   ```
4. **Launch Server**:
   ```bash
   uvicorn main:app --reload
   ```
   *Server will run at `http://localhost:8000`*

### 2. Frontend Setup (Dashboard)
1. **Navigate to root**:
   ```bash
   cd ..
   ```
2. **Install node modules**:
   ```bash
   npm install
   ```
3. **Launch Dev Environment**:
   ```bash
   npm run dev
   ```
   *Dashboard will be available at `http://localhost:3000`*

---

## 🧪 Development & ML Training
If you wish to retrain or update the expert models:
1. Use `grocery_classifier.py` to train the hierarchical system.
2. It will automatically export `.pkl` files to the `models/` directory.
3. The backend will dynamically detect new experts on reload.

---
*Developed for the UCS532P AI Kitchen Project.*

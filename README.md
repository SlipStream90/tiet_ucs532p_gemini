# Gas Leak Detection — HOG + SVM

AI-based kitchen safety system that detects gas leaks using classical computer vision.  
**No deep learning** — only Histogram of Oriented Gradients (HOG) features + Support Vector Machine (SVM).

---

## Project Structure

```
gas-leak-detection/
├── gas_leak_detection_hog.py   # main pipeline
├── model.pkl                   # trained SVM model
├── scaler.pkl                  # fitted StandardScaler
├── model.joblib                # joblib copy (faster load)
├── scaler.joblib
├── dataset/
│   ├── leak/                   # 750 leak images (250 used after balancing)
│   └── no_leak/                # 250 no-leak images
├── results/
│   ├── confusion_matrix.png
│   ├── roc_curve.png
│   ├── hog_visualisation.png
│   └── classification_report.txt
├── requirements.txt
└── README.md
```

---

## Setup

```bash
# 1. Clone the repo
git clone https://github.com/YOUR_USERNAME/gas-leak-detection.git
cd gas-leak-detection

# 2. Install dependencies
pip install -r requirements.txt

# 3. Add your dataset
#    Place 750 leak images   → dataset/leak/
#    Place 250 no-leak images → dataset/no_leak/
```

---

## Usage

### Train the model
```bash
python gas_leak_detection_hog.py
```
Generates `model.pkl`, `scaler.pkl`, and evaluation plots in `results/`.

### Live webcam detection
```bash
python gas_leak_detection_hog.py --webcam

# If camera 0 doesn't work, try camera 1:
python gas_leak_detection_hog.py --webcam --cam 1
```
Press **Q** to quit | Press **S** to save a screenshot.

### Single image prediction
```bash
python gas_leak_detection_hog.py --image path/to/image.jpg
```

---

## How It Works

| Step | What happens |
|------|-------------|
| 1. Balance | Undersample 750 leak → 250 (matches 250 no-leak). Total: 500 images |
| 2. Preprocess | Resize to 128×128, convert to grayscale |
| 3. HOG features | orientations=12, pixels_per_cell=(8,8), cells_per_block=(3,3) |
| 4. Split | 80% train / 20% test, stratified |
| 5. Train | SVM with RBF kernel, C=10, class_weight=balanced |
| 6. Evaluate | Confusion matrix, ROC curve, classification report |

---

## Accuracy

Target accuracy: **85–95%**  
The model uses:
- Tuned HOG parameters (12 orientations, 3×3 blocks)
- SVM C=10 for better fit
- `class_weight="balanced"` to prevent always predicting "leak"
- 5-fold stratified cross-validation

---

## Loading the .pkl model

```python
import pickle
from skimage.feature import hog
import cv2, numpy as np

# Load
with open("model.pkl",  "rb") as f: clf    = pickle.load(f)
with open("scaler.pkl", "rb") as f: scaler = pickle.load(f)

# Predict on a new image
img  = cv2.imread("test.jpg")
img  = cv2.resize(img, (128, 128))
gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
feat = hog(gray, orientations=12, pixels_per_cell=(8,8),
           cells_per_block=(3,3), block_norm="L2-Hys",
           transform_sqrt=True, feature_vector=True)
feat_scaled = scaler.transform(feat.reshape(1, -1))
pred = clf.predict(feat_scaled)[0]
print("LEAK" if pred == 1 else "NO LEAK")
```

---

## Requirements

See `requirements.txt`:
- opencv-python
- scikit-learn
- scikit-image
- numpy
- matplotlib
- joblib

---

## Subject

Computer Vision Project — AI-Based Kitchen Safety System

"""
classifier.py — loads the pre-trained sklearn models and runs inference.
Uses: scaler.pkl → pca.pkl → ensemble.pkl → label_encoder.pkl
"""

import os
import sys

# Force UTF-8 output on Windows
if hasattr(sys.stdout, "reconfigure"):
    try:
        sys.stdout.reconfigure(encoding="utf-8")
        sys.stderr.reconfigure(encoding="utf-8")
    except Exception:
        pass
import numpy as np

import joblib
import cv2
from pathlib import Path

# ── Feature extraction imports (same as grocery_classifier.py) ──────────────
from skimage.feature import hog, local_binary_pattern

# ── Config (mirrors grocery_classifier.py) ──────────────────────────────────
IMAGE_SIZE = (128, 128)

HOG_PARAMS = {
    "orientations": 9,
    "pixels_per_cell": (4, 4),
    "cells_per_block": (2, 2),
    "block_norm": "L2-Hys",
    "visualize": False,
    "channel_axis": None,
}
COLOR_BINS = 64

# ── Gas Configuration ────────────────────────────────────────────────────────
GAS_IMG_SIZE = (128, 128)
HOG_PARAMS_GAS = dict(
    orientations=12,
    pixels_per_cell=(8, 8),
    cells_per_block=(3, 3),
    block_norm="L2-Hys",
    transform_sqrt=True,
    feature_vector=True,
)

# ── Paths ────────────────────────────────────────────────────────────────────
MODELS_DIR = Path(__file__).parent.parent / "models"

# ── Global model state ───────────────────────────────────────────────────────
_coarse: dict = {}
_experts: dict = {}
_gas: dict = {}
_ready: bool = False
_error: str = ""


def is_ready() -> bool:
    return _ready


def get_error() -> str:
    return _error


def load_models():
    """Load all .pkl files from models/ directory at startup."""
    global _coarse, _experts, _gas, _ready, _error

    # --- FIX FOR NUMPY 2.X PICKLES IN NUMPY 1.X ---
    import sys
    import numpy.core.numeric
    import numpy.core.multiarray
    sys.modules['numpy._core'] = sys.modules['numpy.core']
    sys.modules['numpy._core.numeric'] = sys.modules['numpy.core.numeric']
    sys.modules['numpy._core.multiarray'] = sys.modules['numpy.core.multiarray']
    # ---------------------------------------------

    try:
        print(f"[classifier] Loading hierarchical models from {MODELS_DIR} …")

        # 1. Load Coarse Model
        _coarse = {
            "model": joblib.load(MODELS_DIR / "coarse_model.pkl"),
            "scaler": joblib.load(MODELS_DIR / "coarse_scaler.pkl"),
            "pca": joblib.load(MODELS_DIR / "coarse_pca.pkl"),
            "le": joblib.load(MODELS_DIR / "coarse_label_encoder.pkl"),
        }
        # Monkey patch coarse LR if present
        if hasattr(_coarse["model"], "estimators_"):
            for est in _coarse["model"].estimators_:
                if type(est).__name__ == "LogisticRegression" and not hasattr(est, "multi_class"):
                    est.multi_class = "ovr"
        print("[classifier] [OK] Coarse model loaded")

        # 2. Load Experts
        for grp in ["Fruit", "Vegetable"]:
            model_path = MODELS_DIR / f"{grp}_model.pkl"
            if model_path.exists():
                _experts[grp] = {
                    "model": joblib.load(model_path),
                    "scaler": joblib.load(MODELS_DIR / f"{grp}_scaler.pkl"),
                    "pca": joblib.load(MODELS_DIR / f"{grp}_pca.pkl"),
                    "le": joblib.load(MODELS_DIR / f"{grp}_label_encoder.pkl"),
                }
                print(f"[classifier] [OK] Expert '{grp}' loaded")

        # 3. Load Gas
        try:
            _gas = {
                "model": joblib.load(MODELS_DIR / "gas.pkl"),
                "scaler": joblib.load(MODELS_DIR / "scaler_gas.pkl"),
            }
            print("[classifier] [OK] Gas model loaded")
        except Exception as e:
            print(f"[classifier] [WARN] Gas model not loaded: {e}")

        _ready = True
        print("[classifier] [OK] All models ready.")

    except Exception as exc:
        _error = str(exc)
        _ready = False
        print(f"[classifier] [ERR] Failed to load models: {exc}", file=sys.stderr)


# ── Feature extraction (same pipeline as grocery_classifier.py) ─────────────
def _preprocess(img_array: np.ndarray) -> np.ndarray:
    """Resize BGR image to IMAGE_SIZE."""
    return cv2.resize(img_array, IMAGE_SIZE)


def _extract(img: np.ndarray) -> np.ndarray:
    """Extract updated HOG + color histogram + LBP + edge density features."""
    gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY) / 255.0

    hog_feat = hog(gray, **HOG_PARAMS)

    rgb = []
    for i in range(3):
        rgb.extend(cv2.calcHist([img], [i], None, [COLOR_BINS], [0, 256]).flatten())
    rgb = np.array(rgb) / (np.sum(rgb) + 1e-6)

    hsv = cv2.cvtColor(img, cv2.COLOR_BGR2HSV)
    hsv_feat = []
    for i in range(3):
        hsv_feat.extend(cv2.calcHist([hsv], [i], None, [COLOR_BINS], [0, 256]).flatten())
    hsv_feat = np.array(hsv_feat) / (np.sum(hsv_feat) + 1e-6)

    lbp = local_binary_pattern(gray, 8, 1, "uniform")
    lbp_hist, _ = np.histogram(lbp.ravel(), bins=32, range=(0, 256))
    lbp_hist = lbp_hist / (np.sum(lbp_hist) + 1e-6)

    edges = cv2.Canny((gray * 255).astype(np.uint8), 100, 200)
    edge_density = np.sum(edges) / (128 * 128)

    return np.hstack([hog_feat, rgb, hsv_feat, lbp_hist, [edge_density]])


# ── Hierarchical Inference ───────────────────────────────────────────────────
def predict_from_bytes(image_bytes: bytes, top_k: int = 3) -> list[dict]:
    """Accepts raw image bytes, runs hierarchical inference."""
    if not _ready:
        raise RuntimeError("Models are not loaded yet.")

    nparr = np.frombuffer(image_bytes, np.uint8)
    img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
    if img is None:
        raise ValueError("Could not decode image.")

    return predict_from_image(img, top_k=top_k)


def predict_from_image(img: np.ndarray, top_k: int = 3) -> list[dict]:
    """Runs Coarse -> Expert inference pipeline."""
    if not _ready:
        return []

    try:
        # 1. Feature extraction
        img_resized = _preprocess(img)
        feat = _extract(img_resized)

        # 2. Coarse Classification
        xc = _coarse["scaler"].transform([feat])
        xc = _coarse["pca"].transform(xc)
        group_probs = _coarse["model"].predict_proba(xc)[0]
        
        # Get top-2 groups (Fruit, Vegetable)
        top_group_indices = np.argsort(group_probs)[::-1][:2]
        
        all_item_results = []

        # 3. Expert Classification for top groups
        for gid in top_group_indices:
            group_name = _coarse["le"].inverse_transform([gid])[0]
            group_prob = group_probs[gid]

            if group_name in _experts:
                expert = _experts[group_name]
                xe = expert["scaler"].transform([feat])
                xe = expert["pca"].transform(xe)
                
                item_probs = expert["model"].predict_proba(xe)[0]
                le_expert = expert["le"]

                for i, prob in enumerate(item_probs):
                    label = le_expert.inverse_transform([i])[0]
                    # Calculate final probability using hierarchical product
                    final_prob = float(prob * group_prob)
                    all_item_results.append({"label": label, "confidence": final_prob})

        # 4. Sort and return top-K
        all_item_results.sort(key=lambda x: x["confidence"], reverse=True)
        top_results = all_item_results[:top_k]
        
        # Round the confidences for the UI
        for r in top_results:
            r["confidence"] = round(r["confidence"], 4)
            
        return top_results

    except Exception as e:
        print(f"[classifier] Hierarchical inference error: {e}", file=sys.stderr)
        return []


def predict_gas(img: np.ndarray) -> float:
    """Run gas model inference."""
    if not _ready or not _gas:
        return 0.0
        
    try:
        img_resized = cv2.resize(img, GAS_IMG_SIZE)
        gray = cv2.cvtColor(img_resized, cv2.COLOR_BGR2GRAY)
        feat = hog(gray, **HOG_PARAMS_GAS).reshape(1, -1)
        
        feat_s = _gas["scaler"].transform(feat)
        probs = _gas["model"].predict_proba(feat_s)[0]
        
        if len(probs) > 1:
            return float(probs[1])
        return float(probs[0])
    except Exception as e:
        print(f"[classifier] Gas inference error: {e}", file=sys.stderr)
        return 0.0

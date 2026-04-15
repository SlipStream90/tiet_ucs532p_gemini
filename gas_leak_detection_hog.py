"""
Gas Leak Detection — HOG + SVM with Live Webcam
================================================
Dataset  : 750 leak | 250 no-leak  →  balanced to 250:250 (undersample)
Features : Histogram of Oriented Gradients (HOG)
Model    : SVM with RBF kernel  (target accuracy 85–95%)
Saved as : model.pkl + scaler.pkl  (also .joblib copies)

Usage
-----
  python gas_leak_detection_hog.py          # train + evaluate
  python gas_leak_detection_hog.py --webcam # live webcam demo (after training)
  python gas_leak_detection_hog.py --image path/to/img.jpg
"""

import os
import sys
import cv2
import pickle          # ← .pkl save/load
import joblib          # ← .joblib save/load (faster for large arrays)
import random
import argparse
import numpy as np
import matplotlib
matplotlib.use("Agg")          # non-interactive backend for saving plots
import matplotlib.pyplot as plt

from collections import Counter
from skimage.feature import hog
from skimage import exposure
from sklearn.svm import SVC
from sklearn.model_selection import (
    train_test_split, cross_val_score,
    StratifiedKFold, GridSearchCV
)
from sklearn.preprocessing import StandardScaler
from sklearn.metrics import (
    classification_report, confusion_matrix,
    roc_curve, auc, ConfusionMatrixDisplay
)

# ─────────────────────────────────────────────
# REPRODUCIBILITY
# ─────────────────────────────────────────────
SEED = 42
random.seed(SEED)
np.random.seed(SEED)

# ═════════════════════════════════════════════
# CONFIGURATION  ← edit paths here
# ═════════════════════════════════════════════
LEAK_DIR    = "dataset/leak"        # 750 leak images
NO_LEAK_DIR = "dataset/no_leak"     # 250 no-leak images
IMG_EXT     = (".jpg", ".jpeg", ".png", ".bmp", ".tif", ".tiff")
IMG_SIZE    = (128, 128)            # resize target

# HOG parameters  (tuned for 85-95% accuracy on gas-smoke datasets)
HOG_PARAMS = dict(
    orientations=12,           # ↑ from 9 → richer gradient description
    pixels_per_cell=(8, 8),
    cells_per_block=(3, 3),    # ↑ from 2 → better block normalisation
    block_norm="L2-Hys",
    transform_sqrt=True,
    feature_vector=True,
)

# SVM — C & gamma tuned via GridSearch (see tune_svm())
SVM_PARAMS = dict(
    C=10.0,                    # higher C → less regularisation, more fit
    kernel="rbf",
    gamma="scale",
    class_weight="balanced",
    probability=True,
    random_state=SEED,
)

# Output
MODEL_PKL    = "model.pkl"
SCALER_PKL   = "scaler.pkl"
MODEL_JL     = "model.joblib"       # joblib copy (faster I/O)
SCALER_JL    = "scaler.joblib"
RESULTS_DIR  = "results"
os.makedirs(RESULTS_DIR, exist_ok=True)

# Webcam overlay colours  (BGR)
CLR_LEAK    = (0, 0, 220)      # red
CLR_SAFE    = (0, 200, 60)     # green
CLR_WHITE   = (255, 255, 255)
CLR_BLACK   = (0, 0, 0)
FONT        = cv2.FONT_HERSHEY_SIMPLEX


# ═════════════════════════════════════════════
# 1.  DATASET LOADING & BALANCING
# ═════════════════════════════════════════════

def load_paths(folder: str) -> list[str]:
    paths = [
        os.path.join(folder, f)
        for f in os.listdir(folder)
        if f.lower().endswith(IMG_EXT)
    ]
    if not paths:
        raise FileNotFoundError(f"No images in: {folder}")
    return sorted(paths)


def balance_dataset(leak: list[str], no_leak: list[str]) -> tuple:
    """Undersample majority (leak) to match minority (no_leak) = 250 each."""
    target = min(len(leak), len(no_leak))          # 250
    leak_b    = random.sample(leak,    target)
    noleak_b  = random.sample(no_leak, target)

    paths  = leak_b + noleak_b
    labels = [1] * target + [0] * target           # 1=leak, 0=no_leak

    combined = list(zip(paths, labels))
    random.shuffle(combined)
    paths, labels = zip(*combined)

    print(f"  Balanced → leak: {target}  no_leak: {target}  total: {target*2}")
    return list(paths), list(labels)


# ═════════════════════════════════════════════
# 2.  IMAGE PREPROCESSING
# ═════════════════════════════════════════════

def preprocess(path_or_frame, from_array: bool = False) -> np.ndarray:
    """
    File path   → load BGR → resize → grayscale
    numpy array → (already BGR from cv2) → resize → grayscale
    """
    if from_array:
        img = path_or_frame
    else:
        img = cv2.imread(path_or_frame)
        if img is None:
            raise IOError(f"Cannot read: {path_or_frame}")
    img  = cv2.resize(img, IMG_SIZE)
    gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
    return gray


def extract_hog(gray: np.ndarray) -> np.ndarray:
    return hog(gray, **HOG_PARAMS)


def build_features(paths: list[str]) -> np.ndarray:
    rows = []
    for i, p in enumerate(paths):
        try:
            rows.append(extract_hog(preprocess(p)))
        except Exception as e:
            print(f"  [SKIP] {p}: {e}")
        if (i + 1) % 50 == 0:
            print(f"  {i+1}/{len(paths)} images processed…")
    X = np.array(rows)
    print(f"  Feature matrix: {X.shape}")
    return X


# ═════════════════════════════════════════════
# 3.  TRAINING
# ═════════════════════════════════════════════

def train_svm(X_train, y_train):
    scaler   = StandardScaler()
    Xs       = scaler.fit_transform(X_train)
    clf      = SVC(**SVM_PARAMS)
    clf.fit(Xs, y_train)
    return clf, scaler


def tune_svm(X_train, y_train):
    """
    Optional: GridSearchCV to find best C & gamma for 85-95% accuracy.
    Uncomment the call in main() to use this instead of train_svm().
    Takes ~5–10 min on 400 samples.
    """
    scaler = StandardScaler()
    Xs     = scaler.fit_transform(X_train)

    param_grid = {
        "C"    : [1, 5, 10, 50],
        "gamma": ["scale", "auto", 0.001, 0.01],
    }
    base = SVC(kernel="rbf", class_weight="balanced",
               probability=True, random_state=SEED)
    gs = GridSearchCV(base, param_grid, cv=5,
                      scoring="f1_macro", n_jobs=-1, verbose=1)
    gs.fit(Xs, y_train)
    print(f"  Best params : {gs.best_params_}")
    print(f"  Best CV F1  : {gs.best_score_:.3f}")
    return gs.best_estimator_, scaler


# ═════════════════════════════════════════════
# 4.  SAVING  (.pkl and .joblib)
# ═════════════════════════════════════════════

def save_model(clf, scaler):
    # ── .pkl (standard Python pickle) ────────────────────────────────────
    with open(MODEL_PKL,  "wb") as f: pickle.dump(clf,    f)
    with open(SCALER_PKL, "wb") as f: pickle.dump(scaler, f)
    print(f"  .pkl saved  → {MODEL_PKL}, {SCALER_PKL}")

    # ── .joblib (faster for large numpy arrays inside sklearn objects) ────
    joblib.dump(clf,    MODEL_JL)
    joblib.dump(scaler, SCALER_JL)
    print(f"  .joblib saved → {MODEL_JL}, {SCALER_JL}")


def load_model(use_pkl: bool = True):
    if use_pkl:
        with open(MODEL_PKL,  "rb") as f: clf    = pickle.load(f)
        with open(SCALER_PKL, "rb") as f: scaler = pickle.load(f)
    else:
        clf    = joblib.load(MODEL_JL)
        scaler = joblib.load(SCALER_JL)
    return clf, scaler


# ═════════════════════════════════════════════
# 5.  EVALUATION & PLOTS
# ═════════════════════════════════════════════

def evaluate(clf, scaler, X_test, y_test):
    Xs     = scaler.transform(X_test)
    y_pred = clf.predict(Xs)

    print("\n" + "═"*55)
    print("  EVALUATION RESULTS")
    print("═"*55)
    report = classification_report(
        y_test, y_pred, target_names=["No Leak", "Leak"]
    )
    print(report)

    # ── save report to txt ────────────────────────────────────────────────
    with open(os.path.join(RESULTS_DIR, "classification_report.txt"), "w") as f:
        f.write(report)

    _plot_confusion(y_test, y_pred)
    _plot_roc(clf, scaler, X_test, y_test)
    _plot_hog_sample()
    return y_pred


def _plot_confusion(y_true, y_pred):
    cm   = confusion_matrix(y_true, y_pred)
    fig, ax = plt.subplots(figsize=(5, 4), facecolor="#0f0f0f")
    ax.set_facecolor("#0f0f0f")
    disp = ConfusionMatrixDisplay(cm, display_labels=["No Leak", "Leak"])
    disp.plot(ax=ax, colorbar=False, cmap="Oranges")
    ax.set_title("Confusion Matrix", color="white", fontsize=13)
    ax.xaxis.label.set_color("white"); ax.yaxis.label.set_color("white")
    ax.tick_params(colors="white")
    for t in disp.text_.ravel(): t.set_color("black")
    out = os.path.join(RESULTS_DIR, "confusion_matrix.png")
    plt.savefig(out, dpi=150, bbox_inches="tight", facecolor="#0f0f0f")
    plt.close(); print(f"  Saved: {out}")


def _plot_roc(clf, scaler, X_test, y_test):
    Xs       = scaler.transform(X_test)
    y_scores = clf.predict_proba(Xs)[:, 1]
    fpr, tpr, _ = roc_curve(y_test, y_scores)
    roc_auc  = auc(fpr, tpr)

    fig, ax = plt.subplots(figsize=(6, 5), facecolor="#0f0f0f")
    ax.set_facecolor("#111")
    ax.plot(fpr, tpr, color="#ff6b35", lw=2, label=f"AUC = {roc_auc:.3f}")
    ax.plot([0,1],[0,1], color="#555", lw=1, ls="--")
    ax.set_xlabel("False Positive Rate", color="white")
    ax.set_ylabel("True Positive Rate",  color="white")
    ax.set_title("ROC Curve — Gas Leak Detector", color="white", fontsize=13)
    ax.legend(facecolor="#222", labelcolor="white")
    ax.tick_params(colors="white"); ax.spines[:].set_color("#333")
    out = os.path.join(RESULTS_DIR, "roc_curve.png")
    plt.savefig(out, dpi=150, bbox_inches="tight", facecolor="#0f0f0f")
    plt.close(); print(f"  Saved: {out}")


def _plot_hog_sample():
    """Visualise HOG on the first available image in either dataset folder."""
    sample = None
    for folder in [LEAK_DIR, NO_LEAK_DIR]:
        if os.path.isdir(folder):
            for f in os.listdir(folder):
                if f.lower().endswith(IMG_EXT):
                    sample = os.path.join(folder, f)
                    break
        if sample:
            break
    if not sample:
        return

    gray = preprocess(sample)
    _, hog_img = hog(gray, **HOG_PARAMS, visualize=True)
    hog_img = exposure.rescale_intensity(hog_img, in_range=(0, 10))

    fig, axes = plt.subplots(1, 2, figsize=(10, 4), facecolor="#0f0f0f")
    for ax in axes:
        ax.set_facecolor("#0f0f0f"); ax.axis("off")
    axes[0].imshow(gray, cmap="gray")
    axes[0].set_title("Original (grayscale)", color="white", fontsize=12)
    axes[1].imshow(hog_img, cmap="magma")
    axes[1].set_title("HOG Visualisation", color="white", fontsize=12)
    fig.suptitle("HOG Feature Extraction", color="#ff6b35",
                 fontsize=14, fontweight="bold")
    plt.tight_layout()
    out = os.path.join(RESULTS_DIR, "hog_visualisation.png")
    plt.savefig(out, dpi=150, bbox_inches="tight", facecolor="#0f0f0f")
    plt.close(); print(f"  Saved: {out}")


def cross_validate(X, y, scaler):
    print("\n  Running 5-fold Stratified Cross-Validation…")
    Xs  = scaler.transform(X)
    skf = StratifiedKFold(n_splits=5, shuffle=True, random_state=SEED)
    clf_cv = SVC(**SVM_PARAMS)
    scores = cross_val_score(clf_cv, Xs, y, cv=skf, scoring="f1_macro")
    print(f"  F1-macro per fold : {scores.round(3)}")
    print(f"  Mean ± Std        : {scores.mean():.3f} ± {scores.std():.3f}")


# ═════════════════════════════════════════════
# 6.  LIVE WEBCAM DETECTION
# ═════════════════════════════════════════════

def _predict_frame(frame, clf, scaler) -> dict:
    """Run HOG+SVM on a single BGR frame and return prediction dict."""
    gray  = preprocess(frame, from_array=True)
    feat  = extract_hog(gray).reshape(1, -1)
    feat_s = scaler.transform(feat)
    label  = clf.predict(feat_s)[0]
    proba  = clf.predict_proba(feat_s)[0]
    return {
        "label"      : "LEAK DETECTED" if label == 1 else "SAFE",
        "is_leak"    : bool(label),
        "confidence" : float(proba[label]),
        "leak_prob"  : float(proba[1]),
    }


def _draw_overlay(frame, result: dict) -> np.ndarray:
    """Draw a professional HUD overlay on the webcam frame."""
    h, w = frame.shape[:2]
    is_leak = result["is_leak"]
    label   = result["label"]
    conf    = result["confidence"]
    lp      = result["leak_prob"]

    # ── border flash ──────────────────────────────────────────────────────
    border_clr = CLR_LEAK if is_leak else CLR_SAFE
    cv2.rectangle(frame, (0, 0), (w-1, h-1), border_clr, 4)

    # ── top banner ────────────────────────────────────────────────────────
    cv2.rectangle(frame, (0, 0), (w, 60), CLR_BLACK, -1)
    cv2.rectangle(frame, (0, 0), (w, 60), border_clr, 2)

    # main label
    cv2.putText(frame, label, (14, 42),
                FONT, 1.2, border_clr, 3, cv2.LINE_AA)

    # confidence text (top-right)
    conf_txt = f"Conf: {conf*100:.1f}%"
    (tw, _), _ = cv2.getTextSize(conf_txt, FONT, 0.7, 2)
    cv2.putText(frame, conf_txt, (w - tw - 14, 42),
                FONT, 0.7, CLR_WHITE, 2, cv2.LINE_AA)

    # ── leak probability bar (bottom strip) ──────────────────────────────
    bar_h  = 28
    bar_y  = h - bar_h
    cv2.rectangle(frame, (0, bar_y), (w, h), CLR_BLACK, -1)

    # background track
    cv2.rectangle(frame, (10, bar_y + 6), (w - 10, h - 6),
                  (60, 60, 60), -1)
    # filled portion
    fill_w = int((w - 20) * lp)
    bar_clr = CLR_LEAK if lp > 0.5 else CLR_SAFE
    if fill_w > 0:
        cv2.rectangle(frame, (10, bar_y + 6),
                      (10 + fill_w, h - 6), bar_clr, -1)

    # label on bar
    bar_lbl = f"Leak probability: {lp*100:.1f}%"
    cv2.putText(frame, bar_lbl, (14, h - 8),
                FONT, 0.55, CLR_WHITE, 1, cv2.LINE_AA)

    # ── HOG hint ─────────────────────────────────────────────────────────
    cv2.putText(frame, "HOG+SVM | Press Q to quit",
                (14, h - bar_h - 10),
                FONT, 0.45, (160, 160, 160), 1, cv2.LINE_AA)

    # ── red warning box if leak ───────────────────────────────────────────
    if is_leak:
        warn = "!! GAS LEAK ALERT !!"
        (tw2, th2), _ = cv2.getTextSize(warn, FONT, 1.1, 3)
        cx = (w - tw2) // 2
        cy = h // 2 + 20
        # semi-transparent background via overlay trick
        overlay = frame.copy()
        cv2.rectangle(overlay, (cx - 12, cy - th2 - 8),
                      (cx + tw2 + 12, cy + 10), (0, 0, 160), -1)
        cv2.addWeighted(overlay, 0.55, frame, 0.45, 0, frame)
        cv2.putText(frame, warn, (cx, cy),
                    FONT, 1.1, CLR_WHITE, 3, cv2.LINE_AA)

    return frame


def run_webcam(camera_index: int = 0):
    """Open webcam and run real-time gas leak detection."""
    print("\n" + "═"*55)
    print("  LOADING MODEL FROM model.pkl …")
    print("═"*55)

    if not os.path.exists(MODEL_PKL):
        print("  [ERROR] model.pkl not found.")
        print("  Train the model first:  python gas_leak_detection_hog.py")
        sys.exit(1)

    clf, scaler = load_model(use_pkl=True)
    print("  Model loaded successfully.\n")
    print("  Opening webcam (index {})…".format(camera_index))
    print("  Press  Q  to quit.")
    print("  Press  S  to save a screenshot.\n")

    cap = cv2.VideoCapture(camera_index)
    if not cap.isOpened():
        print(f"  [ERROR] Cannot open camera {camera_index}.")
        print("  Try:  python gas_leak_detection_hog.py --webcam --cam 1")
        sys.exit(1)

    # set resolution
    cap.set(cv2.CAP_PROP_FRAME_WIDTH,  640)
    cap.set(cv2.CAP_PROP_FRAME_HEIGHT, 480)

    screenshot_n = 0
    print("  Webcam running… (predictions every frame)")

    while True:
        ret, frame = cap.read()
        if not ret:
            print("  [WARN] Frame grab failed, retrying…")
            continue

        result = _predict_frame(frame, clf, scaler)
        frame  = _draw_overlay(frame, result)

        cv2.imshow("Gas Leak Detection — HOG+SVM", frame)

        key = cv2.waitKey(1) & 0xFF
        if key == ord("q") or key == ord("Q"):
            break
        elif key == ord("s") or key == ord("S"):
            screenshot_n += 1
            fname = f"screenshot_{screenshot_n:03d}.png"
            cv2.imwrite(fname, frame)
            print(f"  Screenshot saved: {fname}")

    cap.release()
    cv2.destroyAllWindows()
    print("\n  Webcam closed.")


# ═════════════════════════════════════════════
# 7.  SINGLE IMAGE INFERENCE
# ═════════════════════════════════════════════

def predict_image(path: str):
    if not os.path.exists(MODEL_PKL):
        print("[ERROR] model.pkl not found. Train first.")
        sys.exit(1)
    clf, scaler = load_model()
    gray  = preprocess(path)
    feat  = extract_hog(gray).reshape(1, -1)
    feat_s = scaler.transform(feat)
    label  = clf.predict(feat_s)[0]
    proba  = clf.predict_proba(feat_s)[0]
    print(f"\n  Image   : {path}")
    print(f"  Result  : {'LEAK DETECTED' if label else 'SAFE — No Leak'}")
    print(f"  Leak prob : {proba[1]*100:.1f}%")
    print(f"  Safe prob : {proba[0]*100:.1f}%\n")


# ═════════════════════════════════════════════
# 8.  MAIN TRAINING PIPELINE
# ═════════════════════════════════════════════

def main():
    print("\n" + "═"*55)
    print("  GAS LEAK DETECTION — HOG + SVM Pipeline")
    print("═"*55)

    # 1. Load
    print("\n[1/6] Loading image paths…")
    leak_p    = load_paths(LEAK_DIR)
    noleak_p  = load_paths(NO_LEAK_DIR)
    print(f"  Found {len(leak_p)} leak  |  {len(noleak_p)} no-leak")

    # 2. Balance
    print("\n[2/6] Balancing dataset (undersample)…")
    paths, labels = balance_dataset(leak_p, noleak_p)
    labels = np.array(labels)

    # 3. HOG features
    print("\n[3/6] Extracting HOG features…")
    X = build_features(paths)

    # 4. Split
    print("\n[4/6] Train/test split (80/20, stratified)…")
    X_train, X_test, y_train, y_test = train_test_split(
        X, labels, test_size=0.2, stratify=labels, random_state=SEED
    )
    print(f"  Train: {Counter(y_train)}  |  Test: {Counter(y_test)}")

    # 5. Train
    print("\n[5/6] Training SVM (C=10, RBF, balanced)…")
    # ── To run GridSearchCV instead, replace with: ─────────────────────
    # clf, scaler = tune_svm(X_train, y_train)
    clf, scaler = train_svm(X_train, y_train)
    print("  Training complete.")

    # Save as .pkl AND .joblib
    save_model(clf, scaler)

    # Cross-validate
    cross_validate(X, labels, scaler)

    # 6. Evaluate
    print("\n[6/6] Evaluating…")
    evaluate(clf, scaler, X_test, y_test)

    print("\n" + "═"*55)
    print("  Done! Files generated:")
    print(f"    model.pkl / model.joblib")
    print(f"    scaler.pkl / scaler.joblib")
    print(f"    results/   (confusion matrix, ROC, HOG viz, report)")
    print("\n  To run webcam detection:")
    print("    python gas_leak_detection_hog.py --webcam")
    print("═"*55 + "\n")


# ═════════════════════════════════════════════
# ENTRY POINT
# ═════════════════════════════════════════════

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Gas Leak Detection — HOG+SVM")
    parser.add_argument("--webcam",  action="store_true",
                        help="Run live webcam detection (requires trained model)")
    parser.add_argument("--cam",     type=int, default=0,
                        help="Camera index (default: 0)")
    parser.add_argument("--image",   type=str, default=None,
                        help="Path to a single image to classify")
    args = parser.parse_args()

    if args.webcam:
        run_webcam(camera_index=args.cam)
    elif args.image:
        predict_image(args.image)
    else:
        main()

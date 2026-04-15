import os
import numpy as np
import cv2
import shutil
import joblib
from skimage.feature import hog, local_binary_pattern
from sklearn.svm import SVC
from sklearn.ensemble import RandomForestClassifier, VotingClassifier
from sklearn.linear_model import LogisticRegression
from sklearn.preprocessing import LabelEncoder, RobustScaler
from sklearn.decomposition import PCA
from sklearn.calibration import CalibratedClassifierCV

# ─────────────────────────────────────────────
# CONFIG
# ─────────────────────────────────────────────

TRAIN_DIR = "train"
VAL_DIR   = "val"
TEST_DIR  = "test"
MODEL_DIR = "models"
BACKUP_DIR = "backup"

IMAGE_SIZE = (128,128)
TOP_K_CLASSES = 20
DRY_RUN = False   # ⚠️ set False to move/delete data

os.makedirs(MODEL_DIR, exist_ok=True)

# ─────────────────────────────────────────────
# CLASS GROUPING (ONLY EASY CLASSES)
# ─────────────────────────────────────────────

CLASS_TO_GROUP = {
    # Fruits
    "Apple":"Fruit","Banana":"Fruit","Mango":"Fruit","Orange":"Fruit",
    "Pear":"Fruit","Peach":"Fruit","Plum":"Fruit","Kiwi":"Fruit",
    "Lemon":"Fruit","Lime":"Fruit","Papaya":"Fruit","Pineapple":"Fruit",
    "Passion-Fruit":"Fruit","Pomegranate":"Fruit","Melon":"Fruit",
    "Nectarine":"Fruit","Satsumas":"Fruit","Red-Grapefruit":"Fruit",

    # Vegetables
    "Tomato":"Vegetable","Onion":"Vegetable","Potato":"Vegetable",
    "Carrots":"Vegetable","Cabbage":"Vegetable","Cucumber":"Vegetable",
    "Pepper":"Vegetable","Zucchini":"Vegetable","Aubergine":"Vegetable",
    "Leek":"Vegetable","Garlic":"Vegetable","Ginger":"Vegetable",
    "Asparagus":"Vegetable","Red-Beet":"Vegetable",
}

def filter_easy_classes(classes):
    return [c for c in classes if CLASS_TO_GROUP.get(c) in ["Fruit","Vegetable"]]

# ─────────────────────────────────────────────
# FEATURE CONFIG
# ─────────────────────────────────────────────

HOG_PARAMS = {
    "orientations": 9,
    "pixels_per_cell": (4,4),
    "cells_per_block": (2,2),
    "block_norm": "L2-Hys",
    "visualize": False,
    "channel_axis": None,
}

COLOR_BINS = 64

# ─────────────────────────────────────────────
# AUGMENTATION
# ─────────────────────────────────────────────

def augment(img):
    if np.random.rand() < 0.5:
        img = cv2.flip(img, 1)

    if np.random.rand() < 0.3:
        angle = np.random.randint(-15,15)
        M = cv2.getRotationMatrix2D((64,64), angle, 1)
        img = cv2.warpAffine(img, M, (128,128))

    return img

# ─────────────────────────────────────────────
# FEATURE EXTRACTION
# ─────────────────────────────────────────────

def preprocess(path):
    return cv2.resize(cv2.imread(path), IMAGE_SIZE)

def extract(img):
    gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)/255.0

    hog_feat = hog(gray, **HOG_PARAMS)

    rgb=[]
    for i in range(3):
        rgb.extend(cv2.calcHist([img],[i],None,[COLOR_BINS],[0,256]).flatten())
    rgb=np.array(rgb)/(np.sum(rgb)+1e-6)

    hsv=cv2.cvtColor(img, cv2.COLOR_BGR2HSV)
    hsv_feat=[]
    for i in range(3):
        hsv_feat.extend(cv2.calcHist([hsv],[i],None,[COLOR_BINS],[0,256]).flatten())
    hsv_feat=np.array(hsv_feat)/(np.sum(hsv_feat)+1e-6)

    lbp=local_binary_pattern(gray,8,1,"uniform")
    lbp_hist,_=np.histogram(lbp.ravel(),bins=32,range=(0,256))
    lbp_hist=lbp_hist/(np.sum(lbp_hist)+1e-6)

    edges=cv2.Canny((gray*255).astype(np.uint8),100,200)
    edge_density=np.sum(edges)/(128*128)

    return np.hstack([hog_feat,rgb,hsv_feat,lbp_hist,[edge_density]])

# ─────────────────────────────────────────────
# DATA UTILS
# ─────────────────────────────────────────────

def get_top_classes(train_dir,k=20):
    counts={}
    for cls in os.listdir(train_dir):
        p=os.path.join(train_dir,cls)
        if not os.path.isdir(p): continue
        counts[cls]=len(os.listdir(p))
    sorted_cls=sorted(counts.items(),key=lambda x:x[1],reverse=True)
    return [c for c,_ in sorted_cls[:k]]

def clean_dataset(top_classes):
    os.makedirs(BACKUP_DIR, exist_ok=True)

    for split in [TRAIN_DIR,VAL_DIR,TEST_DIR]:
        for cls in os.listdir(split):
            p=os.path.join(split,cls)
            if cls not in top_classes:
                if DRY_RUN:
                    print("Would move:",p)
                else:
                    shutil.move(p, os.path.join(BACKUP_DIR, cls))

def load_data(path,allowed,augment_data=False):
    X,y=[],[]
    for cls in os.listdir(path):
        if cls not in allowed: continue
        d=os.path.join(path,cls)

        for img in os.listdir(d):
            try:
                image=preprocess(os.path.join(d,img))
                if augment_data:
                    image=augment(image)

                X.append(extract(image))
                y.append(cls)
            except:
                pass

    return np.array(X),np.array(y)

def load_coarse(path,allowed):
    X,y=[],[]
    for cls in os.listdir(path):
        if cls not in allowed: continue
        grp=CLASS_TO_GROUP.get(cls)
        d=os.path.join(path,cls)

        for img in os.listdir(d):
            try:
                X.append(extract(preprocess(os.path.join(d,img))))
                y.append(grp)
            except:
                pass

    return np.array(X),np.array(y)

# ─────────────────────────────────────────────
# MODEL
# ─────────────────────────────────────────────

def build_model():
    base = VotingClassifier([
        ("svm",SVC(C=20,probability=True,class_weight="balanced")),
        ("rf",RandomForestClassifier(n_estimators=400,class_weight="balanced")),
        ("lr",LogisticRegression(max_iter=1500,class_weight="balanced"))
    ], voting="soft")

    return CalibratedClassifierCV(base, method="sigmoid", cv=3)

# ─────────────────────────────────────────────
# TRAIN
# ─────────────────────────────────────────────

def train():

    top_classes = get_top_classes(TRAIN_DIR, TOP_K_CLASSES)
    top_classes = filter_easy_classes(top_classes)

    print("\nFinal classes:", top_classes)

    clean_dataset(top_classes)

    # COARSE
    Xc,yc = load_coarse(TRAIN_DIR,top_classes)

    le_c=LabelEncoder()
    yc=le_c.fit_transform(yc)

    sc_c=RobustScaler()
    Xc=sc_c.fit_transform(Xc)

    pca_c=PCA(0.95)
    Xc=pca_c.fit_transform(Xc)

    coarse=build_model()
    coarse.fit(Xc,yc)

    # EXPERTS
    experts={}

    for grp in ["Fruit","Vegetable"]:
        group_classes=[c for c in top_classes if CLASS_TO_GROUP[c]==grp]

        if len(group_classes)==0:
            continue

        X,y=load_data(TRAIN_DIR,set(group_classes),augment_data=True)

        le=LabelEncoder()
        y=le.fit_transform(y)

        sc=RobustScaler()
        X=sc.fit_transform(X)

        pca=PCA(0.95)
        X=pca.fit_transform(X)

        model=build_model()
        model.fit(X,y)

        experts[grp]={
            "model":model,
            "scaler":sc,
            "pca":pca,
            "le":le
        }

    # SAVE MODELS
    joblib.dump(coarse, f"{MODEL_DIR}/coarse_model.pkl")
    joblib.dump(sc_c, f"{MODEL_DIR}/coarse_scaler.pkl")
    joblib.dump(pca_c, f"{MODEL_DIR}/coarse_pca.pkl")
    joblib.dump(le_c, f"{MODEL_DIR}/coarse_label_encoder.pkl")

    for grp, ex in experts.items():
        joblib.dump(ex["model"], f"{MODEL_DIR}/{grp}_model.pkl")
        joblib.dump(ex["scaler"], f"{MODEL_DIR}/{grp}_scaler.pkl")
        joblib.dump(ex["pca"], f"{MODEL_DIR}/{grp}_pca.pkl")
        joblib.dump(ex["le"], f"{MODEL_DIR}/{grp}_label_encoder.pkl")

    print("\nModels saved!")

    return coarse,sc_c,pca_c,le_c,experts

# ─────────────────────────────────────────────
# LOAD MODELS
# ─────────────────────────────────────────────

def load_models():

    coarse = joblib.load(f"{MODEL_DIR}/coarse_model.pkl")
    sc_c   = joblib.load(f"{MODEL_DIR}/coarse_scaler.pkl")
    pca_c  = joblib.load(f"{MODEL_DIR}/coarse_pca.pkl")
    le_c   = joblib.load(f"{MODEL_DIR}/coarse_label_encoder.pkl")

    experts={}

    for grp in ["Fruit","Vegetable"]:
        try:
            experts[grp]={
                "model":joblib.load(f"{MODEL_DIR}/{grp}_model.pkl"),
                "scaler":joblib.load(f"{MODEL_DIR}/{grp}_scaler.pkl"),
                "pca":joblib.load(f"{MODEL_DIR}/{grp}_pca.pkl"),
                "le":joblib.load(f"{MODEL_DIR}/{grp}_label_encoder.pkl")
            }
        except:
            pass

    return coarse,sc_c,pca_c,le_c,experts

# ─────────────────────────────────────────────
# PREDICT
# ─────────────────────────────────────────────

def predict(path,coarse,sc_c,pca_c,le_c,experts,k=3):

    feat=extract(preprocess(path))

    x=sc_c.transform([feat])
    x=pca_c.transform(x)

    group_probs=coarse.predict_proba(x)[0]
    top_groups=np.argsort(group_probs)[::-1][:2]

    results=[]

    for gid in top_groups:
        grp=le_c.inverse_transform([gid])[0]

        if grp not in experts:
            continue

        expert=experts[grp]

        x2=expert["scaler"].transform([feat])
        x2=expert["pca"].transform(x2)

        probs=expert["model"].predict_proba(x2)[0]

        for i,p in enumerate(probs):
            label=expert["le"].inverse_transform([i])[0]
            results.append((label,p*group_probs[gid]))

    results.sort(key=lambda x:x[1],reverse=True)

    top=results[:k]
    total=sum(p for _,p in top)

    return top,total

# ─────────────────────────────────────────────
# MAIN
# ─────────────────────────────────────────────

if __name__=="__main__":

    # Train once
    coarse,sc_c,pca_c,le_c,experts=train()

    # OR load models
    # coarse,sc_c,pca_c,le_c,experts = load_models()

    sample_class=os.listdir(TEST_DIR)[0]
    sample_img=os.listdir(os.path.join(TEST_DIR,sample_class))[0]
    path=os.path.join(TEST_DIR,sample_class,sample_img)

    top3,total=predict(path,coarse,sc_c,pca_c,le_c,experts)

    print("\nTop-3 Predictions:")
    for i,(l,p) in enumerate(top3,1):
        print(f"{i}. {l} ({p:.3f})")

    print(f"\nSum of Top-3 probabilities: {total:.3f}")
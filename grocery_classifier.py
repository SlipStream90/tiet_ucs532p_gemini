import os
import numpy as np
import cv2
from skimage.feature import hog, local_binary_pattern
from sklearn.svm import SVC
from sklearn.ensemble import RandomForestClassifier, VotingClassifier
from sklearn.linear_model import LogisticRegression
from sklearn.preprocessing import LabelEncoder, RobustScaler
from sklearn.decomposition import PCA

# ─────────────────────────────────────────────
# CONFIG
# ─────────────────────────────────────────────

TRAIN_DIR = "train"
VAL_DIR   = "val"
TEST_DIR  = "test"

IMAGE_SIZE = (128,128)
TOP_K_CLASSES = 20

# ─────────────────────────────────────────────
# CLASS → GROUP MAPPING
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

    # Dairy
    "Milk":"Dairy","Oat-Milk":"Dairy","Soy-Milk":"Dairy","Sour-Milk":"Dairy",
    "Yoghurt":"Dairy","Oatghurt":"Dairy","Soyghurt":"Dairy",
    "Sour-Cream":"Dairy","Juice":"Dairy",

    # Others
    "Mushroom":"Other","Brown-Cap-Mushroom":"Other","Avocado":"Other"
}

# ─────────────────────────────────────────────
# FEATURE CONFIG
# ─────────────────────────────────────────────

HOG_PARAMS = {
    "orientations": 9,
    "pixels_per_cell": (8,8),
    "cells_per_block": (2,2),
    "block_norm": "L2-Hys",
    "visualize": False,
    "channel_axis": None,
}

LBP_RADIUS = 1
LBP_POINTS = 8

# ─────────────────────────────────────────────
# GET TOP CLASSES
# ─────────────────────────────────────────────

def get_top_classes(train_dir,k=20):
    counts={}
    for cls in os.listdir(train_dir):
        p=os.path.join(train_dir,cls)
        if not os.path.isdir(p): continue
        counts[cls]=len(os.listdir(p))
    sorted_cls=sorted(counts.items(),key=lambda x:x[1],reverse=True)
    return [c for c,_ in sorted_cls[:k]]

# ─────────────────────────────────────────────
# PREPROCESS + FEATURES
# ─────────────────────────────────────────────

def preprocess(path):
    return cv2.resize(cv2.imread(path),IMAGE_SIZE)

def extract(img):
    gray=cv2.cvtColor(img,cv2.COLOR_BGR2GRAY)/255.0
    hog_feat=hog(gray,**HOG_PARAMS)

    rgb=[]
    for i in range(3):
        rgb.extend(cv2.calcHist([img],[i],None,[32],[0,256]).flatten())
    rgb=np.array(rgb)/(np.sum(rgb)+1e-6)

    hsv=cv2.cvtColor(img,cv2.COLOR_BGR2HSV)
    hsv_feat=[]
    for i in range(3):
        hsv_feat.extend(cv2.calcHist([hsv],[i],None,[32],[0,256]).flatten())
    hsv_feat=np.array(hsv_feat)/(np.sum(hsv_feat)+1e-6)

    lbp=local_binary_pattern(gray,LBP_POINTS,LBP_RADIUS,"uniform")
    lbp_hist,_=np.histogram(lbp.ravel(),bins=32,range=(0,256))
    lbp_hist=lbp_hist/(np.sum(lbp_hist)+1e-6)

    edges=cv2.Canny((gray*255).astype(np.uint8),100,200)
    edge_density=np.sum(edges)/(128*128)

    return np.hstack([hog_feat,rgb,hsv_feat,lbp_hist,[edge_density]])

# ─────────────────────────────────────────────
# LOAD DATA
# ─────────────────────────────────────────────

def load_data(path,allowed):
    X,y=[],[]
    for cls in os.listdir(path):
        if cls not in allowed: continue
        d=os.path.join(path,cls)
        for img in os.listdir(d):
            try:
                X.append(extract(preprocess(os.path.join(d,img))))
                y.append(cls)
            except:
                pass
    return np.array(X),np.array(y)

def load_coarse_data(path,allowed):
    X,y=[],[]
    for cls in os.listdir(path):
        if cls not in allowed: continue
        group=CLASS_TO_GROUP.get(cls,"Other")
        d=os.path.join(path,cls)
        for img in os.listdir(d):
            try:
                X.append(extract(preprocess(os.path.join(d,img))))
                y.append(group)
            except:
                pass
    return np.array(X),np.array(y)

# ─────────────────────────────────────────────
# MODEL
# ─────────────────────────────────────────────

def build_model():
    return VotingClassifier([
        ("svm",SVC(C=20,probability=True,class_weight="balanced")),
        ("rf",RandomForestClassifier(n_estimators=300,class_weight="balanced")),
        ("lr",LogisticRegression(max_iter=1000,class_weight="balanced"))
    ],voting="soft")

# ─────────────────────────────────────────────
# CREATE GROUPS
# ─────────────────────────────────────────────

def create_groups(classes):
    groups={}
    for cls in classes:
        grp=CLASS_TO_GROUP.get(cls,"Other")
        if grp not in groups:
            groups[grp]=[]
        groups[grp].append(cls)
    return list(groups.values())

# ─────────────────────────────────────────────
# TRAIN SYSTEM
# ─────────────────────────────────────────────

def train_system():

    top_classes = get_top_classes(TRAIN_DIR,TOP_K_CLASSES)
    groups = create_groups(top_classes)

    print("\nGroups:",groups)

    # COARSE
    Xc_train,yc_train = load_coarse_data(TRAIN_DIR,top_classes)
    Xc_val,yc_val     = load_coarse_data(VAL_DIR,top_classes)

    le_coarse=LabelEncoder()
    yc_train=le_coarse.fit_transform(yc_train)
    yc_val=le_coarse.transform(yc_val)

    scaler_c=RobustScaler()
    Xc_train=scaler_c.fit_transform(Xc_train)
    Xc_val=scaler_c.transform(Xc_val)

    pca_c=PCA(0.95)
    Xc_train=pca_c.fit_transform(Xc_train)
    Xc_val=pca_c.transform(Xc_val)

    coarse_model=build_model()
    coarse_model.fit(Xc_train,yc_train)

    # EXPERTS
    experts=[]

    for group in groups:
        print(f"\nTraining Expert for {group[0]} group")

        X_tr,y_tr=load_data(TRAIN_DIR,set(group))
        X_val,y_val=load_data(VAL_DIR,set(group))

        le=LabelEncoder()
        y_tr=le.fit_transform(y_tr)
        y_val=le.transform(y_val)

        scaler=RobustScaler()
        X_tr=scaler.fit_transform(X_tr)
        X_val=scaler.transform(X_val)

        pca=PCA(0.95)
        X_tr=pca.fit_transform(X_tr)
        X_val=pca.transform(X_val)

        model=build_model()
        model.fit(X_tr,y_tr)

        experts.append({
            "model":model,
            "scaler":scaler,
            "pca":pca,
            "le":le,
            "group":CLASS_TO_GROUP[group[0]]
        })

    return coarse_model,scaler_c,pca_c,le_coarse,experts

# ─────────────────────────────────────────────
# INFERENCE
# ─────────────────────────────────────────────

def predict(path,coarse,sc_c,pca_c,le_c,experts,k=3):

    feat=extract(preprocess(path))

    x=sc_c.transform([feat])
    x=pca_c.transform(x)

    group_probs=coarse.predict_proba(x)[0]
    gid=np.argmax(group_probs)
    group=le_c.inverse_transform([gid])[0]

    # select expert
    expert=None
    for ex in experts:
        if ex["group"]==group:
            expert=ex
            break

    x=expert["scaler"].transform([feat])
    x=expert["pca"].transform(x)

    probs=expert["model"].predict_proba(x)[0]

    idx=np.argsort(probs)[::-1][:k]

    results=[]
    total=0

    for i in idx:
        label=expert["le"].inverse_transform([i])[0]
        p=probs[i]*group_probs[gid]
        total+=p
        results.append((label,float(p)))

    return results,total

# ─────────────────────────────────────────────
# MAIN
# ─────────────────────────────────────────────

if __name__=="__main__":

    coarse,sc_c,pca_c,le_c,experts = train_system()

    sample_class=os.listdir(TEST_DIR)[0]
    sample_img=os.listdir(os.path.join(TEST_DIR,sample_class))[0]
    path=os.path.join(TEST_DIR,sample_class,sample_img)

    top3,total=predict(path,coarse,sc_c,pca_c,le_c,experts)

    print("\nTop-3 Predictions:")
    for i,(l,p) in enumerate(top3,1):
        print(f"{i}. {l} ({p:.3f})")

    print(f"\nSum of Top-3 probabilities: {total:.3f}")
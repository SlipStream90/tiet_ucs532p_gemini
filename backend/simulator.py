"""
simulator.py — generates realistic mock safety detection data for the dashboard.
Detects: human, stove/flame, knife, gas_leak, fire, food items.
Rotates through safe → warning → hazard scenarios with realistic timing.
"""

import random
import time
import threading
import cv2
import numpy as np
from typing import Optional

# ── Detection class definitions ──────────────────────────────────────────────
DETECTION_CLASSES = {
    "human":    {"color": "green",  "icon": "👤", "safe": True},
    "stove":    {"color": "yellow", "icon": "🔥", "safe": False},
    "knife":    {"color": "yellow", "icon": "🔪", "safe": False},
    "fire":     {"color": "red",    "icon": "🚨", "safe": False},
    "gas_leak": {"color": "red",    "icon": "💨", "safe": False},
    "food":     {"color": "green",  "icon": "🥦", "safe": True},
}

FOOD_ITEMS = [
    "Apple", "Banana", "Tomato", "Egg", "Milk",
    "Carrot", "Potato", "Onion", "Yoghurt", "Cucumber"
]

# ── Scenario definitions ──────────────────────────────────────────────────────
SCENARIOS = [
    # (name, state, detections_template, interaction, risk_duration)
    {
        "name": "normal_cooking",
        "state": "safe",
        "detections": [
            {"label": "human",  "confidence": 0.94, "bbox": [120, 80,  200, 350]},
            {"label": "stove",  "confidence": 0.87, "bbox": [300, 200, 120, 100]},
            {"label": "food",   "confidence": 0.79, "bbox": [200, 300, 80,  60]},
        ],
        "interaction": {"type": "human_near_stove", "distance": 65, "risk_level": "low"},
        "duration": 0.0,
    },
    {
        "name": "knife_proximity",
        "state": "warning",
        "detections": [
            {"label": "human",  "confidence": 0.91, "bbox": [100, 60,  200, 370]},
            {"label": "knife",  "confidence": 0.83, "bbox": [180, 290, 60,  40]},
            {"label": "food",   "confidence": 0.72, "bbox": [240, 310, 80,  55]},
        ],
        "interaction": {"type": "human_near_knife", "distance": 32, "risk_level": "medium"},
        "duration": 2.1,
    },
    {
        "name": "gas_leak_detected",
        "state": "hazard",
        "detections": [
            {"label": "gas_leak", "confidence": 0.96, "bbox": [60,  50,  180, 160]},
            {"label": "stove",    "confidence": 0.88, "bbox": [280, 190, 130, 110]},
        ],
        "interaction": {"type": "gas_near_flame", "distance": 18, "risk_level": "high"},
        "duration": 5.8,
    },
    {
        "name": "unattended_fire",
        "state": "hazard",
        "detections": [
            {"label": "fire",  "confidence": 0.97, "bbox": [290, 185, 140, 120]},
            {"label": "stove", "confidence": 0.85, "bbox": [280, 190, 130, 110]},
        ],
        "interaction": {"type": "unattended_fire", "distance": 0, "risk_level": "critical"},
        "duration": 7.2,
    },
    {
        "name": "safe_grocery",
        "state": "safe",
        "detections": [
            {"label": "human",  "confidence": 0.93, "bbox": [110, 70, 200, 360]},
            {"label": "food",   "confidence": 0.81, "bbox": [220, 290, 90, 65]},
            {"label": "food",   "confidence": 0.74, "bbox": [310, 300, 75, 55]},
        ],
        "interaction": {"type": "none", "distance": 120, "risk_level": "low"},
        "duration": 0.0,
    },
    {
        "name": "knife_gas_combo",
        "state": "hazard",
        "detections": [
            {"label": "human",    "confidence": 0.89, "bbox": [100, 60, 200, 370]},
            {"label": "knife",    "confidence": 0.86, "bbox": [175, 288, 60, 42]},
            {"label": "gas_leak", "confidence": 0.91, "bbox": [55,  45, 185, 165]},
            {"label": "stove",    "confidence": 0.82, "bbox": [275, 188, 128, 108]},
        ],
        "interaction": {"type": "multiple_hazards", "distance": 15, "risk_level": "critical"},
        "duration": 9.4,
    },
]

ALERT_MESSAGES = {
    "hazard": [
        {"message": "🚨 Unattended fire detected on stove", "severity": "critical"},
        {"message": "💨 Gas leak detected near open flame — immediate action required", "severity": "critical"},
        {"message": "🔪 Knife left unattended near stove", "severity": "high"},
    ],
    "warning": [
        {"message": "⚠️ Human detected dangerously close to knife", "severity": "medium"},
        {"message": "⚠️ Stove active — no human detected for 30s", "severity": "medium"},
        {"message": "⚠️ Unusual motion near hot surface", "severity": "medium"},
    ],
    "safe": [
        {"message": "✅ Kitchen activity normal", "severity": "low"},
    ],
}

# ── State ─────────────────────────────────────────────────────────────────────
_stream_active: bool = False
_scenario_start: float = time.time()
_alert_history: list = []
_inventory: dict = {}
_protein_goal: int = 120
_corrections: list = []
_last_added_time: dict = {}

# Global camera and detection state
_active_modes = set()
_cap = None
_thread = None
_current_frame_bytes = None
_current_frame_bytes_clean = None
_current_detections = []
_current_state = "safe"
_current_interaction = {"type": "none", "distance": 0, "risk_level": "low"}

DEFAULT_LOWER_COLOR = np.array([0, 100, 150])
DEFAULT_UPPER_COLOR = np.array([35, 255, 255])

hog = None

def _capture_loop():
    global _stream_active, _cap, _current_frame_bytes, _current_frame_bytes_clean, _current_detections, _current_state, _current_interaction, hog
    
    if hog is None:
        hog = cv2.HOGDescriptor()
        hog.setSVMDetector(cv2.HOGDescriptor_getDefaultPeopleDetector())
        
    _cap = cv2.VideoCapture(0)
    _cap.set(cv2.CAP_PROP_FRAME_WIDTH, 640)
    _cap.set(cv2.CAP_PROP_FRAME_HEIGHT, 480)
    frame_count = 0
    import classifier
    
    while _stream_active:
        ret, frame = _cap.read()
        if not ret:
            time.sleep(0.1)
            continue
            
        frame = cv2.resize(frame, (640, 480))
        clean_frame = frame.copy()
        ret, clean_buffer = cv2.imencode('.jpg', clean_frame, [int(cv2.IMWRITE_JPEG_QUALITY), 60])
        if ret:
            _current_frame_bytes_clean = clean_buffer.tobytes()
            
        detections = []
        state = "safe"
        flame_detected = False
        gas_conf = 0.0
        person_present = False
        person_box = None
        
        # --- SAFETY MODEL PIPELINE ---
        if "safety" in _active_modes:
            # 1. Person Detection (Improved Params & Thresholding)
            gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
            boxes, weights = hog.detectMultiScale(gray, winStride=(4,4), padding=(8,8), scale=1.05)
            
            for idx, (x, y, w, h) in enumerate(boxes):
                if weights[idx] < 0.2: continue
                person_present = True
                person_box = (x, y, w, h)
                detections.append({
                    "label": "human", "confidence": float(weights[idx]), "bbox": [int(x), int(y), int(w), int(h)], "color": "green", "icon": "👤"
                })
                cv2.rectangle(frame, (x, y), (x+w, y+h), (0, 255, 0), 2)
                cv2.putText(frame, f"Person {weights[idx]:.2f}", (x, y-5), cv2.FONT_HERSHEY_SIMPLEX, 0.5, (0, 255, 0), 2)

            # 2. Fire Masking
            hsv = cv2.cvtColor(frame, cv2.COLOR_BGR2HSV)
            mask = cv2.inRange(hsv, DEFAULT_LOWER_COLOR, DEFAULT_UPPER_COLOR)
            if person_present:
                px, py, pw, ph = person_box
                cv2.rectangle(mask, (px, py), (px+pw, py+ph), 0, -1)
                
            mask = cv2.erode(mask, None, iterations=2)
            mask = cv2.dilate(mask, None, iterations=2)
            contours, _ = cv2.findContours(mask, cv2.RETR_TREE, cv2.CHAIN_APPROX_SIMPLE)
            
            if contours:
                c = max(contours, key=cv2.contourArea)
                if cv2.contourArea(c) > 300:
                    flame_detected = True
                    fx, fy, fw, fh = cv2.boundingRect(c)
                    detections.append({
                        "label": "fire", "confidence": 0.95, "bbox": [int(fx), int(fy), int(fw), int(fh)], "color": "red", "icon": "🚨"
                    })
                    cv2.rectangle(frame, (fx, fy), (fx+fw, fy+fh), (0, 0, 255), 2)
                    cv2.putText(frame, "FIRE", (fx, fy-10), cv2.FONT_HERSHEY_SIMPLEX, 0.5, (0, 0, 255), 2)
                    
            # 3. Gas Detection (Bypassed for now - IR feed needed)
            # gas_conf = classifier.predict_gas(clean_frame)
            gas_conf = 0.0
            if gas_conf > 0.8:
                detections.append({"label": "gas_leak", "confidence": gas_conf, "bbox": [50, 50, 100, 100], "color": "red", "icon": "💨"})
                
            # State Logic Update & Alert
            if flame_detected:
                state = "hazard"
                cv2.putText(frame, "!!! DANGER: UNATTENDED FIRE !!!", (20, 50), 
                            cv2.FONT_HERSHEY_SIMPLEX, 0.8, (0, 0, 255), 3)
            elif gas_conf > 0.8:
                state = "hazard"

        # --- GROCERY TRACKER PIPELINE ---
        if "grocery" in _active_modes:
            # 4. Food Detection (debounce auto-add)
            if frame_count % 10 == 0:
                preds = classifier.predict_from_image(clean_frame, top_k=1)
                if preds:
                    print(f"DEBUG GROCERY: {preds}")
                if preds and preds[0]["confidence"] > 0.5:
                    label = preds[0]["label"]
                    detections.append({
                        "label": label, "confidence": preds[0]["confidence"], "bbox": [10, 10, 80, 80], "color": "green", "icon": "🥦"
                    })
                    # Auto add to inventory if not added in the last 3 seconds
                    if time.time() - _last_added_time.get(label, 0) > 3:
                        add_to_inventory(label)
                        _last_added_time[label] = time.time()
        
        _current_state = state
        _current_detections = detections
        
        # Encode frames into bytes for streaming yields
        ret, buffer = cv2.imencode('.jpg', frame, [int(cv2.IMWRITE_JPEG_QUALITY), 60])
        if ret:
            _current_frame_bytes = buffer.tobytes()
            
        frame_count += 1
        time.sleep(0.03)  # ~30 fps target
        
    if _cap:
        _cap.release()

def generate_frames(mode="safety"):
    global _current_frame_bytes, _current_frame_bytes_clean, _stream_active
    while _stream_active:
        if mode == "grocery":
            if _current_frame_bytes_clean is not None:
                yield (b'--frame\r\n' b'Content-Type: image/jpeg\r\n\r\n' + _current_frame_bytes_clean + b'\r\n')
        else:
            if _current_frame_bytes is not None:
                yield (b'--frame\r\n' b'Content-Type: image/jpeg\r\n\r\n' + _current_frame_bytes + b'\r\n')
        time.sleep(0.03)

PROTEIN_DB = {
    "Apple": 0.3, "Banana": 1.1, "Tomato": 0.9, "Egg": 6.0, "Milk": 3.4,
    "Carrot": 0.9, "Potato": 2.0, "Onion": 1.1, "Yoghurt": 3.5, "Cucumber": 0.7,
    "Chicken": 31.0, "Paneer": 18.0, "Lentils": 9.0, "Tofu": 8.0,
    "Mushroom": 3.1, "Avocado": 2.0, "Oat-Milk": 1.0, "Soy-Milk": 3.3,
}

SCENARIO_DURATION = 8  # seconds per scenario

def get_stream_active() -> bool:
    return _stream_active

def get_current_frame_clean() -> Optional[bytes]:
    return _current_frame_bytes_clean

def set_stream_active(active: bool, mode: str = "safety"):
    global _stream_active, _thread, _active_modes
    
    if active:
        _active_modes.add(mode)
    else:
        _active_modes.discard(mode)
        
    should_be_active = len(_active_modes) > 0
    
    if should_be_active and not _stream_active:
        _stream_active = True
        _thread = threading.Thread(target=_capture_loop, daemon=True)
        _thread.start()
    elif not should_be_active and _stream_active:
        _stream_active = False
        _thread = None


def get_detections() -> dict:
    """Returns current detection state."""
    return {
        "detections": _current_detections,
        "scenario": "Live Feed",
        "state": _current_state,
        "interaction": _current_interaction,
        "temporal": {
            "duration": 0.0,
            "risk_persists": _current_state != "safe",
        },
        "timestamp": time.time(),
    }


def get_alerts() -> dict:
    """Get current alert + history."""
    alerts = ALERT_MESSAGES.get(_current_state, ALERT_MESSAGES["safe"])
    current = random.choice(alerts)

    # Append to history if not duplicate
    if not _alert_history or _alert_history[-1]["message"] != current["message"]:
        _alert_history.append({**current, "timestamp": time.time(), "id": len(_alert_history)})

    # Keep last 20
    history = _alert_history[-20:][::-1]

    return {
        "current": current,
        "state": _current_state,
        "history": history,
    }


def get_inventory() -> dict:
    return {"inventory": _inventory}


def add_to_inventory(item: str, quantity: int = 1):
    if item in _inventory:
        _inventory[item]["quantity"] += quantity
    else:
        _inventory[item] = {
            "quantity": quantity,
            "protein_per_unit": PROTEIN_DB.get(item, 1.0),
        }


def remove_from_inventory(item: str):
    _inventory.pop(item, None)


def get_nutrition() -> dict:
    total_protein = sum(
        v["protein_per_unit"] * v["quantity"] for v in _inventory.values()
    )
    deficit = max(0, _protein_goal - total_protein)
    surplus = max(0, total_protein - _protein_goal)
    status = "surplus" if surplus > 0 else ("met" if deficit == 0 else "deficit")
    return {
        "current_protein": round(total_protein, 1),
        "goal": _protein_goal,
        "deficit": round(deficit, 1),
        "surplus": round(surplus, 1),
        "status": status,
        "percent": round(min(100, (total_protein / _protein_goal) * 100), 1),
    }


def set_protein_goal(goal: int):
    global _protein_goal
    _protein_goal = goal


def get_recommendations() -> dict:
    nutr = get_nutrition()
    if nutr["status"] != "deficit":
        return {"recommendations": [], "reason": "Protein goal already met!"}

    deficit = nutr["deficit"]
    recs = []
    if deficit >= 30:
        recs.append({"item": "100g Chicken Breast", "protein": 31, "priority": "high"})
    if deficit >= 18:
        recs.append({"item": "100g Paneer", "protein": 18, "priority": "high"})
    if deficit >= 9:
        recs.append({"item": "1 cup Lentils", "protein": 9, "priority": "medium"})
    if deficit >= 6:
        recs.append({"item": "2 Eggs", "protein": 12, "priority": "medium"})
    if deficit >= 3:
        recs.append({"item": "1 cup Soy Milk", "protein": 3.3, "priority": "low"})
    recs.append({"item": "100g Tofu", "protein": 8, "priority": "low"})

    return {"recommendations": recs[:4], "deficit": deficit}


def log_correction(frame_id: int, predicted: str, actual: str):
    _corrections.append({
        "frame_id": frame_id,
        "predicted_label": predicted,
        "actual_label": actual,
        "timestamp": time.time(),
    })

"""
main.py — FastAPI backend for AI Kitchen Safety & Smart Grocery System.
Exposes all endpoints defined in the PRD.
"""

from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from contextlib import asynccontextmanager
import asyncio
import time

import classifier
import simulator

# ── Lifespan: load models on startup ─────────────────────────────────────────
@asynccontextmanager
async def lifespan(app: FastAPI):
    loop = asyncio.get_event_loop()
    await loop.run_in_executor(None, classifier.load_models)
    yield

app = FastAPI(
    title="AI Kitchen API",
    description="Safety & Smart Grocery System — all PRD endpoints",
    version="1.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Pydantic Schemas ──────────────────────────────────────────────────────────
class GoalRequest(BaseModel):
    protein_goal: int

class InventoryAddRequest(BaseModel):
    item: str
    quantity: int = 1

class InventoryRemoveRequest(BaseModel):
    item: str

class OptionSelectRequest(BaseModel):
    frame_id: int
    predicted_label: str
    selected_item: str

# ── Lifecycle ─────────────────────────────────────────────────────────────────
@app.on_event("shutdown")
def shutdown_event():
    simulator.set_stream_active(False, mode="safety")
    simulator.set_stream_active(False, mode="grocery")
    time.sleep(0.5)

# ── Health ────────────────────────────────────────────────────────────────────
@app.get("/health")
def health():
    return {
        "status": "ready" if classifier.is_ready() else "loading",
        "models_loaded": classifier.is_ready(),
        "error": classifier.get_error() or None,
        "timestamp": time.time(),
    }

# ── Stream control ────────────────────────────────────────────────────────────
@app.post("/stream/start")
def stream_start(mode: str = "safety"):
    simulator.set_stream_active(True, mode)
    return {"status": "streaming", "message": f"Stream started for {mode}"}

@app.post("/stream/stop")
def stream_stop(mode: str = "safety"):
    simulator.set_stream_active(False, mode)
    return {"status": "stopped", "message": f"Stream stopped for {mode}"}

@app.get("/stream/video")
def stream_video():
    if not simulator.get_stream_active():
        raise HTTPException(status_code=400, detail="Stream is not active")
    return StreamingResponse(simulator.generate_frames(mode="safety"), media_type="multipart/x-mixed-replace; boundary=frame")

@app.get("/stream/grocery")
def stream_grocery():
    if not simulator.get_stream_active():
        raise HTTPException(status_code=400, detail="Stream is not active")
    return StreamingResponse(simulator.generate_frames(mode="grocery"), media_type="multipart/x-mixed-replace; boundary=frame")


@app.get("/stream/status")
def stream_status():
    return {
        "active": simulator.get_stream_active(),
        "fps": 10,
        "resolution": "640x480",
    }

# ── Detections ────────────────────────────────────────────────────────────────
@app.get("/detections")
def get_detections():
    """Returns current frame detections + state + interaction + temporal data."""
    return simulator.get_detections()

# ── Alerts ────────────────────────────────────────────────────────────────────
@app.get("/alerts")
def get_alerts():
    return simulator.get_alerts()

# ── Grocery Classifier ────────────────────────────────────────────────────────
@app.post("/classify")
async def classify_image(file: UploadFile = File(...)):
    """
    Accepts an image upload, runs the full sklearn inference pipeline.
    Returns top-3 predictions with confidence scores.
    """
    if not classifier.is_ready():
        raise HTTPException(
            status_code=503,
            detail=f"Models are still loading. {classifier.get_error() or 'Please wait.'}"
        )

    contents = await file.read()
    if len(contents) == 0:
        raise HTTPException(status_code=400, detail="Empty file uploaded.")

    try:
        results = classifier.predict_from_bytes(contents, top_k=5)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Inference error: {e}")

    top_confidence = results[0]["confidence"] if results else 0
    needs_option_panel = top_confidence < 0.75

    return {
        "predictions": results,
        "top_confidence": top_confidence,
        "needs_option_panel": needs_option_panel,
        "suggestions": [r["label"] for r in results[:5]],
    }

@app.get("/classify/snapshot")
def classify_snapshot():
    """
    Takes a 'snip' of the current clean camera frame from the simulator
    and runs the standard classification pipeline.
    """
    if not classifier.is_ready():
        raise HTTPException(status_code=503, detail="Models are loading")
    
    frame_bytes = simulator.get_current_frame_clean()
    if not frame_bytes:
        raise HTTPException(status_code=400, detail="No active camera feed to capture from.")

    try:
        results = classifier.predict_from_bytes(frame_bytes, top_k=5)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Inference error: {e}")

    top_confidence = results[0]["confidence"] if results else 0
    needs_option_panel = top_confidence < 0.75

    return {
        "predictions": results,
        "top_confidence": top_confidence,
        "needs_option_panel": needs_option_panel,
        "suggestions": [r["label"] for r in results[:5]],
    }

# ── Option Panel (human-in-the-loop correction) ───────────────────────────────
@app.post("/option/select")
def option_select(body: OptionSelectRequest):
    """User confirms or corrects a low-confidence prediction."""
    simulator.log_correction(body.frame_id, body.predicted_label, body.selected_item)
    simulator.add_to_inventory(body.selected_item)
    return {
        "status": "confirmed",
        "item": body.selected_item,
        "message": f"'{body.selected_item}' confirmed and added to inventory.",
    }

# ── Inventory ─────────────────────────────────────────────────────────────────
@app.get("/inventory")
def get_inventory():
    return simulator.get_inventory()

@app.post("/inventory/add")
def inventory_add(body: InventoryAddRequest):
    simulator.add_to_inventory(body.item, body.quantity)
    return {"status": "added", "item": body.item, "quantity": body.quantity}

@app.post("/inventory/remove")
def inventory_remove(body: InventoryRemoveRequest):
    simulator.remove_from_inventory(body.item)
    return {"status": "removed", "item": body.item}

# ── Nutrition ─────────────────────────────────────────────────────────────────
@app.get("/nutrition")
def get_nutrition():
    return simulator.get_nutrition()

@app.post("/set-goal")
def set_goal(body: GoalRequest):
    simulator.set_protein_goal(body.protein_goal)
    return {"status": "updated", "protein_goal": body.protein_goal}

# ── Recommendations ───────────────────────────────────────────────────────────
@app.get("/recommendations")
def get_recommendations():
    return simulator.get_recommendations()

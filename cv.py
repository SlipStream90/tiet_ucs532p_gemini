import cv2
import numpy as np

# --- CONFIGURATION ---
# Use these sliders to fine-tune if it still detects your skin
# Fire is usually BRIGHT (High Value) and VIVID (High Saturation)
DEFAULT_LOWER_COLOR = np.array([0, 100, 150]) # Higher V (150) ignores skin
DEFAULT_UPPER_COLOR = np.array([35, 255, 255])

def nothing(x): pass

# 1. SETUP UI
cv2.namedWindow("Control Panel")
cv2.createTrackbar("LH", "Control Panel", DEFAULT_LOWER_COLOR[0], 179, nothing)
cv2.createTrackbar("LS", "Control Panel", DEFAULT_LOWER_COLOR[1], 255, nothing)
cv2.createTrackbar("LV", "Control Panel", DEFAULT_LOWER_COLOR[2], 255, nothing)
cv2.createTrackbar("UH", "Control Panel", DEFAULT_UPPER_COLOR[0], 179, nothing)
cv2.createTrackbar("US", "Control Panel", DEFAULT_UPPER_COLOR[1], 255, nothing)
cv2.createTrackbar("UV", "Control Panel", DEFAULT_UPPER_COLOR[2], 255, nothing)

# 2. INITIALIZE
cap = cv2.VideoCapture(0) # Change to 1 if using external cam
hog = cv2.HOGDescriptor()
hog.setSVMDetector(cv2.HOGDescriptor_getDefaultPeopleDetector())

print("System Active. Press 'q' to exit.")

while True:
    ret, frame = cap.read()
    if not ret: break
    
    # Resize for speed
    frame = cv2.resize(frame, (640, 480))
    
    # --- STEP 1: DETECT PERSON ---
    gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
    boxes, weights = hog.detectMultiScale(gray, winStride=(8,8), padding=(8,8), scale=1.05)
    
    person_present = False
    person_box = None
    
    for (x, y, w, h) in boxes:
        person_present = True
        person_box = (x, y, w, h)
        # Draw Person Box
        cv2.rectangle(frame, (x, y), (x+w, y+h), (0, 255, 0), 2)
        cv2.putText(frame, "Person", (x, y-5), cv2.FONT_HERSHEY_SIMPLEX, 0.5, (0, 255, 0), 2)

    # --- STEP 2: PREPARE FIRE MASK ---
    # Get slider values
    l_h = cv2.getTrackbarPos("LH", "Control Panel")
    l_s = cv2.getTrackbarPos("LS", "Control Panel")
    l_v = cv2.getTrackbarPos("LV", "Control Panel")
    u_h = cv2.getTrackbarPos("UH", "Control Panel")
    u_s = cv2.getTrackbarPos("US", "Control Panel")
    u_v = cv2.getTrackbarPos("UV", "Control Panel")
    
    hsv = cv2.cvtColor(frame, cv2.COLOR_BGR2HSV)
    mask = cv2.inRange(hsv, np.array([l_h, l_s, l_v]), np.array([u_h, u_s, u_v]))

    # --- STEP 3: SMART MASKING (THE FIX) ---
    # If a person is found, "Erase" that area from the Fire Mask
    # This prevents your shirt/skin from triggering the fire alarm
    if person_present:
        px, py, pw, ph = person_box
        # Draw a black rectangle on the MASK (not the frame) over the person
        # This tells the computer: "Ignore colors in this box"
        cv2.rectangle(mask, (px, py), (px+pw, py+ph), 0, -1)

    # Clean up noise
    mask = cv2.erode(mask, None, iterations=2)
    mask = cv2.dilate(mask, None, iterations=2)

    # --- STEP 4: DETECT FIRE ---
    contours, _ = cv2.findContours(mask, cv2.RETR_TREE, cv2.CHAIN_APPROX_SIMPLE)
    flame_detected = False
    
    if contours:
        c = max(contours, key=cv2.contourArea)
        if cv2.contourArea(c) > 300: # Threshold size
            flame_detected = True
            fx, fy, fw, fh = cv2.boundingRect(c)
            cv2.rectangle(frame, (fx, fy), (fx+fw, fy+fh), (0, 0, 255), 2)
            cv2.putText(frame, "FIRE", (fx, fy-10), cv2.FONT_HERSHEY_SIMPLEX, 0.5, (0, 0, 255), 2)

    # --- STEP 5: LOGIC ALERTS ---
    # Logic: Fire exists AND (No person OR Person is far away)
    # Since we mask the person, any fire detected now is definitely NOT the person.
    if flame_detected:
        cv2.putText(frame, "!!! DANGER: UNATTENDED FIRE !!!", (20, 50), 
                    cv2.FONT_HERSHEY_SIMPLEX, 0.8, (0, 0, 255), 3)

    cv2.imshow("Kitchen Safety Monitor", frame)
    cv2.imshow("Debug Mask", mask) # Check this to see what the computer is "thinking"

    if cv2.waitKey(1) & 0xFF == ord('q'):
        break

cap.release()
cv2.destroyAllWindows()
import cv2
import numpy as np

def detect_layout(image):

    if len(image.shape) == 3:
        gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
    else:
        gray = image

    # threshold
    thresh = cv2.adaptiveThreshold(
        gray, 255,
        cv2.ADAPTIVE_THRESH_MEAN_C,
        cv2.THRESH_BINARY_INV,
        15, 5
    )

    # dilation to group text
    kernel = cv2.getStructuringElement(cv2.MORPH_RECT, (15, 5))
    dilated = cv2.dilate(thresh, kernel, iterations=1)

    contours, _ = cv2.findContours(dilated, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)

    blocks = []

    for cnt in contours:
        x, y, w, h = cv2.boundingRect(cnt)

        if w > 50 and h > 20:  # filter noise
            blocks.append({
                "x1": x,
                "y1": y,
                "x2": x + w,
                "y2": y + h
            })

    blocks = sorted(blocks, key=lambda b: (b["y1"], b["x1"]))
    return blocks

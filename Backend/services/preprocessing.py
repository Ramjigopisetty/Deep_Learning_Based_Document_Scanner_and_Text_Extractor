import cv2
import numpy as np


def deskew(image):

    coords = np.column_stack(np.where(image > 0))

    if len(coords) == 0:
        return image

    angle = cv2.minAreaRect(coords)[-1]

    if angle < -45:
        angle = -(90 + angle)
    else:
        angle = -angle

    (h, w) = image.shape[:2]

    center = (w // 2, h // 2)

    M = cv2.getRotationMatrix2D(center, angle, 1.0)

    rotated = cv2.warpAffine(
        image,
        M,
        (w, h),
        flags=cv2.INTER_CUBIC,
        borderMode=cv2.BORDER_REPLICATE,
    )

    return rotated

def preprocess_image(image):

    if isinstance(image, bytes):
        npimg = np.frombuffer(image, np.uint8)
        img = cv2.imdecode(npimg, cv2.IMREAD_COLOR)
    else:
        img = image

    gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)

    # âœ… Adaptive threshold (better than fixed)
    thresh = cv2.adaptiveThreshold(
        gray, 255,
        cv2.ADAPTIVE_THRESH_GAUSSIAN_C,
        cv2.THRESH_BINARY,
        11, 2
    )

    # âœ… Remove noise
    denoise = cv2.fastNlMeansDenoising(thresh)
    denoise = cv2.medianBlur(denoise, 3)

    # âœ… Sharpen
    kernel = np.array([[0, -1, 0],
                       [-1, 5,-1],
                       [0, -1, 0]])
    sharp = cv2.filter2D(denoise, -1, kernel)

    # âœ… Deskew
    sharp = deskew(sharp)

    return sharp

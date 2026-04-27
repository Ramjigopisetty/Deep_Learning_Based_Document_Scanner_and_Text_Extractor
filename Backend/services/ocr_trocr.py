from transformers import TrOCRProcessor, VisionEncoderDecoderModel
from PIL import Image
import torch
import numpy as np
import cv2

processor = TrOCRProcessor.from_pretrained("microsoft/trocr-base-handwritten")
model = VisionEncoderDecoderModel.from_pretrained("microsoft/trocr-base-handwritten")


def extract_trocr_text(image):

    # convert numpy â†’ PIL
    if isinstance(image, np.ndarray):
        image = Image.fromarray(image)

    # convert to RGB
    image = image.convert("RGB")

    image = image.resize((384, int(image.height * 384 / image.width)))
    pixel_values = processor(images=image, return_tensors="pt").pixel_values


    generated_ids = model.generate(
        pixel_values,
        max_length=64,
        num_beams=5,
        early_stopping=True
    )

    generated_text = processor.batch_decode(
        generated_ids, skip_special_tokens=True
    )[0]
    
    confidence = 85.0  # estimated confidence
    
    return generated_text,float(confidence)

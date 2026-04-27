import cv2
import pytesseract
from pytesseract import Output

pytesseract.pytesseract.tesseract_cmd = r"C:\Users\USER\AppData\Local\Programs\Tesseract-OCR\tesseract.exe"

def extract_text(image):

    custom_config = r'--oem 3 --psm 4 -l eng'
    image = cv2.resize(image, None, fx=2, fy=2, interpolation=cv2.INTER_CUBIC)

    data = pytesseract.image_to_data(
        image,
        config=custom_config,
        output_type=Output.DICT
    )

    text_list = []
    conf_list = []

    for i in range(len(data["text"])):
        word = data["text"][i].strip()
        conf = int(data["conf"][i])

        if word != "" and conf > 0:
            text_list.append(word)
            conf_list.append(conf)

    text = " ".join(text_list)

    confidence = sum(conf_list) / len(conf_list) if conf_list else 0

    return text, round(confidence,2)

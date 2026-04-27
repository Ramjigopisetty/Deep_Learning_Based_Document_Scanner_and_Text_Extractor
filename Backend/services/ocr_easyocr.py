import easyocr

reader = easyocr.Reader(['en'], gpu=False)

def extract_handwritten_text(image):

    results = reader.readtext(image)

    text_list = []
    conf_list = []

    for bbox, text, conf in results:
        text_list.append(text)
        conf_list.append(conf)

    text = " ".join(text_list)

    confidence = sum(conf_list) / len(conf_list) if conf_list else 0

    return text, float(round(confidence * 100, 2))
import re

# -----------------------------
# 1. BASIC CLEANING
# -----------------------------
def clean_text(text: str):

    text = text.replace("\n", " ")

    # remove extra spaces
    text = re.sub(r'\s+', ' ', text)

    return text.strip()


# -----------------------------
# 2. OCR ERROR CORRECTION
# -----------------------------
def correct_ocr_errors(text: str):

    replacements = {
        "|": "I",
        "0": "O",
        "1": "I",
        "5": "S",
        "â‚¬": "C",
        "@": "a"
    }

    for k, v in replacements.items():
        text = text.replace(k, v)

    return text


# -----------------------------
# 3. REMOVE GARBAGE / NOISE
# -----------------------------
def remove_noise(text: str):

    # remove random symbols
    text = re.sub(r'[^a-zA-Z0-9\s.,:%()-]', '', text)

    return text


# -----------------------------
# 4. SENTENCE FORMATTING
# -----------------------------
def format_sentences(text: str):

    # add line breaks after punctuation
    text = re.sub(r'([.?!])\s*', r'\1\n', text)

    return text


# -----------------------------
# 5. KEY-VALUE EXTRACTION
# -----------------------------
def extract_key_values(text: str):

    pairs = {}

    lines = text.split("\n")

    for line in lines:
        if ":" in line:
            parts = line.split(":", 1)
            key = parts[0].strip()
            value = parts[1].strip()
            pairs[key] = value

    return pairs


# -----------------------------
# 6. TABLE-LIKE DETECTION
# -----------------------------
def detect_table_lines(text: str):

    lines = text.split("\n")

    structured = []

    for line in lines:
        if re.search(r'\d', line) and len(line.split()) >= 2:
            structured.append(line)

    return structured


# -----------------------------
# 7. FINAL PIPELINE
# -----------------------------
def process_text(text: str):

    text = clean_text(text)
    text = correct_ocr_errors(text)
    text = remove_noise(text)
    text = format_sentences(text)

    key_values = extract_key_values(text)
    table_data = detect_table_lines(text)

    return {
        "clean_text": text,
        "key_values": key_values,
        "table_lines": table_data
    }

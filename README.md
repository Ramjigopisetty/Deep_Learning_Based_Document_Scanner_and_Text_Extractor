# Deep Learning-Based Document Scanner and Text Extractor

## Overview

Deep Learning-Based Document Scanner and Text Extractor is a web-based application that lets users upload document images or PDFs and extract text with advanced OCR techniques. It combines traditional OCR engines with deep learning-based models, image preprocessing, and NLP refinement to improve accuracy and usability.

The result is a complete document digitization workflow with structured output and multiple export options.

## Features

- User authentication with signup/login and JWT
- Upload support for images and PDFs
- Multi-OCR engine support:
	- Tesseract OCR
	- EasyOCR
	- TrOCR (deep learning-based)
- Layout detection and block processing
- Image preprocessing for grayscale conversion, noise removal, and thresholding
- NLP-based text cleaning and structuring
- Export options in TXT, DOCX, and PDF
- Modern web interface built with React + Vite
- SQLite database for user management

## Project Structure

```text
project-root/
├── Backend/
│   ├── main.py
│   ├── requirements.txt
│   ├── users.db
│   └── services/
│       ├── auth.py
│       ├── database.py
│       ├── models.py
│       ├── preprocessing.py
│       ├── ocr_tesseract.py
│       ├── ocr_easyocr.py
│       ├── ocr_trocr.py
│       ├── parallel_ocr.py
│       ├── layout_detection.py
│       ├── block_cropper.py
│       ├── nlp_processing.py
│       ├── export_utils.py
│       └── pdf_utils.py
└── Frontend/
    ├── src/
    │   ├── App.tsx
    │   ├── auth.tsx
    │   └── main.tsx
    ├── package.json
    ├── vite.config.ts
    └── .env
```

## Tech Stack

### Backend

- Python (FastAPI)
- OpenCV
- Tesseract OCR
- EasyOCR
- TrOCR (Transformers)
- NumPy
- SQLite
- JWT authentication

### Frontend

- React + TypeScript
- Vite
- Tailwind CSS

## Installation Guide

### 1. Clone the Repository

```bash
git clone <your-repo-url>
cd project-root
```

### 2. Backend Setup

Create a virtual environment:

```bash
cd Backend
python -m venv venv
venv\Scripts\activate  # Windows
```

Install dependencies:

```bash
pip install -r requirements.txt
```

Run the backend:

```bash
uvicorn main:app --reload
```

Backend runs at:

```text
http://localhost:8000
```

### 3. Frontend Setup

Install dependencies:

```bash
cd ../Frontend
npm install
```

Configure the environment:

```bash
VITE_API_URL=http://localhost:8000
```

Run the frontend:

```bash
npm run dev
```

Frontend runs at:

```text
http://localhost:3000
```

## How to Use

1. Open the application in your browser.
2. Register or log in.
3. Upload an image or PDF.
4. Click Extract Text.
5. Review the extracted results.
6. Download the output in TXT, DOCX, or PDF.

## Workflow

```text
Upload -> Preprocessing -> Layout Detection -> OCR Engines -> NLP Processing -> Display -> Export
```

## Performance

- Achieves about 95-96% accuracy for structured documents
- Accuracy may drop slightly for blurred or low-quality images
- Preprocessing significantly improves OCR results

## Future Enhancements

- Handwritten text recognition
- Multi-language support
- Cloud deployment
- Advanced AI model integration
- Mobile compatibility

## Notes

- Install Tesseract OCR and add it to your system PATH
- GPU is optional, but helps with TrOCR
- Large files may take longer to process

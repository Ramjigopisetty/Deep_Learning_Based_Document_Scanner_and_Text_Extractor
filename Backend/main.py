from fastapi import FastAPI, UploadFile, File, Depends
from services.preprocessing import preprocess_image
from services.ocr_tesseract import extract_text
from services.ocr_easyocr import extract_handwritten_text
from services.ocr_trocr import extract_trocr_text
from services.parallel_ocr import run_parallel_ocr
from services.pdf_utils import pdf_to_images
from services.export_utils import export_txt, export_docx, export_pdf

# âœ… NEW IMPORTS
from services.layout_detection import detect_layout
from services.block_cropper import crop_blocks
from services.nlp_processing import process_text

from fastapi.responses import FileResponse
from fastapi.middleware.cors import CORSMiddleware

from services.auth import router as auth_router, get_current_user

import numpy as np
import cv2

app = FastAPI()

app.include_router(auth_router)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def home():
    return {"message": "Text Scanner API Running"}


@app.post("/scan")
async def scan_document(
    file: UploadFile = File(...),
    user: str = Depends(get_current_user)
):

    try:
        contents = await file.read()

        # ---------- PDF PROCESSING ----------
        if file.filename.lower().endswith(".pdf"):

            images = pdf_to_images(contents)
            results = []

            for img in images:

                img_np = np.array(img)
                processed = preprocess_image(img_np)

                # âœ… Layout detection
                layout_blocks = detect_layout(processed)
                layout_blocks = layout_blocks[:4]

                # âœ… SORT BLOCKS (VERY IMPORTANT)
                layout_blocks = sorted(layout_blocks, key=lambda b: (b["y1"], b["x1"]))

                if layout_blocks:
                    cropped_blocks = crop_blocks(processed, layout_blocks)
                else:
                    cropped_blocks = [processed]

                tesseract_results = run_parallel_ocr(cropped_blocks, extract_text)
                easyocr_results = run_parallel_ocr(cropped_blocks, extract_handwritten_text)

                trocr_results = []
                for block, (pt, pc) in zip(cropped_blocks, tesseract_results):
                    if len(pt.strip()) < 20:
                        tt, tc = extract_trocr_text(block)
                    else:
                        tt, tc = "", 0
                    trocr_results.append((tt, tc))

                t_text = "\n".join(pt for pt, _ in tesseract_results)
                e_text = "\n".join(et for et, _ in easyocr_results)
                tr_text = "\n".join(tt for tt, _ in trocr_results)

                t_conf = max((pc for _, pc in tesseract_results), default=0)
                e_conf = max((ec for _, ec in easyocr_results), default=0)
                tr_conf = max((tc for _, tc in trocr_results), default=0)

                # âœ… NLP Processing
                t_nlp = process_text(t_text)
                e_nlp = process_text(e_text)
                tr_nlp = process_text(tr_text)

                engine_scores = {
                    "tesseract": t_conf,
                    "easyocr": e_conf,
                    "trocr": tr_conf
                }

                recommended_engine = max(engine_scores, key=engine_scores.get)

                results.append({
                    "layout_blocks": layout_blocks,
                    "results": {
                        "tesseract": {
                            "text": t_nlp["clean_text"],
                            "confidence": t_conf
                        },
                        "easyocr": {
                            "text": e_nlp["clean_text"],
                            "confidence": e_conf
                        },
                        "trocr": {
                            "text": tr_nlp["clean_text"],
                            "confidence": tr_conf
                        }
                    },
                    "recommended_engine": recommended_engine,
                    "structured_data": {
                        "tesseract": t_nlp,
                        "easyocr": e_nlp,
                        "trocr": tr_nlp
                    }
                })

            return {"pages": results}

        # ---------- IMAGE PROCESSING ----------
        else:

            npimg = np.frombuffer(contents, np.uint8)
            image = cv2.imdecode(npimg, cv2.IMREAD_COLOR)

            processed = preprocess_image(image)

            # âœ… Layout detection
            layout_blocks = detect_layout(processed)
            layout_blocks = layout_blocks[:4]

            # âœ… SORT BLOCKS
            layout_blocks = sorted(layout_blocks, key=lambda b: (b["y1"], b["x1"]))

            if layout_blocks:
                cropped_blocks = crop_blocks(processed, layout_blocks)
            else:
                cropped_blocks = [processed]

            tesseract_results = run_parallel_ocr(cropped_blocks, extract_text)
            easyocr_results = run_parallel_ocr(cropped_blocks, extract_handwritten_text)

            trocr_results = []
            for block, (pt, pc) in zip(cropped_blocks, tesseract_results):
                if len(pt.strip()) < 20:
                    tt, tc = extract_trocr_text(block)
                else:
                    tt, tc = "", 0
                trocr_results.append((tt, tc))

            t_text = "\n".join(pt for pt, _ in tesseract_results)
            e_text = "\n".join(et for et, _ in easyocr_results)
            tr_text = "\n".join(tt for tt, _ in trocr_results)

            t_conf = max((pc for _, pc in tesseract_results), default=0)
            e_conf = max((ec for _, ec in easyocr_results), default=0)
            tr_conf = max((tc for _, tc in trocr_results), default=0)

            # âœ… NLP Processing
            t_nlp = process_text(t_text)
            e_nlp = process_text(e_text)
            tr_nlp = process_text(tr_text)

            engine_scores = {
                "tesseract": t_conf,
                "easyocr": e_conf,
                "trocr": tr_conf
            }

            recommended_engine = max(engine_scores, key=engine_scores.get)

            return {
                "layout_blocks": layout_blocks,
                "results": {
                    "tesseract": {
                        "text": t_nlp["clean_text"],
                        "confidence": t_conf
                    },
                    "easyocr": {
                        "text": e_nlp["clean_text"],
                        "confidence": e_conf
                    },
                    "trocr": {
                        "text": tr_nlp["clean_text"],
                        "confidence": tr_conf
                    }
                },
                "recommended_engine": recommended_engine,
                "structured_data": {
                    "tesseract": t_nlp,
                    "easyocr": e_nlp,
                    "trocr": tr_nlp
                }
            }

    except Exception as e:
        return {"error": str(e)}


@app.post("/export/txt")
def export_text_txt(text: str):
    file_path = export_txt(text)
    return FileResponse(file_path, media_type="text/plain", filename="ocr_result.txt")


@app.post("/export/docx")
def export_text_docx(text: str):
    file_path = export_docx(text)
    return FileResponse(file_path, filename="ocr_result.docx")


@app.post("/export/pdf")
def export_text_pdf(text: str):
    file_path = export_pdf(text)
    return FileResponse(file_path, filename="ocr_result.pdf")

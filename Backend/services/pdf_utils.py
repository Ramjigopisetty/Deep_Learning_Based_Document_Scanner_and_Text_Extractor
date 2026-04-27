from pdf2image import convert_from_bytes

def pdf_to_images(pdf_bytes):

    images = convert_from_bytes(
        pdf_bytes,
        poppler_path=r"C:\poppler-25.12.0\Library\bin"
    )

    return images
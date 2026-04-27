import cv2

def crop_blocks(image, layout_blocks):

    cropped_images = []

    for block in layout_blocks:

        x1 = block["x1"]
        y1 = block["y1"]
        x2 = block["x2"]
        y2 = block["y2"]

        crop = image[y1:y2, x1:x2]

        if crop.size != 0:
            cropped_images.append(crop)

    return cropped_images

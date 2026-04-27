from concurrent.futures import ThreadPoolExecutor

def run_parallel_ocr(blocks, ocr_function):

    results = []

    with ThreadPoolExecutor(max_workers=4) as executor:

        futures = [executor.submit(ocr_function, block) for block in blocks]

        for future in futures:
            try:
                text, conf = future.result()
                results.append((text, conf))
            except:
                results.append(("", 0))

    return results
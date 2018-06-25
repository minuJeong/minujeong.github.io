
import os
from PIL import Image


TARGET_RES = 172
for root, dirs, files in os.walk("./"):
    if root.startswith("_"):
        continue

    for filename in files:
        if not any(filter(lambda x: filename.endswith(x), ["jpg", "png"])):
            continue

        src_uri = f"{root}/{filename}"
        dst_uri = f"_{TARGET_RES}/{src_uri}"
        img = Image.open(src_uri)
        r = img.size[0] / img.size[1]

        target_size = None
        if img.size[0] > img.size[1]:
            target_size = (TARGET_RES, round(TARGET_RES / r))
        else:
            target_size = (round(TARGET_RES * r), TARGET_RES)

        dst_dir = os.path.dirname(dst_uri)
        if not os.path.isdir(dst_dir):
            os.makedirs(dst_dir)
        img.resize(target_size, Image.ANTIALIAS).save(dst_uri)


from PIL import Image
import numpy as np


w, h = 256, 256
img = Image.new("L", (w, h))
px = img.load()
for x in range(w):
    for y in range(h):
        px[x, y] = 0

data = np.array(img)

img.save("res.jpg")

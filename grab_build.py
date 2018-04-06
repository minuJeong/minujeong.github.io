
import os
import shutil


src = "/Users/minuj/Documents/UnityPrj/Simm/Build/WebGL/ent3"
dst = "./uweb/simm"

if os.path.exists(dst):
    shutil.rmtree(dst)
shutil.copytree(src, dst)

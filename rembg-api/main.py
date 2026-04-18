from fastapi import FastAPI, UploadFile, File
from fastapi.responses import Response
from fastapi.middleware.cors import CORSMiddleware
from rembg import remove, new_session
import gc
import os

app = FastAPI(title="BGRemover rembg API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# BiRefNet-General: best quality open-source model for edge detection
session = new_session("birefnet-general")

@app.get("/")
def health():
    return {"status": "ok", "model": "birefnet-general"}

@app.post("/remove-bg")
async def remove_background(image: UploadFile = File(...)):
    input_bytes = await image.read()
    output_bytes = remove(input_bytes, session=session)
    gc.collect()
    return Response(content=output_bytes, media_type="image/png")

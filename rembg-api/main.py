from fastapi import FastAPI, UploadFile, File
from fastapi.responses import Response
from fastapi.middleware.cors import CORSMiddleware
from rembg import remove, new_session
import gc

app = FastAPI(title="BGRemover rembg API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# Use lightweight model to fit in 512MB RAM (Render free tier)
session = new_session("u2netp")

@app.get("/")
def health():
    return {"status": "ok", "model": "u2netp"}

@app.post("/remove-bg")
async def remove_background(image: UploadFile = File(...)):
    input_bytes = await image.read()
    output_bytes = remove(input_bytes, session=session)
    gc.collect()  # Free memory after processing
    return Response(content=output_bytes, media_type="image/png")

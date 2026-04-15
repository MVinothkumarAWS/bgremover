from fastapi import FastAPI, UploadFile, File
from fastapi.responses import Response
from fastapi.middleware.cors import CORSMiddleware
from rembg import remove
from io import BytesIO

app = FastAPI(title="BGRemover rembg API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def health():
    return {"status": "ok", "model": "u2net"}

@app.post("/remove-bg")
async def remove_background(image: UploadFile = File(...)):
    input_bytes = await image.read()
    output_bytes = remove(input_bytes)
    return Response(content=output_bytes, media_type="image/png")

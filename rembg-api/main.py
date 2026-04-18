from fastapi import FastAPI, UploadFile, File
from fastapi.responses import Response
from fastapi.middleware.cors import CORSMiddleware
from rembg import remove, new_session
from PIL import Image
from io import BytesIO
import gc

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

    # Resize large images to optimal size for better model accuracy
    img = Image.open(BytesIO(input_bytes))
    max_dim = 1500
    if max(img.width, img.height) > max_dim:
        ratio = max_dim / max(img.width, img.height)
        new_size = (int(img.width * ratio), int(img.height * ratio))
        img = img.resize(new_size, Image.LANCZOS)
        buf = BytesIO()
        img.save(buf, format="PNG")
        input_bytes = buf.getvalue()

    # Remove background with alpha matting for smoother edges
    output_bytes = remove(
        input_bytes,
        session=session,
        alpha_matting=True,
        alpha_matting_foreground_threshold=240,
        alpha_matting_background_threshold=10,
        alpha_matting_erode_size=10,
    )

    gc.collect()
    return Response(content=output_bytes, media_type="image/png")

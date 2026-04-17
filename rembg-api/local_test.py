from fastapi import FastAPI, UploadFile, File
from fastapi.responses import Response
from fastapi.middleware.cors import CORSMiddleware
from rembg import remove, new_session
import gc

app = FastAPI(title="BGRemover rembg API - Local Test")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# isnet-general-use: good quality, smaller model (~170MB)
print("Loading ISNet-General-Use model...")
session = new_session("isnet-general-use")
print("Model loaded!")

@app.get("/")
def health():
    return {"status": "ok", "model": "isnet-general-use"}

@app.post("/remove-bg")
async def remove_background(image: UploadFile = File(...)):
    input_bytes = await image.read()
    output_bytes = remove(input_bytes, session=session)
    gc.collect()
    return Response(content=output_bytes, media_type="image/png")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)

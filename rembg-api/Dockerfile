FROM python:3.11-slim

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Pre-download model during build so first request is fast
RUN python -c "from rembg import new_session; new_session('isnet-general-use')"

COPY main.py .

# Google Cloud Run uses PORT env variable
CMD exec uvicorn main:app --host 0.0.0.0 --port ${PORT:-8080}

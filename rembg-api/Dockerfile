FROM python:3.11-slim

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Pre-download the u2net model so first request isn't slow
# Pre-download lightweight model (fits in 512MB free tier)
RUN python -c "from rembg import new_session; new_session('u2netp')"

COPY main.py .

EXPOSE 10000

CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "10000"]

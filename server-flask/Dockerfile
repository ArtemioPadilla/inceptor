# Build context is server-flask/ (it has no cross-boundary imports).
FROM python:3.12-slim

WORKDIR /app

COPY requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt

COPY . ./

ENV PORT=8787
EXPOSE 8787

CMD ["gunicorn", "-b", "0.0.0.0:8787", "app:create_app()"]

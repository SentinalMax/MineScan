FROM python:3.11-slim

ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

WORKDIR /app
ENV PATH="/app/bin:${PATH}"

RUN apt-get update \
    && apt-get install -y --no-install-recommends \
        build-essential \
        ca-certificates \
        curl \
        git \
        libffi-dev \
        libssl-dev \
        masscan \
        nodejs \
        npm \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt package.json ./

RUN pip install --no-cache-dir -r requirements.txt \
    && npm install --omit=dev

COPY . .

RUN chmod +x /app/docker-entrypoint.sh /app/bin/pycope /app/bin/pycode
ENTRYPOINT ["/app/docker-entrypoint.sh"]
CMD ["python", "scanCore.py"]

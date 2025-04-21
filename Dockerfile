FROM python:3.13-alpine
ENV PYTHONUNBUFFERED=1
WORKDIR /app

# Install PostgreSQL client and development libraries
RUN apk add --no-cache postgresql-client postgresql-dev gcc python3-dev musl-dev

COPY requirements.txt requirements.txt
# Install dependencies
RUN pip install --no-cache-dir -r requirements.txt

# Copy project files
COPY . .
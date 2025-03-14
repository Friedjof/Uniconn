FROM python:3.10-alpine

WORKDIR /app
COPY . .

# Install dependencies
RUN pip install --no-cache-dir -r requirements.txt

# Run migrations
RUN python3 manage.py migrate

# Expose the port Django runs on
EXPOSE 8000

# Start the server - bind to 0.0.0.0 to be accessible outside container
CMD ["python", "manage.py", "runserver", "0.0.0.0:8000"]
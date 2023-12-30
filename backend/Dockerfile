# Use the official Python image as the base image
FROM python:3.9

# Set the working directory
WORKDIR /app

# Copy requirements.txt to the working directory
COPY requirements.txt .

# Install dependencies
RUN pip install --no-cache-dir -r requirements.txt

# Copy the entire project to the working directory
COPY . .

# Expose port 5000 for the Flask app
EXPOSE 5000

# Command to start the Flask app
CMD ["python", "app.py"]

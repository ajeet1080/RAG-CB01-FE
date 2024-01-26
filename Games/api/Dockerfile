# Use the official Debian 11 image as a parent image
FROM debian:11

# Set the working directory in the container
WORKDIR /app

# Install dependencies
RUN apt-get update && apt-get install -y --fix-missing python3-pip 

# Copy the current directory contents into the container at /app
COPY . /app

# Install any needed packages specified in requirements.txt
RUN pip3 install --no-cache-dir -r requirements.txt

# Install gunicorn
RUN pip3 install gunicorn

# Make port 8000 available to the world outside this container
EXPOSE 8000

# Run app.py when the container launches
CMD ["gunicorn", "-w", "2", "-t", "200", "-b", "0.0.0.0:8000", "app:app"]
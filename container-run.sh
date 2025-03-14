#! bin/bash/

# Build the docker image
docker build -t uniconn .

# Run the docker container at the port 8000 from docker container to 8000 on local machine
docker run -p 8000:8000 --name uniconn-app uniconn

# Following can be used to enable live coding, so no need to kill container and rerun bash again.
#docker run -p 8000:8000 -v $(pwd):/app uniconn

# Logs from the docker container to see possible errors, warnings etc.
# docker logs uniconn-app

# DON'T UNCOMMENT THE FOLLOWING LINES
# This can be used to stop the container after you are done with the app.
# docker stop uniconn-app


# Additional info
# To run the container in interactive mode. This should be done without bash after building the image.
# docker run -it -p 8000:8000 uniconn bash
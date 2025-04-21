# Uniconn

This project is to develop a smart communication platform that verifies residents and connects apartments within your dormitory. Simplifies messaging, interactions, and neighbour-to-neighbour networking.

## Setup Uniconn as Docker Container

Docker Compose is used to deploy the application with all required services (web app, PostgreSQL database, and NGINX for static files).

1. Make sure Docker and Docker Compose are installed on your system

2. Build and start the Docker containers:
```bash
docker-compose up -d
```
   - `up` - Creates and starts the containers
   - `-d` - Runs in detached mode (background)

3. The application will be available at:
   - Web interface: http://localhost:80
   - Admin interface: http://localhost:80/admin

4. To view container logs:
```bash
docker-compose logs -f
```

5. To stop the containers:
```bash
docker-compose down
```

## To connect PostgresDB via pgAdmin
Firstly, we need to run the docker container.
1. Right-click on "Servers" in the left panel
2. Select "Register > Server..."
3. Name it anyway you want, and enter connection info
  - Host: localhost
  - Port: 5432
  - Maintenance database: postgres
  - Username: postgres
  - Password: postgres
  - Save password: Check this box (optional)
4. Click **Save** to have connection

## Setup Environment

1. Check if config exist using ``` git config user.name``` and ```git config user.email```.
   * If suits your preferred user info, check for the public key using ```cat ~/.ssh/id_rsa.pub```.
     * If exists,  in github Settings &rarr; SSH and GPG key (under Access) &rarr; New SSH key&rarr; Copy the key from id_rsa.pub above and paste it to the key section.
     * If not exists, generate it using ```ssh-keygen -t rsa -b 4096```.

2. Clone repository

```bash
git clone git@github.com:Friedjof/Uniconn.git
cd Uniconn
```

3. Create and activate a virtual environment

  * To check any python venv exist ```dpkg -l | grep python3.*-venv```, if exist do following

```bash
python3 -m venv .venv
source .venv/bin/activate
```

* If not exist, X is the version you want to use, preferably matching version of your python

```bash
sudo apt install python3.X-venv
```

4. Install dependencies

```bash
pip install -r requirements.txt
```

5. Apply database migrations

```bash
python manage.py migrate
```

6. Start the development server

```bash
python manage.py runserver
```
# Uniconn

This project is to develop a smart communication platform that verifies residents and connects apartments within your dormitory. Simplifies messaging, interactions, and neighbour-to-neighbour networking.

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
#!/usr/bin/env python3
"""
A script to migrate data from a local SQLite database to PostgreSQL in Docker.

Usage:
    python migrate_sqlite_to_docker.py [sqlite_db_path]

Arguments:
    sqlite_db_path - Path to SQLite database (default: db.sqlite3)
"""

import os
import sys
import subprocess
import sqlite3
import json
import time
import datetime
from pathlib import Path

# Default SQLite database path
DEFAULT_SQLITE_PATH = 'db.sqlite3'

# Map of SQLite table names to Django model names
MODEL_MAP = {
    'account_customuser': 'account.customuser',
    'account_emailverification': 'account.emailverification',
    'auth_permission': 'auth.permission',
    'django_admin_log': 'admin.logentry',
    'django_content_type': 'contenttypes.contenttype', 
    'django_session': 'sessions.session',
    # django_migrations should be skipped, not mapped
    # Add other mappings as needed for your models
    'chat_message': 'chat.message',
    'chat_room': 'chat.room',
    'room_room': 'room.room',
    'homepage_announcement': 'homepage.announcement',
}

# Tables to explicitly skip (system tables that don't need to be migrated)
SKIP_TABLES = [
    'django_migrations',
    'sqlite_sequence',
    'auth_group',
    'auth_group_permissions',
    'auth_user',
    'auth_user_groups',
    'auth_user_user_permissions',
]

# Fields that should be treated as datetime with timezone
DATETIME_FIELDS = [
    'created_at',
    'last_login',
    'date_joined',
    'expire_date',
    'action_time',
    'start_date',
    'end_date',
    'modified',
]

# Fields that should be treated as boolean
BOOLEAN_FIELDS = [
    'is_superuser',
    'is_staff',
    'is_active',
    'verified',
    'has_',  # prefix for boolean fields
]


def get_model_data(sqlite_path):
    """Extract data from SQLite by model/table."""
    conn = sqlite3.connect(sqlite_path)
    conn.row_factory = sqlite3.Row
    cursor = conn.cursor()

    # Get all tables except sqlite_sequence
    cursor.execute("SELECT name FROM sqlite_master WHERE type='table' AND name != 'sqlite_sequence'")
    tables = [row[0] for row in cursor.fetchall()]

    data_by_model = {}
    
    for table in tables:
        cursor.execute(f"SELECT * FROM {table}")
        rows = cursor.fetchall()
        if rows:
            # Convert rows to list of dicts
            data_by_model[table] = [dict(row) for row in rows]

    conn.close()
    return data_by_model


def run_command(cmd, shell=False):
    """Run a command and return output."""
    print(f"Running: {' '.join(cmd) if isinstance(cmd, list) else cmd}")
    result = subprocess.run(
        cmd, 
        shell=shell,
        capture_output=True,
        text=True
    )
    if result.returncode != 0:
        print(f"Error executing command: {result.stderr}")
        return None
    return result.stdout


def docker_is_running():
    """Check if Docker is running."""
    try:
        run_command(["docker", "ps"])
        return True
    except Exception:
        return False


def docker_compose_services_running():
    """Check if docker-compose services are running."""
    result = run_command(["docker-compose", "ps", "--services", "--filter", "status=running"])
    if not result:
        return False
    
    running_services = result.strip().split('\n') if result.strip() else []
    return 'app' in running_services and 'db' in running_services


def start_docker_compose():
    """Start docker-compose services."""
    print("Starting Docker containers...")
    result = run_command(["docker-compose", "up", "-d"])
    
    if not result:
        print("Failed to start Docker containers")
        return False
    
    # Wait for services to be fully up
    print("Waiting for services to be ready...")
    max_attempts = 10
    for i in range(max_attempts):
        if docker_compose_services_running():
            print("Docker services are now running")
            # Extra time for PostgreSQL to initialize
            time.sleep(3)
            return True
        
        print(f"Waiting for services to start ({i+1}/{max_attempts})...")
        time.sleep(3)
    
    print("Timed out waiting for services to start")
    return False


def confirm_action(prompt):
    """Ask for confirmation before proceeding."""
    while True:
        response = input(f"{prompt} (yes/no): ").lower().strip()
        if response in ('yes', 'y'):
            return True
        elif response in ('no', 'n'):
            return False
        print("Please enter 'yes' or 'no'")


def is_likely_boolean(field_name):
    """Check if a field is likely to be boolean based on its name."""
    for prefix in BOOLEAN_FIELDS:
        if field_name.startswith(prefix) or field_name == prefix:
            return True
    return False


def is_likely_datetime(field_name):
    """Check if a field is likely to be a datetime based on its name."""
    for datetime_field in DATETIME_FIELDS:
        if field_name == datetime_field or field_name.endswith('_' + datetime_field):
            return True
    return False


def add_timezone_to_datetime(dt_str):
    """Add UTC timezone to datetime string if not already present."""
    if not dt_str:
        return dt_str
    
    # Check if there's already a timezone
    if dt_str.endswith('Z') or '+' in dt_str[-6:] or '-' in dt_str[-6:]:
        return dt_str
        
    # Add T between date and time if not present
    if ' ' in dt_str and 'T' not in dt_str:
        dt_str = dt_str.replace(' ', 'T', 1)
        
    # Add microseconds if not present
    if '.' not in dt_str:
        if 'T' in dt_str:
            dt_str = dt_str + '.000000'
            
    # Add Z for UTC timezone
    return dt_str + 'Z'


def get_model_name(table_name):
    """Convert SQLite table name to Django model identifier."""
    return MODEL_MAP.get(table_name, table_name)


def create_django_fixture(data_by_model):
    """Convert the extracted data to Django fixture format."""
    fixture_data = []
    
    for table, records in data_by_model.items():
        # Skip tables we explicitly want to exclude
        if table in SKIP_TABLES:
            print(f"Skipping system table {table}")
            continue
            
        model_identifier = get_model_name(table)
        
        # Skip tables that we can't map or don't want to import
        if model_identifier == table and '.' not in model_identifier:
            print(f"Skipping table {table} - no model mapping found")
            continue
        
        print(f"Processing {len(records)} records from {table} as {model_identifier}")
        
        for record in records:
            fixture_record = {
                'model': model_identifier,
                'pk': record.pop('id', None),
                'fields': {}
            }
            
            # Process fields with proper type conversion
            for field, value in record.items():
                # Boolean fields (convert 0/1 to True/False)
                if is_likely_boolean(field) and isinstance(value, int):
                    fixture_record['fields'][field] = bool(value)
                
                # DateTime fields (add timezone info)
                elif is_likely_datetime(field) and value:
                    fixture_record['fields'][field] = add_timezone_to_datetime(str(value))
                
                # All other fields
                else:
                    fixture_record['fields'][field] = value
            
            fixture_data.append(fixture_record)
            
    return fixture_data


def main():
    # Get SQLite database path
    sqlite_path = sys.argv[1] if len(sys.argv) > 1 else DEFAULT_SQLITE_PATH
    
    if not os.path.exists(sqlite_path):
        print(f"Error: SQLite database not found at {sqlite_path}")
        sys.exit(1)
    
    # Check if Docker is running
    if not docker_is_running():
        print("Error: Docker doesn't appear to be running. Please start Docker first.")
        sys.exit(1)
    
    # Check if docker-compose services are running
    if not docker_compose_services_running():
        print("Docker is running, but the required services aren't started.")
        if confirm_action("Do you want to start Docker services now?"):
            if not start_docker_compose():
                print("Failed to start Docker services. Please run 'docker-compose up -d' manually.")
                sys.exit(1)
        else:
            print("Please start the services with 'docker-compose up -d' and try again.")
            sys.exit(1)
    
    print(f"📦 Extracting data from {sqlite_path}...")
    data_by_model = get_model_data(sqlite_path)
    
    # Convert to Django fixture format
    fixture_data = create_django_fixture(data_by_model)
    
    # Create fixtures directory if it doesn't exist
    fixtures_dir = Path("fixtures")
    fixtures_dir.mkdir(exist_ok=True)
    
    # Write fixture to file
    fixture_path = fixtures_dir / "sqlite_data.json"
    with open(fixture_path, 'w') as f:
        json.dump(fixture_data, f, indent=2)
    
    print(f"✅ Created fixture file at {fixture_path}")
    
    # Confirm and load data into Docker PostgreSQL
    if confirm_action("Do you want to load this data into the Docker PostgreSQL database now?"):
        print("🔄 Loading data into Docker PostgreSQL...")
        
        # Copy fixture file into Docker container
        result = run_command(["docker-compose", "exec", "-T", "app", "python", "manage.py", "loaddata", "fixtures/sqlite_data.json"])
        
        if result:
            print("✅ Data successfully migrated to Docker PostgreSQL!")
        else:
            print("❌ Failed to load data into Docker PostgreSQL.")
            print("Try running: docker-compose exec app python manage.py loaddata fixtures/sqlite_data.json")
    else:
        print("Migration canceled. To load the data later, run:")
        print("docker-compose exec app python manage.py loaddata fixtures/sqlite_data.json")


if __name__ == "__main__":
    main()
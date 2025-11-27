import os
import django
import sys

# Setup Django environment
sys.path.append(os.getcwd())
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
django.setup()

from django.contrib.auth.models import User

try:
    username = 'debug_user_final'
    password = 'password123'
    if not User.objects.filter(username=username).exists():
        User.objects.create_user(username, password)
        print(f"User {username} created successfully")
    else:
        print(f"User {username} already exists")
except Exception as e:
    print(f"Error creating user: {e}")

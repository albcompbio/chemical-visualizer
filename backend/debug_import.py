import os
import sys

print("Starting import check...")
try:
    sys.path.append(os.getcwd())
    os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
    import django
    print("Django imported.")
    django.setup()
    print("Django setup complete.")
except Exception as e:
    print(f"Error: {e}")

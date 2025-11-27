import requests
import sys

BASE_URL = 'http://localhost:8000/api'

def test_register(username, password):
    print(f"Testing registration for {username}...")
    try:
        response = requests.post(f'{BASE_URL}/register/', json={'username': username, 'password': password})
        print(f"Status: {response.status_code}")
        print(f"Response: {response.text}")
        return response.status_code == 201
    except Exception as e:
        print(f"Error: {e}")
        return False

def test_login(username, password):
    print(f"Testing login for {username}...")
    try:
        response = requests.post(f'{BASE_URL}/token/', json={'username': username, 'password': password})
        print(f"Status: {response.status_code}")
        print(f"Response: {response.text}")
        return response.status_code == 200
    except Exception as e:
        print(f"Error: {e}")
        return False

if __name__ == "__main__":
    username = "testuser_debug"
    password = "testpassword123"
    
    if test_register(username, password):
        print("Registration successful.")
    else:
        print("Registration failed (might already exist).")
        
    if test_login(username, password):
        print("Login successful.")
    else:
        print("Login failed.")

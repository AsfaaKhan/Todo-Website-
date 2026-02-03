#!/usr/bin/env python3
"""
Script to check if the backend is running and accessible
"""

import requests
import sys
import os

def check_backend():
    # Check if the backend is running
    backend_urls = [
        "http://localhost:8000",
        "http://127.0.0.1:8000"
    ]

    print("Checking if backend is running...")

    for url in backend_urls:
        try:
            response = requests.get(f"{url}/health", timeout=5)
            if response.status_code == 200:
                print(f"✅ Backend is running at {url}")
                print(f"   Health check response: {response.json()}")

                # Check if auth endpoints are accessible
                try:
                    auth_response = requests.get(f"{url}/docs", timeout=5)
                    if auth_response.status_code == 200:
                        print(f"   ✅ API documentation is accessible at {url}/docs")
                    else:
                        print(f"   ❌ API documentation not accessible at {url}/docs")
                except Exception as e:
                    print(f"   ❌ Error checking API docs: {e}")

                return True
        except requests.exceptions.ConnectionError:
            print(f"❌ Backend not accessible at {url}")
        except requests.exceptions.Timeout:
            print(f"❌ Timeout connecting to backend at {url}")
        except Exception as e:
            print(f"❌ Error connecting to backend at {url}: {e}")

    print("\n💡 Suggestions:")
    print("1. Make sure your backend is running with: `uvicorn app.main:app --reload`")
    print("2. Or start it with: `python -m uvicorn app.main:app --host 0.0.0.0 --port 8000`")
    print("3. Check your .env file in the backend directory has proper DATABASE_URL and SECRET_KEY")
    print("4. Ensure your database server is running (PostgreSQL, SQLite, etc.)")

    return False

if __name__ == "__main__":
    check_backend()
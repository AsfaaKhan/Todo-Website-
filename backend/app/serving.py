"""
Entry point for Hugging Face deployment
"""
from .main import app

# This creates the application instance for Hugging Face to serve
# The app object is what Hugging Face will look for
application = app

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000, proxy_headers=True, forwarded_allow_ips="*")
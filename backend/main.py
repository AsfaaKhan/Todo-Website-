from app.huggingface_app import application

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "app.huggingface_app:application",
        host="0.0.0.0",
        port=8000,
        reload=True,
        forwarded_allow_ips="*",
        proxy_headers=True
    )




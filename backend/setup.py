from setuptools import setup, find_packages

setup(
    name="todo-backend",
    version="0.1.0",
    packages=find_packages(),
    install_requires=[
        "fastapi>=0.104.1",
        "uvicorn>=0.24.0",
        "sqlmodel>=0.0.16",
        "asyncpg>=0.29.0",
        "pydantic>=2.5.0",
        "pydantic-settings>=2.1.0",
        "passlib>=1.7.4",
        "bcrypt>=4.0.1",
        "python-jose[cryptography]>=3.3.0",
        "python-multipart>=0.0.6",
        "alembic>=1.13.1",
        "psycopg2-binary>=2.9.9",
        "python-dotenv>=1.0.0",
    ],
    author="Developer",
    description="Full-stack Todo web application backend with FastAPI and SQLModel",
)
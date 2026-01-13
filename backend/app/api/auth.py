from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import HTTPBearer
from datetime import timedelta
from sqlmodel import Session, select
from typing import Optional
from ..database.database import get_session
from ..models.database import User, UserCreate, UserLogin, UserRead
from ..auth.hashing import verify_password, get_password_hash
from ..auth.token import create_access_token
from ..config import settings

router = APIRouter()

@router.post("/register", response_model=UserRead, status_code=status.HTTP_201_CREATED)
def register(user: UserCreate, session: Session = Depends(get_session)):
    """
    Register a new user
    """
    # Check if user with username or email already exists
    existing_user_by_username = session.exec(select(User).where(User.username == user.username)).first()
    if existing_user_by_username:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Username already registered"
        )

    existing_user_by_email = session.exec(select(User).where(User.email == user.email)).first()
    if existing_user_by_email:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered"
        )

    # Hash the password
    hashed_password = get_password_hash(user.password)

    # Create new user
    db_user = User(
        username=user.username,
        email=user.email,
        hashed_password=hashed_password
    )

    session.add(db_user)
    session.commit()
    session.refresh(db_user)

    return db_user


@router.post("/login")
def login(user_credentials: UserLogin, session: Session = Depends(get_session)):
    """
    Authenticate user and return access token
    """
    # Find user by username
    user = session.exec(select(User).where(User.username == user_credentials.username)).first()

    if not user or not verify_password(user_credentials.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )

    # Create access token
    access_token_expires = timedelta(minutes=settings.access_token_expire_minutes)
    access_token = create_access_token(
        data={"sub": user.username}, expires_delta=access_token_expires
    )

    return {"access_token": access_token, "token_type": "bearer"}
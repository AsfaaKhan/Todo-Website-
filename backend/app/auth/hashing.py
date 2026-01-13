import bcrypt

def verify_password(plain_password: str, hashed_password: str) -> bool:
    """
    Verify a plain password against a hashed password
    """
    # Encode both passwords to bytes if they're strings
    if isinstance(plain_password, str):
        plain_password = plain_password.encode('utf-8')
    if isinstance(hashed_password, str):
        hashed_password = hashed_password.encode('utf-8')

    return bcrypt.checkpw(plain_password, hashed_password)

def get_password_hash(password: str) -> str:
    """
    Generate a hash for the given password
    Bcrypt has a 72-byte password length limit, so we truncate if necessary
    """
    # Truncate password to 72 bytes to comply with bcrypt limitations
    if isinstance(password, str):
        password = password.encode('utf-8')

    # Ensure password is not longer than 72 bytes
    if len(password) > 72:
        password = password[:72]

    # Generate salt and hash the password
    salt = bcrypt.gensalt()
    hashed = bcrypt.hashpw(password, salt)

    # Return as string
    return hashed.decode('utf-8')
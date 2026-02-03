from typing import Optional
from ..models.database import TodoCreate, TodoUpdate

class TodoValidator:
    """Validation service for todo operations"""

    @staticmethod
    def validate_todo_create(todo_create: TodoCreate) -> tuple[bool, Optional[str]]:
        """
        Validate a TodoCreate object

        Args:
            todo_create: The TodoCreate object to validate

        Returns:
            Tuple of (is_valid, error_message)
        """
        # Check if title is provided and not empty
        if not todo_create.title or not todo_create.title.strip():
            return False, "Title is required and cannot be empty"

        # Check title length
        if len(todo_create.title.strip()) > 200:
            return False, "Title cannot exceed 200 characters"

        # Check description length if provided
        if todo_create.description and len(todo_create.description) > 1000:
            return False, "Description cannot exceed 1000 characters"

        # Check priority if provided
        if todo_create.priority and todo_create.priority not in ['low', 'medium', 'high']:
            return False, "Priority must be one of: low, medium, high"

        # Check due_date format if provided
        if todo_create.due_date:
            try:
                # This will raise an exception if the format is invalid
                from datetime import datetime
                datetime.fromisoformat(todo_create.due_date.replace('Z', '+00:00'))
            except ValueError:
                return False, "Due date must be in ISO format (YYYY-MM-DDTHH:MM:SS.sssZ)"

        return True, None

    @staticmethod
    def validate_todo_update(todo_update: TodoUpdate) -> tuple[bool, Optional[str]]:
        """
        Validate a TodoUpdate object

        Args:
            todo_update: The TodoUpdate object to validate

        Returns:
            Tuple of (is_valid, error_message)
        """
        # Check title length if provided
        if todo_update.title is not None and len(todo_update.title.strip()) > 200:
            return False, "Title cannot exceed 200 characters"

        # Check description length if provided
        if todo_update.description is not None and len(todo_update.description) > 1000:
            return False, "Description cannot exceed 1000 characters"

        # Check priority if provided
        if todo_update.priority is not None and todo_update.priority not in ['low', 'medium', 'high']:
            return False, "Priority must be one of: low, medium, high"

        # Check due_date format if provided
        if todo_update.due_date:
            try:
                # This will raise an exception if the format is invalid
                from datetime import datetime
                datetime.fromisoformat(todo_update.due_date.replace('Z', '+00:00'))
            except ValueError:
                return False, "Due date must be in ISO format (YYYY-MM-DDTHH:MM:SS.sssZ)"

        # Check completed if provided
        if todo_update.completed is not None and not isinstance(todo_update.completed, bool):
            return False, "Completed must be a boolean value"

        return True, None

    @staticmethod
    def sanitize_input(text: str) -> str:
        """
        Sanitize user input to prevent injection attacks

        Args:
            text: The input text to sanitize

        Returns:
            Sanitized text
        """
        if not text:
            return text

        # Remove potentially dangerous characters/sequences
        sanitized = text.replace('<script', '&lt;script').replace('</script>', '&lt;/script&gt;')
        sanitized = sanitized.replace('javascript:', 'javascript&#58;')
        sanitized = sanitized.replace('vbscript:', 'vbscript&#58;')
        sanitized = sanitized.replace('onload=', 'onload&#61;')
        sanitized = sanitized.replace('onerror=', 'onerror&#61;')

        return sanitized
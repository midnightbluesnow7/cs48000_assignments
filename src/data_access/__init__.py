"""Data Access Layer - Base classes and interfaces."""

from abc import ABC, abstractmethod
from typing import List, Any


class BaseDataAccess(ABC):
    """Abstract base class for data access objects."""
    
    def __init__(self, connection_string: str):
        """
        Initialize data access object.
        
        Args:
            connection_string: Database connection string
        """
        self.connection_string = connection_string
    
    @abstractmethod
    def create(self, entity: Any) -> int:
        """Create an entity and return its ID."""
        pass
    
    @abstractmethod
    def read_by_id(self, entity_id: int) -> Any:
        """Read an entity by ID."""
        pass
    
    @abstractmethod
    def update(self, entity: Any) -> bool:
        """Update an entity."""
        pass
    
    @abstractmethod
    def delete(self, entity_id: int) -> bool:
        """Delete an entity by ID."""
        pass
    
    @abstractmethod
    def read_all(self) -> List[Any]:
        """Read all entities."""
        pass

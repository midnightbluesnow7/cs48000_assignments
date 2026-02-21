"""Data Integrity Flag domain model."""

from dataclasses import dataclass
from datetime import datetime
from typing import Optional, Literal


@dataclass
class DataIntegrityFlag:
    """
    Data integrity flag for tracking validation issues and conflicts.
    
    Primary Key:
    - id
    
    Foreign Key:
    - lot_id
    """
    
    lot_id: int
    flag_type: str
    severity: Literal['Warning', 'Error', 'Critical']
    description: str
    detected_date: datetime
    is_resolved: bool = False
    id: Optional[int] = None
    
    def resolve(self) -> None:
        """Mark this flag as resolved."""
        pass
    
    def get_severity_level(self) -> int:
        """Get numeric severity level (1=Warning, 2=Error, 3=Critical)."""
        pass
    
    def is_critical(self) -> bool:
        """Check if this flag is critical."""
        pass

"""Quality Inspection Record domain model."""

from dataclasses import dataclass
from datetime import date, datetime
from typing import Optional


@dataclass
class QualityRecord:
    """
    Quality inspection record from Quality Inspection files (XLSX/CSV).
    
    Primary Key:
    - lot_id (foreign key to Lot)
    - inspection_date
    """
    
    lot_id: int
    inspection_date: date
    is_pass: bool
    inspector_id: str
    source_updated_timestamp: datetime
    defect_type: Optional[str] = None
    defect_count: int = 0
    id: Optional[int] = None
    
    def is_valid(self) -> bool:
        """Validate quality record constraints."""
        pass
    
    def get_defect_description(self) -> str:
        """Get human-readable defect description."""
        pass
    
    def is_passing(self) -> bool:
        """Check if quality inspection passed."""
        pass

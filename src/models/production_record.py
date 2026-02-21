"""Production Record domain model."""

from dataclasses import dataclass
from datetime import date, datetime
from typing import Optional


@dataclass
class ProductionRecord:
    """
    Production record from Production Logs (CSV).
    
    Primary Key:
    - lot_id (foreign key to Lot)
    - production_date (derived from Lot)
    """
    
    lot_id: int
    production_line_id: str
    shift: str
    units_planned: int
    units_actual: int
    downtime_minutes: int
    has_line_issue: bool
    source_updated_timestamp: datetime
    id: Optional[int] = None
    
    def get_line_error_rate(self) -> float:
        """Calculate error rate for production line."""
        pass
    
    def is_valid(self) -> bool:
        """Validate production record constraints."""
        pass
    
    def mark_line_issue(self) -> None:
        """Mark that this production line has an issue."""
        pass

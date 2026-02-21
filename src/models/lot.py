"""Lot domain model - central conformed entity unifying Production, Quality, and Shipping data."""

from dataclasses import dataclass
from datetime import date, datetime
from typing import Optional


@dataclass
class Lot:
    """
    Central conformed entity that unifies Production, Quality, and Shipping data.
    
    Composite Business Key:
    - lot_code: The business Lot ID (cleansed)
    - production_date: The production date
    """
    
    lot_code: str
    production_date: date
    id: Optional[int] = None
    is_pending_inspection: bool = True
    has_data_integrity_issue: bool = False
    has_date_conflict: bool = False
    created_at: Optional[datetime] = None
    
    def get_composite_key(self) -> tuple:
        """Get the composite key (lot_code, production_date)."""
        pass
    
    def mark_pending_inspection(self) -> None:
        """Mark this lot as pending inspection."""
        pass
    
    def flag_data_integrity_issue(self) -> None:
        """Flag that this lot has a data integrity issue."""
        pass
    
    def flag_date_conflict(self) -> None:
        """Flag that this lot has a date conflict."""
        pass

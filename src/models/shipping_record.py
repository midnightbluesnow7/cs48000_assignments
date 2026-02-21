"""Shipping Record domain model."""

from dataclasses import dataclass
from datetime import date, datetime
from typing import Optional


@dataclass
class ShippingRecord:
    """
    Shipping record from Shipping Logs (XLSX).
    
    Primary Key:
    - lot_id (foreign key to Lot) - unique 1:1 relationship
    - ship_date
    """
    
    lot_id: int
    ship_date: date
    destination_state: str
    carrier: str
    qty_shipped: int
    shipment_status: str
    source_updated_timestamp: datetime
    id: Optional[int] = None
    
    def is_valid(self) -> bool:
        """Validate shipping record constraints."""
        pass
    
    def get_status_description(self) -> str:
        """Get human-readable shipment status."""
        pass
    
    def is_shipped(self) -> bool:
        """Check if lot has been shipped."""
        pass

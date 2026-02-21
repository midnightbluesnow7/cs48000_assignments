"""Shipping Data Access Layer."""

from typing import List, Optional
from datetime import date
from src.data_access.base import BaseDataAccess
from src.models.shipping_record import ShippingRecord


class ShippingDataAccess(BaseDataAccess):
    """Data access for Shipping Records."""
    
    def create(self, shipping_record: ShippingRecord) -> int:
        """Create a shipping record and return its ID."""
        pass
    
    def read_by_id(self, record_id: int) -> Optional[ShippingRecord]:
        """Read a shipping record by ID."""
        pass
    
    def read_by_lot_id(self, lot_id: int) -> Optional[ShippingRecord]:
        """Read shipping record by lot ID."""
        pass
    
    def read_by_lot_code(self, lot_code: str) -> Optional[ShippingRecord]:
        """Read shipping record by lot code."""
        pass
    
    def update(self, shipping_record: ShippingRecord) -> bool:
        """Update a shipping record."""
        pass
    
    def delete(self, record_id: int) -> bool:
        """Delete a shipping record by ID."""
        pass
    
    def read_all(self) -> List[ShippingRecord]:
        """Read all shipping records."""
        pass
    
    def get_shipped_records(self) -> List[ShippingRecord]:
        """Get all records with shipment_status = 'Shipped'."""
        pass
    
    def get_records_by_destination_state(self, state: str) -> List[ShippingRecord]:
        """Get all shipping records for a specific destination state."""
        pass
    
    def get_records_by_carrier(self, carrier: str) -> List[ShippingRecord]:
        """Get all shipping records for a specific carrier."""
        pass
    
    def get_records_by_date_range(self, start_date: date, end_date: date) -> List[ShippingRecord]:
        """Get shipping records within a date range."""
        pass
    
    def get_missing_shipping_records(self) -> List[int]:
        """Get lot IDs that have quality records but no shipping records."""
        pass
    
    def search_by_lot_id(self, lot_id: int) -> Optional[ShippingRecord]:
        """Search for shipping record by lot ID (AC 3: Search function)."""
        pass

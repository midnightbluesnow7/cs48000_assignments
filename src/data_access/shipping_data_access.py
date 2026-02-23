"""Shipping Data Access Layer."""

from datetime import date

from src.data_access.base import BaseDataAccess
from src.models.shipping_record import ShippingRecord


class ShippingDataAccess(BaseDataAccess):
    """Data access for Shipping Records."""

    def create(self, shipping_record: ShippingRecord) -> int:
        """Create a shipping record and return its ID."""
        ...

    def read_by_id(self, record_id: int) -> ShippingRecord | None:
        """Read a shipping record by ID."""
        ...

    def read_by_lot_id(self, lot_id: int) -> ShippingRecord | None:
        """Read shipping record by lot ID."""
        ...

    def read_by_lot_code(self, lot_code: str) -> ShippingRecord | None:
        """Read shipping record by lot code."""
        ...

    def update(self, shipping_record: ShippingRecord) -> bool:
        """Update a shipping record."""
        ...

    def delete(self, record_id: int) -> bool:
        """Delete a shipping record by ID."""
        ...

    def read_all(self) -> list[ShippingRecord]:
        """Read all shipping records."""
        ...

    def get_shipped_records(self) -> list[ShippingRecord]:
        """Get all records with shipment_status = 'Shipped'."""
        ...

    def get_records_by_destination_state(self, state: str) -> list[ShippingRecord]:
        """Get all shipping records for a specific destination state."""
        ...

    def get_records_by_carrier(self, carrier: str) -> list[ShippingRecord]:
        """Get all shipping records for a specific carrier."""
        ...

    def get_records_by_date_range(
        self, start_date: date, end_date: date
    ) -> list[ShippingRecord]:
        """Get shipping records within a date range."""
        ...

    def get_missing_shipping_records(self) -> list[int]:
        """Get lot IDs that have quality records but no shipping records."""
        ...

    def search_by_lot_id(self, lot_id: int) -> ShippingRecord | None:
        """Search for shipping record by lot ID (AC 3: Search function)."""
        ...

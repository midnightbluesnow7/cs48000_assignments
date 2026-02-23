"""Production Data Access Layer."""

from datetime import date

from src.data_access.base import BaseDataAccess
from src.models.production_record import ProductionRecord


class ProductionDataAccess(BaseDataAccess):
    """Data access for Production Records."""

    def create(self, production_record: ProductionRecord) -> int:
        """Create a production record and return its ID."""
        ...

    def read_by_id(self, record_id: int) -> ProductionRecord | None:
        """Read a production record by ID."""
        ...

    def read_by_lot_id(self, lot_id: int) -> ProductionRecord | None:
        """Read production record by lot ID."""
        ...

    def read_by_lot_code_and_date(
        self, lot_code: str, production_date: date
    ) -> ProductionRecord | None:
        """Read production record by lot code and production date."""
        ...

    def update(self, production_record: ProductionRecord) -> bool:
        """Update a production record."""
        ...

    def delete(self, record_id: int) -> bool:
        """Delete a production record by ID."""
        ...

    def read_all(self) -> list[ProductionRecord]:
        """Read all production records."""
        ...

    def get_records_by_production_line(
        self, production_line_id: str
    ) -> list[ProductionRecord]:
        """Get all production records for a specific production line."""
        ...

    def get_error_count_by_line_per_week(self, week_start_date: date) -> dict[str, int]:
        """
        Get error count by production line for a specific week.

        Returns:
            Dictionary mapping line ID to error count
        """
        ...

    def get_records_by_date_range(
        self, start_date: date, end_date: date
    ) -> list[ProductionRecord]:
        """Get production records within a date range."""
        ...

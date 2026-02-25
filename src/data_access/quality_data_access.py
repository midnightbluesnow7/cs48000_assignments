"""Quality Inspection Data Access Layer."""

from datetime import date

from src.data_access.base import BaseDataAccess
from src.models.quality_record import QualityRecord


class QualityDataAccess(BaseDataAccess):
    """Data access for Quality Inspection Records."""

    def create(self, quality_record: QualityRecord) -> int:
        """Create a quality record and return its ID."""
        ...

    def read_by_id(self, record_id: int) -> QualityRecord | None:
        """Read a quality record by ID."""
        ...

    def read_by_lot_id(self, lot_id: int) -> QualityRecord | None:
        """Read quality record by lot ID."""
        ...

    def read_by_lot_code_and_date(
        self, lot_code: str, inspection_date: date
    ) -> QualityRecord | None:
        """Read quality record by lot code and inspection date."""
        ...

    def update(self, quality_record: QualityRecord) -> bool:
        """Update a quality record."""
        ...

    def delete(self, record_id: int) -> bool:
        """Delete a quality record by ID."""
        ...

    def read_all(self) -> list[QualityRecord]:
        """Read all quality records."""
        ...

    def get_records_by_defect_type(self, defect_type: str) -> list[QualityRecord]:
        """Get all quality records with a specific defect type."""
        ...

    def get_defect_trend_by_type(
        self, start_date: date, end_date: date
    ) -> dict[str, int]:
        """
        Get defect count by type within a date range.

        Returns:
            Dictionary mapping defect type to count
        """
        ...

    def get_failing_records(self) -> list[QualityRecord]:
        """Get all quality records where inspection failed."""
        ...

    def get_records_by_date_range(
        self, start_date: date, end_date: date
    ) -> list[QualityRecord]:
        """Get quality records within a date range."""
        ...

    def get_missing_quality_records(self) -> list[int]:
        """Get lot IDs that have production records but no quality records."""
        ...

"""Data Integrity Flags Data Access Layer."""

from typing import Any

from src.data_access.base import BaseDataAccess
from src.models.data_integrity_flag import DataIntegrityFlag


class DataIntegrityAccess(BaseDataAccess):
    """Data access for Data Integrity Flags."""

    def create(self, flag: DataIntegrityFlag) -> int:
        """Create a data integrity flag and return its ID."""
        ...

    def read_by_id(self, flag_id: int) -> DataIntegrityFlag | None:
        """Read a data integrity flag by ID."""
        ...

    def update(self, flag: DataIntegrityFlag) -> bool:
        """Update a data integrity flag."""
        ...

    def delete(self, flag_id: int) -> bool:
        """Delete a data integrity flag by ID."""
        ...

    def read_all(self) -> list[DataIntegrityFlag]:
        """Read all data integrity flags."""
        ...

    def get_flags_by_lot_id(self, lot_id: int) -> list[DataIntegrityFlag]:
        """Get all flags associated with a specific lot."""
        ...

    def get_unresolved_flags(self) -> list[DataIntegrityFlag]:
        """Get all unresolved data integrity flags."""
        ...

    def get_critical_flags(self) -> list[DataIntegrityFlag]:
        """Get all critical severity flags."""
        ...

    def get_flags_by_type(self, flag_type: str) -> list[DataIntegrityFlag]:
        """Get all flags of a specific type (e.g., 'Missing Quality')."""
        ...

    def resolve_flag(self, flag_id: int) -> bool:
        """Mark a flag as resolved."""
        ...

    def create_missing_quality_flag(self, lot_id: int) -> int:
        """Create a 'Missing Quality' flag for a lot (AC 4)."""
        ...

    def create_date_conflict_flag(self, lot_id: int, description: str) -> int:
        """Create a 'Date Conflict' flag for a lot (AC 4)."""
        ...

    def get_integrity_summary(self) -> dict[str, Any]:
        """
        Get summary of data integrity issues.

        Returns:
            Dictionary with counts by severity and type
        """
        ...

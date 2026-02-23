"""Conflict Resolution Service for handling missing data and inconsistencies."""

from datetime import date
from typing import Any

from src.models.data_integrity_flag import DataIntegrityFlag
from src.models.lot import Lot


class ConflictResolutionService:
    """Service for resolving conflicts and handling missing data."""

    def resolve_missing_quality_records(
        self, integrated_records: dict[tuple[str, date], dict[str, Any]]
    ) -> list[DataIntegrityFlag]:
        """
        Handle missing quality records (AC 2: Conflict Resolution).

        If a Lot ID exists in Production but is missing in Quality,
        the record must still appear but be flagged as "Pending Inspection."

        Args:
            integrated_records: Dictionary of integrated records

        Returns:
            List of DataIntegrityFlag for missing quality records
        """
        ...

    def resolve_missing_shipping_records(
        self, integrated_records: dict[tuple[str, date], dict[str, Any]]
    ) -> list[DataIntegrityFlag]:
        """
        Identify lots that appear in Shipping but have no Quality record.

        (AC 4: Data Integrity Flags highlight any Lot IDs in Shipping
        with no corresponding Quality record)

        Args:
            integrated_records: Dictionary of integrated records

        Returns:
            List of DataIntegrityFlag for inconsistencies
        """
        ...

    def flag_lot_pending_inspection(self, lot: Lot) -> None:
        """Mark a lot as pending inspection."""
        ...

    def create_pending_inspection_flag(self, lot: Lot) -> DataIntegrityFlag:
        """Create a 'Pending Inspection' flag for a lot."""
        ...

    def create_missing_quality_flag(self, lot: Lot) -> DataIntegrityFlag:
        """Create a 'Missing Quality' integrity flag."""
        ...

    def create_missing_shipping_flag(self, lot: Lot) -> DataIntegrityFlag:
        """Create a 'Missing Shipping' integrity flag."""
        ...

    def handle_orphaned_records(
        self,
        production_only: list[Lot],
        quality_only: list[Lot],
        shipping_only: list[Lot],
    ) -> list[DataIntegrityFlag]:
        """
        Handle records that exist in only one source.

        Returns:
            List of created DataIntegrityFlag objects
        """
        ...

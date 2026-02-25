"""Validation Service for detecting data integrity issues and outliers."""

from datetime import date
from typing import Any

from src.models.data_integrity_flag import DataIntegrityFlag
from src.models.lot import Lot


class ValidationService:
    """Service for validating data integrity and detecting outliers."""

    def detect_date_conflicts(
        self, integrated_records: dict[tuple[str, date], dict[str, Any]]
    ) -> list[DataIntegrityFlag]:
        """
        Detect logical date errors (AC 4: Outlier Detection).

        Flag records where Ship Date is earlier than Production Date.

        Args:
            integrated_records: Dictionary of integrated records

        Returns:
            List of DataIntegrityFlag for date conflicts
        """
        ...

    def validate_ship_date_after_production_date(
        self, lot: Lot, production_date: date, ship_date: date
    ) -> tuple[bool, DataIntegrityFlag | None]:
        """
        Validate that ship date is not before production date.

        Returns:
            Tuple of (is_valid, flag_if_invalid)
        """
        ...

    def detect_all_outliers(
        self, integrated_records: dict[tuple[str, date], dict[str, Any]]
    ) -> list[DataIntegrityFlag]:
        """
        Detect all data quality outliers and inconsistencies.

        Checks:
        - Date conflicts (ship < production)
        - Missing required fields
        - Invalid field values

        Returns:
            List of all detected DataIntegrityFlag objects
        """
        ...

    def validate_production_record(
        self, record: dict[str, Any]
    ) -> tuple[bool, str | None]:
        """
        Validate a production record for data quality.

        Returns:
            Tuple of (is_valid, error_message_if_invalid)
        """
        ...

    def validate_quality_record(
        self, record: dict[str, Any]
    ) -> tuple[bool, str | None]:
        """
        Validate a quality record for data quality.

        Returns:
            Tuple of (is_valid, error_message_if_invalid)
        """
        ...

    def validate_shipping_record(
        self, record: dict[str, Any]
    ) -> tuple[bool, str | None]:
        """
        Validate a shipping record for data quality.

        Returns:
            Tuple of (is_valid, error_message_if_invalid)
        """
        ...

    def create_date_conflict_flag(
        self, lot: Lot, production_date: date, ship_date: date
    ) -> DataIntegrityFlag:
        """Create a date conflict integrity flag."""
        ...

    def get_validation_summary(self) -> dict[str, int]:
        """Get summary of validation results."""
        ...

"""Data Integration Service for joining and consolidating data."""

from datetime import date
from typing import Any

from src.models.lot import Lot
from src.models.production_record import ProductionRecord
from src.models.quality_record import QualityRecord
from src.models.shipping_record import ShippingRecord


class DataIntegrationService:
    """Service for integrating data from three sources using composite keys."""

    def integrate_all_sources(
        self,
        production_records: list[ProductionRecord],
        quality_records: list[QualityRecord],
        shipping_records: list[ShippingRecord],
    ) -> list[dict[str, Any]]:
        """
        Create integrated view using composite key (Lot ID + Date).

        (AC 2: Data must be joined using composite key of Lot ID and Date)

        Args:
            production_records: Production data from file
            quality_records: Quality inspection data from file
            shipping_records: Shipping data from file

        Returns:
            List of integrated records
        """
        ...

    def get_composite_key(
        self, lot_code: str, production_date: date
    ) -> tuple[str, date]:
        """Get composite key (lot_code, production_date)."""
        ...

    def create_lot_from_production(self, production_record: dict[str, Any]) -> Lot:
        """Create a Lot entity from a production record."""
        ...

    def join_production_quality(
        self,
        production_records: list[ProductionRecord],
        quality_records: list[QualityRecord],
    ) -> dict[tuple[str, date], dict[str, Any]]:
        """
        Join production and quality records on composite key.

        Returns:
            Dictionary mapping composite key to joined record
        """
        ...

    def join_with_shipping(
        self,
        integrated_records: dict[tuple[str, date], dict[str, Any]],
        shipping_records: list[ShippingRecord],
    ) -> dict[tuple[str, date], dict[str, Any]]:
        """
        Join the integrated records with shipping data on composite key.

        Returns:
            Dictionary mapping composite key to fully integrated record
        """
        ...

    def build_integrated_record(
        self,
        lot: Lot,
        production_record: ProductionRecord | None,
        quality_record: QualityRecord | None,
        shipping_record: ShippingRecord | None,
    ) -> dict[str, Any]:
        """Build a single integrated record from components."""
        ...

    def get_integration_statistics(self) -> dict[str, int]:
        """Get statistics about the last integration."""
        ...

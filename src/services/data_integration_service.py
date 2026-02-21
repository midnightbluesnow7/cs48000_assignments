"""Data Integration Service for joining and consolidating data."""

from typing import List, Dict, Any, Optional
from datetime import date
from src.models.lot import Lot
from src.models.production_record import ProductionRecord
from src.models.quality_record import QualityRecord
from src.models.shipping_record import ShippingRecord


class DataIntegrationService:
    """Service for integrating data from three sources using composite keys."""
    
    def integrate_all_sources(
        self,
        production_records: List[ProductionRecord],
        quality_records: List[QualityRecord],
        shipping_records: List[ShippingRecord]
    ) -> List[Dict[str, Any]]:
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
        pass
    
    def get_composite_key(self, lot_code: str, production_date: date) -> tuple:
        """Get composite key (lot_code, production_date)."""
        pass
    
    def create_lot_from_production(self, production_record: Dict[str, Any]) -> Lot:
        """Create a Lot entity from a production record."""
        pass
    
    def join_production_quality(
        self,
        production_records: List[ProductionRecord],
        quality_records: List[QualityRecord]
    ) -> Dict[tuple, Dict[str, Any]]:
        """
        Join production and quality records on composite key.
        
        Returns:
            Dictionary mapping composite key to joined record
        """
        pass
    
    def join_with_shipping(
        self,
        integrated_records: Dict[tuple, Dict[str, Any]],
        shipping_records: List[ShippingRecord]
    ) -> Dict[tuple, Dict[str, Any]]:
        """
        Join the integrated records with shipping data on composite key.
        
        Returns:
            Dictionary mapping composite key to fully integrated record
        """
        pass
    
    def build_integrated_record(
        self,
        lot: Lot,
        production_record: Optional[ProductionRecord],
        quality_record: Optional[QualityRecord],
        shipping_record: Optional[ShippingRecord]
    ) -> Dict[str, Any]:
        """Build a single integrated record from components."""
        pass
    
    def get_integration_statistics(self) -> Dict[str, int]:
        """Get statistics about the last integration."""
        pass

"""Conflict Resolution Service for handling missing data and inconsistencies."""

from typing import List, Dict, Any, Optional
from src.models.lot import Lot
from src.models.data_integrity_flag import DataIntegrityFlag


class ConflictResolutionService:
    """Service for resolving conflicts and handling missing data."""
    
    def resolve_missing_quality_records(
        self,
        integrated_records: Dict[tuple, Dict[str, Any]]
    ) -> List[DataIntegrityFlag]:
        """
        Handle missing quality records (AC 2: Conflict Resolution).
        
        If a Lot ID exists in Production but is missing in Quality,
        the record must still appear but be flagged as "Pending Inspection."
        
        Args:
            integrated_records: Dictionary of integrated records
        
        Returns:
            List of DataIntegrityFlag for missing quality records
        """
        pass
    
    def resolve_missing_shipping_records(
        self,
        integrated_records: Dict[tuple, Dict[str, Any]]
    ) -> List[DataIntegrityFlag]:
        """
        Identify lots that appear in Shipping but have no Quality record.
        
        (AC 4: Data Integrity Flags highlight any Lot IDs in Shipping
        with no corresponding Quality record)
        
        Args:
            integrated_records: Dictionary of integrated records
        
        Returns:
            List of DataIntegrityFlag for inconsistencies
        """
        pass
    
    def flag_lot_pending_inspection(self, lot: Lot) -> None:
        """Mark a lot as pending inspection."""
        pass
    
    def create_pending_inspection_flag(self, lot: Lot) -> DataIntegrityFlag:
        """Create a 'Pending Inspection' flag for a lot."""
        pass
    
    def create_missing_quality_flag(self, lot: Lot) -> DataIntegrityFlag:
        """Create a 'Missing Quality' integrity flag."""
        pass
    
    def create_missing_shipping_flag(self, lot: Lot) -> DataIntegrityFlag:
        """Create a 'Missing Shipping' integrity flag."""
        pass
    
    def handle_orphaned_records(
        self,
        production_only: List[Lot],
        quality_only: List[Lot],
        shipping_only: List[Lot]
    ) -> List[DataIntegrityFlag]:
        """
        Handle records that exist in only one source.
        
        Returns:
            List of created DataIntegrityFlag objects
        """
        pass

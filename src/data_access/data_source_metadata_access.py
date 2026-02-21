"""Data Source Metadata Data Access Layer."""

from typing import List, Optional
from datetime import datetime
from src.data_access.base import BaseDataAccess
from src.models.data_source import DataSource


class DataSourceMetadataAccess(BaseDataAccess):
    """Data access for Data Source Metadata."""
    
    def create(self, data_source: DataSource) -> int:
        """Create a data source metadata record and return its ID."""
        pass
    
    def read_by_id(self, metadata_id: int) -> Optional[DataSource]:
        """Read a data source metadata by ID."""
        pass
    
    def read_by_source_name(self, source_name: str) -> Optional[DataSource]:
        """Read data source metadata by source name."""
        pass
    
    def update(self, data_source: DataSource) -> bool:
        """Update a data source metadata record."""
        pass
    
    def delete(self, metadata_id: int) -> bool:
        """Delete a data source metadata record by ID."""
        pass
    
    def read_all(self) -> List[DataSource]:
        """Read all data source metadata records."""
        pass
    
    def update_last_updated_timestamp(self, source_name: str, timestamp: datetime) -> bool:
        """Update the last updated timestamp for a data source."""
        pass
    
    def update_refresh_status(self, source_name: str, status: str) -> bool:
        """Update the refresh status for a data source."""
        pass
    
    def get_source_health_dashboard(self) -> dict:
        """
        Get status dashboard showing all data sources and their health.
        
        Returns:
            Dictionary mapping source name to health info (status, last_updated)
        """
        pass
    
    def get_stale_sources(self, stale_threshold_hours: int = 24) -> List[DataSource]:
        """Get data sources that haven't been updated within threshold."""
        pass
    
    def mark_all_sources_as_updating(self) -> None:
        """Mark all sources as currently updating."""
        pass

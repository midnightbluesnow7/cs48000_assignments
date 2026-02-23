"""Quality Inspection Record domain model."""

from dataclasses import dataclass
from datetime import date, datetime


@dataclass
class QualityRecord:
    """
    Quality inspection record from Quality Inspection files (XLSX/CSV).

    Primary Key:
    - lot_id (foreign key to Lot)
    - inspection_date
    """

    lot_id: int
    inspection_date: date
    is_pass: bool
    inspector_id: str
    source_updated_timestamp: datetime
    defect_type: str | None = None
    defect_count: int = 0
    id: int | None = None

    def is_valid(self) -> bool:
        """Validate quality record constraints."""
        ...

    def get_defect_description(self) -> str:
        """Get human-readable defect description."""
        ...

    def is_passing(self) -> bool:
        """Check if quality inspection passed."""
        ...

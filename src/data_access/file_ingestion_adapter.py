"""File Ingestion Adapter for reading from XLSX and CSV files."""

from typing import Any


class FileIngestionAdapter:
    """Adapter for reading data from XLSX and CSV files."""

    def __init__(self, source_location: str, file_format: str):
        """
        Initialize file ingestion adapter.

        Args:
            source_location: Path to file or directory
            file_format: File format ('XLSX', 'CSV')
        """
        self.source_location = source_location
        self.file_format = file_format.upper()

    def read_production_logs(self) -> list[dict[str, Any]]:
        """
        Read production logs from file.

        Returns:
            List of dictionaries representing production records
        """
        ...

    def read_quality_logs(self) -> list[dict[str, Any]]:
        """
        Read quality inspection logs from file.

        Returns:
            List of dictionaries representing quality records
        """
        ...

    def read_shipping_logs(self) -> list[dict[str, Any]]:
        """
        Read shipping logs from file.

        Returns:
            List of dictionaries representing shipping records
        """
        ...

    def _read_xlsx_file(
        self, file_path: str, sheet_name: str | None = None
    ) -> list[dict[str, Any]]:
        """
        Read data from XLSX file.

        Args:
            file_path: Path to XLSX file
            sheet_name: Name of sheet to read (optional)

        Returns:
            List of rows as dictionaries
        """
        ...

    def _read_csv_file(self, file_path: str) -> list[dict[str, Any]]:
        """
        Read data from CSV file.

        Args:
            file_path: Path to CSV file

        Returns:
            List of rows as dictionaries
        """
        ...

    def validate_file_exists(self) -> bool:
        """Validate that the file or directory exists."""
        ...

    def get_file_modification_time(self, file_path: str) -> str:
        """Get the file modification time."""
        ...

"""Reusable UI widgets for the dashboard."""

import streamlit as st
from typing import List, Dict, Any
from datetime import date


class ProductionHealthWidget:
    """Widget for displaying production health metrics."""
    
    @staticmethod
    def render_error_rate_by_line(data: List[Dict[str, Any]]) -> None:
        """
        Render production line error rates.
        
        (AC 3.1: Which production lines have highest error rates per week)
        
        Args:
            data: List of line health records
        """
        pass
    
    @staticmethod
    def render_error_trend_chart(data: List[Dict[str, Any]]) -> None:
        """Render error trend chart over time."""
        pass
    
    @staticmethod
    def render_line_comparison_table(data: List[Dict[str, Any]]) -> None:
        """Render table comparing all production lines."""
        pass


class DefectTrendingWidget:
    """Widget for displaying defect trending analysis."""
    
    @staticmethod
    def render_defect_by_type(data: Dict[str, List[Dict[str, Any]]]) -> None:
        """
        Render visual breakdown of defect types over time.
        
        (AC 3.2: Visual breakdown of defect types (Cosmetic vs Functional) over time)
        
        Args:
            data: Dictionary mapping defect type to trend data
        """
        pass
    
    @staticmethod
    def render_defect_distribution_pie(data: Dict[str, int]) -> None:
        """Render pie chart of defect type distribution."""
        pass
    
    @staticmethod
    def render_defect_timeline(data: Dict[str, List[Dict[str, Any]]]) -> None:
        """Render timeline of defects over period."""
        pass


class ShipmentSearchWidget:
    """Widget for searching and displaying shipment status."""
    
    @staticmethod
    def render_search_box() -> str:
        """
        Render lot ID search box.
        
        (AC 3.3: Search function where entering Lot ID returns current status)
        
        Returns:
            The search query (lot ID) entered by user
        """
        pass
    
    @staticmethod
    def render_lot_status_result(lot_data: Dict[str, Any]) -> None:
        """
        Render search result showing lot status.
        
        Returns status like: In Production, Failed Quality, or Shipped
        
        Args:
            lot_data: Dictionary with lot information
        """
        pass
    
    @staticmethod
    def render_lot_timeline(lot_id: str) -> None:
        """Render timeline of lot through production, quality, and shipping."""
        pass


class SourceHealthWidget:
    """Widget for displaying data source health."""
    
    @staticmethod
    def render_source_health_dashboard(health_data: Dict[str, Dict[str, Any]]) -> None:
        """
        Render Source Health indicator dashboard.
        
        (AC 4: Simple Source Health indicator showing Last Updated timestamp
        for each of three spreadsheets)
        
        Args:
            health_data: Dictionary mapping source name to health info
        """
        pass
    
    @staticmethod
    def render_health_indicator(source_name: str, status: str, last_updated: str) -> None:
        """Render individual source health indicator."""
        pass
    
    @staticmethod
    def render_refresh_status(status_info: str) -> None:
        """Render refresh status and timestamp information."""
        pass


class DataIntegrityWidget:
    """Widget for displaying data integrity issues."""
    
    @staticmethod
    def render_integrity_summary(integrity_data: Dict[str, Any]) -> None:
        """
        Render summary of data integrity issues.
        
        (AC 4: Highlight Lot IDs appearing in Shipping but missing from Quality,
        and records with ship date before production date)
        
        Args:
            integrity_data: Dictionary with integrity issue summary
        """
        pass
    
    @staticmethod
    def render_missing_quality_flags(lot_ids: List[str]) -> None:
        """Render list of lots with missing quality records."""
        pass
    
    @staticmethod
    def render_date_conflict_flags(conflicts: List[Dict[str, Any]]) -> None:
        """Render list of date conflicts."""
        pass
    
    @staticmethod
    def render_integrity_issues_table(issues: List[Dict[str, Any]]) -> None:
        """Render table of all integrity issues."""
        pass


class LoadingWidget:
    """Widget for showing loading states."""
    
    @staticmethod
    def show_loading_spinner(message: str = "Loading...") -> None:
        """Show loading spinner with message."""
        pass
    
    @staticmethod
    def show_progress_bar(progress: float) -> None:
        """Show progress bar (0.0 to 1.0)."""
        pass

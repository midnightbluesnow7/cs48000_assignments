"""Application configuration."""

import os
from pathlib import Path


class Config:
    """Base configuration."""
    
    # Database configuration
    DATABASE_URL: str = os.getenv("DATABASE_URL", "postgresql://localhost/steelworks_ops")
    
    # File source locations
    PRODUCTION_LOG_PATH: str = os.getenv("PRODUCTION_LOG_PATH", "./data/production_logs")
    QUALITY_LOG_PATH: str = os.getenv("QUALITY_LOG_PATH", "./data/quality_logs")
    SHIPPING_LOG_PATH: str = os.getenv("SHIPPING_LOG_PATH", "./data/shipping_logs")
    
    # Data source metadata
    PRODUCTION_LOGS_SOURCE_NAME: str = "Production Logs"
    QUALITY_LOGS_SOURCE_NAME: str = "Quality Inspection"
    SHIPPING_LOGS_SOURCE_NAME: str = "Shipping Logs"
    
    # Data refresh configuration
    AUTO_REFRESH_ENABLED: bool = os.getenv("AUTO_REFRESH_ENABLED", "True").lower() == "true"
    REFRESH_INTERVAL_HOURS: int = int(os.getenv("REFRESH_INTERVAL_HOURS", "24"))
    STALE_DATA_THRESHOLD_HOURS: int = int(os.getenv("STALE_DATA_THRESHOLD_HOURS", "24"))
    
    # UI configuration
    STREAMLIT_PAGE_CONFIG_LAYOUT: str = os.getenv("STREAMLIT_PAGE_CONFIG_LAYOUT", "wide")
    
    # Data validation
    ENABLE_DATA_VALIDATION: bool = os.getenv("ENABLE_DATA_VALIDATION", "True").lower() == "true"
    ENABLE_CONFLICT_RESOLUTION: bool = os.getenv("ENABLE_CONFLICT_RESOLUTION", "True").lower() == "true"


class DevelopmentConfig(Config):
    """Development configuration."""
    
    DEBUG: bool = True
    DATABASE_URL: str = "postgresql://localhost/steelworks_ops_dev"


class ProductionConfig(Config):
    """Production configuration."""
    
    DEBUG: bool = False


class TestingConfig(Config):
    """Testing configuration."""
    
    TESTING: bool = True
    DATABASE_URL: str = "postgresql://localhost/steelworks_ops_test"


def get_config() -> Config:
    """Get configuration based on environment."""
    env = os.getenv("FLASK_ENV", "development")
    
    if env == "production":
        return ProductionConfig()
    elif env == "testing":
        return TestingConfig()
    else:
        return DevelopmentConfig()

from api.routes.health import health_bp
from api.routes.scans import scans_bp
from api.routes.servers import servers_bp

__all__ = ["health_bp", "servers_bp", "scans_bp"]

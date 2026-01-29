from flask import Flask, jsonify
from flask_cors import CORS

from api.routes.health import health_bp
from api.routes.servers import servers_bp


def create_app() -> Flask:
    app = Flask(__name__)
    app.config.from_mapping(JSON_SORT_KEYS=False)

    CORS(app)

    app.register_blueprint(health_bp)
    app.register_blueprint(servers_bp, url_prefix="/servers")

    _register_error_handlers(app)

    return app


def _register_error_handlers(app: Flask) -> None:
    @app.errorhandler(400)
    def bad_request(error):
        return jsonify({"error": "Bad request"}), 400

    @app.errorhandler(404)
    def not_found(error):
        return jsonify({"error": "Not found"}), 404

    @app.errorhandler(500)
    def internal_error(error):
        return jsonify({"error": "Internal server error"}), 500

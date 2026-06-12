"""
app.py - Flask application entry point
"""

import logging
from flask import Flask, request, jsonify, render_template
from recommendation.recommender import recommender

app = Flask(__name__)
app.config["JSON_SORT_KEYS"] = False

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s  %(levelname)-8s  %(message)s",
    datefmt="%Y-%m-%d %H:%M:%S",
)
logger = logging.getLogger(__name__)


def _error_response(message: str, status: int = 400):
    return jsonify({"success": False, "error": message}), status


@app.route("/")
def index():
    stats = recommender.get_stats()
    return render_template("index.html", stats=stats)


@app.route("/api/recommend", methods=["POST"])
def api_recommend():
    data = request.get_json(silent=True)
    if not data:
        return _error_response("Request body must be valid JSON.")

    user_query = data.get("query", "").strip()
    if not user_query:
        return _error_response("The 'query' field is required.")

    try:
        top_n = int(data.get("top_n", 5))
        top_n = max(1, min(top_n, 20))
    except (TypeError, ValueError):
        top_n = 5

    category_filter = data.get("category", None)

    logger.info("Request | query=%r top_n=%d category=%r",
                user_query, top_n, category_filter)

    try:
        results = recommender.recommend(
            user_query=user_query,
            top_n=top_n,
            category_filter=category_filter,
        )
    except ValueError as exc:
        return _error_response(str(exc), 400)
    except RuntimeError as exc:
        return _error_response(str(exc), 500)

    if not results:
        return jsonify({
            "success": True,
            "query": user_query,
            "total_results": 0,
            "recommendations": [],
            "message": "No courses matched your query.",
        })

    return jsonify({
        "success": True,
        "query": user_query,
        "total_results": len(results),
        "recommendations": results,
    })


@app.route("/api/categories", methods=["GET"])
def api_categories():
    categories = recommender.get_categories()
    return jsonify({"success": True, "categories": categories})


@app.route("/api/stats", methods=["GET"])
def api_stats():
    stats = recommender.get_stats()
    return jsonify({"success": True, "stats": stats})


@app.route("/health", methods=["GET"])
def health_check():
    return jsonify({
        "status": "healthy",
        "recommender_ready": recommender.is_ready,
    })


@app.errorhandler(404)
def not_found(error):
    return _error_response("Endpoint not found.", 404)


@app.errorhandler(500)
def internal_error(error):
    return _error_response("An unexpected server error occurred.", 500)


if __name__ == "__main__":
    logger.info("Starting AI Recommendation Logic server...")
    app.run(debug=True, host="0.0.0.0", port=5000)
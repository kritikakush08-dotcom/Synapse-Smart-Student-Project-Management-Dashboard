from flask import Flask, render_template, request, jsonify
from analytics import (
    get_summary,
    twin_primes,
    permutations,
    combinations,
    list_operations,
    employee_analysis,
    make_chart_data,
    analyze_csv,
)
import os

app = Flask(__name__)
app.config["MAX_CONTENT_LENGTH"] = 5 * 1024 * 1024


@app.route("/")
def home():
    return render_template("index.html")


@app.route("/api/summary")
def summary():
    return jsonify(get_summary())


@app.route("/api/twin-primes")
def primes():
    try:
        limit = int(request.args.get("limit", 100))
        if not 3 <= limit <= 1000:
            raise ValueError("Limit must be between 3 and 1000")
        return jsonify({"pairs": twin_primes(limit)})
    except (ValueError, TypeError) as error:
        return jsonify({"error": str(error)}), 400


@app.route("/api/combinatorics", methods=["POST"])
def combinatorics():
    data = request.get_json(silent=True) or {}

    try:
        n = int(data.get("n", 5))
        r = int(data.get("r", 2))

        if not 0 <= n <= 170 or not 0 <= r <= n:
            raise ValueError("Use 0 <= r <= n <= 170")

        return jsonify({
            "n": n,
            "r": r,
            "permutations": permutations(n, r),
            "combinations": combinations(n, r),
        })
    except (ValueError, TypeError) as error:
        return jsonify({"error": str(error)}), 400


@app.route("/api/list-lab", methods=["POST"])
def list_lab():
    data = request.get_json(silent=True) or {}

    try:
        values = data.get("values", [4, 2, 8, 6, 3])
        if not isinstance(values, list) or len(values) > 500:
            raise ValueError("Provide a list with at most 500 numbers")

        values = [float(x) for x in values]
        if any(not __import__("math").isfinite(x) for x in values):
            raise ValueError("All numbers must be finite")

        return jsonify(list_operations(values))
    except (ValueError, TypeError) as error:
        return jsonify({"error": str(error)}), 400


@app.route("/api/employees")
def employees():
    return jsonify(employee_analysis())


@app.route("/api/chart")
def chart():
    chart_type = request.args.get("type", "bar")
    allowed = {"bar", "pie", "line", "scatter", "histogram"}

    if chart_type not in allowed:
        return jsonify({"error": "Unsupported chart type"}), 400

    return jsonify(make_chart_data(chart_type))


@app.route("/api/upload-csv", methods=["POST"])
def upload_csv():
    uploaded = request.files.get("file")

    if not uploaded or not uploaded.filename:
        return jsonify({"error": "Please select a CSV file"}), 400

    if not uploaded.filename.lower().endswith(".csv"):
        return jsonify({"error": "Only CSV files are accepted"}), 400

    try:
        result = analyze_csv(uploaded)
        return jsonify(result)
    except Exception as error:
        app.logger.warning("CSV processing failed: %s", error)
        return jsonify({
            "error": "Could not process this CSV. Check its format and contents."
        }), 400


if __name__ == "__main__":
    app.run(debug=True)
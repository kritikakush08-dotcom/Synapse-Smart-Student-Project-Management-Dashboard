import math
import numpy as np
import pandas as pd


def get_summary():
    marks = np.array([78, 85, 92, 67, 88, 74, 95, 81])

    return {
        "average": round(float(np.mean(marks)), 2),
        "highest": int(np.max(marks)),
        "lowest": int(np.min(marks)),
        "total": int(np.sum(marks)),
        "count": int(len(marks)),
    }


def twin_primes(limit=1000):
    def is_prime(n):
        if n < 2:
            return False
        for i in range(2, int(math.sqrt(n)) + 1):
            if n % i == 0:
                return False
        return True

    return [
        [n, n + 2]
        for n in range(3, limit - 1, 2)
        if is_prime(n) and is_prime(n + 2)
    ]


def factorial(n):
    if n < 0:
        raise ValueError("Number cannot be negative")
    return math.factorial(n)


def permutations(n, r):
    validate_nr(n, r)
    return math.factorial(n) // math.factorial(n - r)


def combinations(n, r):
    validate_nr(n, r)
    return math.comb(n, r)


def validate_nr(n, r):
    if n < 0 or r < 0 or r > n:
        raise ValueError("Require n >= r >= 0")


def list_operations(values):
    values = list(values)
    return {
        "original": values,
        "sorted": sorted(values),
        "reversed": list(reversed(values)),
        "length": len(values),
        "sum": sum(values),
        "squares": [x * x for x in values],
        "even_numbers": list(filter(lambda x: x % 2 == 0, values)),
        "doubled": list(map(lambda x: x * 2, values)),
    }


def employee_analysis():
    df = pd.DataFrame({
        "Name": ["Aarav", "Diya", "Kabir", "Meera", "Riya"],
        "Department": ["Sales", "IT", "Sales", "HR", "Sales"],
        "Salary": [35000, 50000, None, 40000, 45000],
    })

    median_salary = df["Salary"].median()
    df["Salary"] = df["Salary"].fillna(median_salary)

    sales = df[df["Department"] == "Sales"]

    return {
        "records": df.to_dict(orient="records"),
        "sales_average": round(float(sales["Salary"].mean()), 2),
        "salary_median": float(median_salary),
        "row_count": len(df),
    }


def make_chart_data(chart_type="bar"):
    subjects = ["Python", "Analytics", "OOP", "Visualization"]
    marks = [82, 91, 76, 88]

    if chart_type == "pie":
        return {
            "type": "pie",
            "labels": subjects,
            "values": marks,
        }

    if chart_type == "line":
        return {
            "type": "line",
            "labels": subjects,
            "values": marks,
        }

    if chart_type == "scatter":
        return {
            "type": "scatter",
            "labels": list(range(1, len(marks) + 1)),
            "values": marks,
        }

    if chart_type == "histogram":
        return {
            "type": "histogram",
            "labels": [str(x) for x in marks],
            "values": marks,
        }

    return {
        "type": "bar",
        "labels": subjects,
        "values": marks,
    }


def analyze_csv(file):
    df = pd.read_csv(file)

    preview = df.head(100).copy()
    preview = preview.astype(object).where(pd.notna(preview), None)

    numeric = df.select_dtypes(include="number")

    return {
        "columns": list(df.columns),
        "records": preview.to_dict(orient="records"),
        "rows": int(len(df)),
        "missing_values": {
            str(k): int(v)
            for k, v in df.isna().sum().items()
        },
        "numeric_summary": (
            numeric.describe().round(2).to_dict()
            if not numeric.empty else {}
        ),
    }
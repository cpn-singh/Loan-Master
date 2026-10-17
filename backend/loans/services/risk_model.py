"""Train and serve an advisory model from observed loan outcomes only."""

import hashlib
import json
import math
import random
from datetime import timedelta
from pathlib import Path

from django.conf import settings
from django.utils import timezone

from ..models import Loan, Repayment

FEATURE_NAMES = (
    "amount_requested",
    "annual_income",
    "monthly_debt",
    "term_months",
    "monthly_payment_estimate",
    "payment_to_income_percent",
    "total_debt_to_income_percent",
)
MINIMUM_TRAINING_SAMPLES = 50
MINIMUM_SAMPLES_PER_CLASS = 15
MODEL_FILE = Path(settings.BASE_DIR) / "ml_artifacts" / "risk_model.json"


def _features(application):
    monthly_income = float(application.annual_income) / 12
    monthly_payment = float(application.monthly_payment_estimate)
    monthly_debt = float(application.monthly_debt)
    payment_ratio = monthly_payment / monthly_income * 100 if monthly_income else 0
    debt_ratio = (monthly_payment + monthly_debt) / monthly_income * 100 if monthly_income else 0
    return [
        float(application.amount_requested),
        float(application.annual_income),
        monthly_debt,
        float(application.term_months),
        monthly_payment,
        payment_ratio,
        debt_ratio,
    ]


def _observed_outcome(loan, today):
    """Return 1 for observed 90-day delinquency, 0 for clean payoff, else None."""
    repayments = list(loan.repayments.all())
    ninety_days_ago = today - timedelta(days=90)

    had_serious_delinquency = any(
        (
            repayment.status != Repayment.Status.PAID
            and repayment.amount_paid < repayment.amount_due
            and repayment.due_date <= ninety_days_ago
        )
        or (
            repayment.paid_at is not None
            and timezone.localdate(repayment.paid_at)
            > repayment.due_date + timedelta(days=90)
        )
        for repayment in repayments
    )
    if had_serious_delinquency:
        return 1
    if loan.status == Loan.Status.PAID and repayments and all(
        repayment.status == Repayment.Status.PAID for repayment in repayments
    ):
        return 0
    return None


def _training_rows():
    today = timezone.localdate()
    rows = []
    fingerprint_parts = []
    loans = Loan.objects.select_related("application").prefetch_related("repayments")
    for loan in loans:
        outcome = _observed_outcome(loan, today)
        if outcome is None:
            continue
        rows.append((_features(loan.application), outcome))
        fingerprint_parts.append(f"{loan.pk}:{outcome}:{loan.application.updated_at.isoformat()}")

    fingerprint = hashlib.sha256("|".join(sorted(fingerprint_parts)).encode()).hexdigest()
    return rows, fingerprint


def _read_model():
    try:
        return json.loads(MODEL_FILE.read_text(encoding="utf-8"))
    except (OSError, json.JSONDecodeError):
        return None


def _usable_model(artifact):
    return bool(
        artifact
        and artifact.get("version") == 1
        and all(
            key in artifact
            for key in ("mean", "scale", "coefficients", "intercept")
        )
    )


def model_status():
    rows, fingerprint = _training_rows()
    default_count = sum(label for _, label in rows)
    repaid_count = len(rows) - default_count
    artifact = _read_model()
    trained = _usable_model(artifact)
    data_current = bool(
        trained and artifact.get("source_fingerprint") == fingerprint
    )
    stale = trained and not data_current
    enough_data = (
        len(rows) >= MINIMUM_TRAINING_SAMPLES
        and default_count >= MINIMUM_SAMPLES_PER_CLASS
        and repaid_count >= MINIMUM_SAMPLES_PER_CLASS
    )
    if data_current:
        message = "The risk model is trained on observed loan outcomes. Its result is advisory and requires staff review."
    elif stale:
        message = "A saved model is available, but the historical outcomes have changed. Retrain it when enough records are available."
    elif not enough_data:
        message = (
            f"Not enough observed outcomes to train. Found {len(rows)} eligible loans "
            f"({default_count} seriously delinquent, {repaid_count} repaid). Need at least "
            f"{MINIMUM_TRAINING_SAMPLES} total and {MINIMUM_SAMPLES_PER_CLASS} in each group."
        )
    else:
        message = "Enough observed outcomes are available. Train the model to use the current backend data."

    return {
        "trained": trained,
        "stale_model_exists": stale,
        "data_current": data_current,
        "can_train": enough_data,
        "sample_count": len(rows),
        "delinquent_count": default_count,
        "repaid_count": repaid_count,
        "minimum_samples": MINIMUM_TRAINING_SAMPLES,
        "minimum_per_class": MINIMUM_SAMPLES_PER_CLASS,
        "trained_at": artifact.get("trained_at") if trained else None,
        "balanced_accuracy": artifact.get("balanced_accuracy") if trained else None,
        "message": message,
        "limitations": "Training labels come only from previously issued loans with mature repayment outcomes; this can reflect past approval bias. The score is advisory, not an approval decision.",
    }


def train_model():
    rows, fingerprint = _training_rows()
    labels = [label for _, label in rows]
    delinquent_count = sum(labels)
    repaid_count = len(labels) - delinquent_count
    if (
        len(rows) < MINIMUM_TRAINING_SAMPLES
        or delinquent_count < MINIMUM_SAMPLES_PER_CLASS
        or repaid_count < MINIMUM_SAMPLES_PER_CLASS
    ):
        return model_status()

    feature_rows = [features for features, _ in rows]
    rows_by_class = {
        label: [(features, target) for features, target in rows if target == label]
        for label in (0, 1)
    }
    random_generator = random.Random(42)
    training_rows = []
    testing_rows = []
    for class_rows in rows_by_class.values():
        random_generator.shuffle(class_rows)
        test_count = max(1, round(len(class_rows) * 0.2))
        testing_rows.extend(class_rows[:test_count])
        training_rows.extend(class_rows[test_count:])

    evaluation_model = _fit_logistic_regression(training_rows)
    correct_by_class = {0: [], 1: []}
    for features, target in testing_rows:
        predicted = int(_predict_probability(features, evaluation_model) >= 0.5)
        correct_by_class[target].append(predicted == target)
    balanced_accuracy = sum(
        sum(correct_by_class[label]) / len(correct_by_class[label])
        for label in (0, 1)
    ) / 2
    final_model = _fit_logistic_regression(rows)
    artifact = {
        "version": 1,
        "features": FEATURE_NAMES,
        **final_model,
        "training_sample_count": len(rows),
        "source_fingerprint": fingerprint,
        "balanced_accuracy": round(balanced_accuracy, 3),
        "trained_at": timezone.now().isoformat(),
    }
    MODEL_FILE.parent.mkdir(parents=True, exist_ok=True)
    temporary_file = MODEL_FILE.with_suffix(".tmp")
    temporary_file.write_text(json.dumps(artifact), encoding="utf-8")
    temporary_file.replace(MODEL_FILE)
    return model_status()


def _fit_logistic_regression(rows):
    """Fit a small balanced logistic regression using only Python's stdlib."""
    feature_count = len(FEATURE_NAMES)
    means = [sum(row[0][index] for row in rows) / len(rows) for index in range(feature_count)]
    scales = []
    for index, mean in enumerate(means):
        variance = sum((row[0][index] - mean) ** 2 for row in rows) / len(rows)
        scales.append(math.sqrt(variance) or 1.0)
    standardized_rows = [
        ([(value - means[index]) / scales[index] for index, value in enumerate(features)], label)
        for features, label in rows
    ]
    counts = {label: sum(target == label for _, target in rows) for label in (0, 1)}
    class_weights = {
        label: len(rows) / (2 * counts[label]) for label in (0, 1)
    }
    coefficients = [0.0] * feature_count
    intercept = 0.0
    learning_rate = 0.05
    regularization = 0.01
    for _ in range(800):
        coefficient_gradients = [0.0] * feature_count
        intercept_gradient = 0.0
        for features, label in standardized_rows:
            log_odds = intercept + sum(
                coefficient * value
                for coefficient, value in zip(coefficients, features)
            )
            probability = 1 / (1 + math.exp(-max(-35, min(35, log_odds))))
            error = (probability - label) * class_weights[label]
            intercept_gradient += error
            for index, value in enumerate(features):
                coefficient_gradients[index] += error * value
        row_count = len(standardized_rows)
        intercept -= learning_rate * intercept_gradient / row_count
        coefficients = [
            coefficient
            - learning_rate
            * (coefficient_gradients[index] / row_count + regularization * coefficient)
            for index, coefficient in enumerate(coefficients)
        ]
    return {
        "mean": means,
        "scale": scales,
        "coefficients": coefficients,
        "intercept": intercept,
    }


def _predict_probability(features, artifact):
    standardized = [
        (value - mean) / scale if scale else 0
        for value, mean, scale in zip(features, artifact["mean"], artifact["scale"])
    ]
    log_odds = artifact["intercept"] + sum(
        coefficient * value
        for coefficient, value in zip(artifact["coefficients"], standardized)
    )
    return 1 / (1 + math.exp(-max(-35, min(35, log_odds))))


def assess_application(application):
    status = model_status()
    artifact = _read_model() if status["trained"] else None
    if not artifact:
        return {
            "score": None,
            "recommendation": "",
            "factors": [
                "No current trained model is available. This application remains in the staff review queue."
            ],
        }

    values = _features(application)
    delinquency_probability = _predict_probability(values, artifact)
    estimated_repayment_capacity = max(0, 100 - values[6])
    if delinquency_probability >= 0.5:
        recommendation = "higher_risk"
    elif delinquency_probability >= 0.25:
        recommendation = "review"
    else:
        recommendation = "lower_risk"
    factors = [
        f"Model-estimated serious-delinquency probability: {delinquency_probability:.1%}.",
        f"Estimated loan payment plus existing debt is {values[6]:.1f}% of gross monthly income.",
        f"Estimated gross-income share remaining after those payments: {estimated_repayment_capacity:.1f}%.",
        "Model output is advisory and must not approve or reject an application automatically.",
    ]
    if status["stale_model_exists"]:
        factors.append("New historical outcomes are available; a staff member should account for the model being due for retraining.")
    return {
        "score": round((1 - delinquency_probability) * 100),
        "recommendation": recommendation,
        "factors": factors,
    }

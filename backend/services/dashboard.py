"""Numbers for the dashboard page.

Everything is grouped in the viewer's own timezone (the frontend sends it as `tz`),
so "today", days and months line up with the user's clock rather than UTC.
"""
from dataclasses import dataclass
from datetime import UTC, date, datetime, time, timedelta
from zoneinfo import ZoneInfo, ZoneInfoNotFoundError

SHORT_MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]
LONG_MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August",
               "September", "October", "November", "December"]
PRIORITIES = ("high", "medium", "low")


def get_timezone(name, fallback):
    # Unknown or malformed names fall back instead of failing the whole request
    for candidate in (name, fallback):
        if not candidate:
            continue
        try:
            return ZoneInfo(candidate)
        except (ZoneInfoNotFoundError, ValueError):
            continue
    return ZoneInfo("UTC")


@dataclass
class Period:
    label: str            # "Full Year 2026", "Q2 2026", "April 2026"
    compare_label: str    # "last year", "last quarter", "last month"
    start: datetime       # local, inclusive
    end: datetime         # local, exclusive
    previous_start: datetime
    previous_end: datetime
    buckets: list         # [(label, full_label, start, end)] - one point on the activity chart each


def _shift_month(year, month, delta):
    index = year * 12 + (month - 1) + delta
    return index // 12, index % 12 + 1


def _midnight(day: date, tz):
    return datetime.combine(day, time(), tzinfo=tz)


def _month_start(year, month, tz):
    return _midnight(date(year, month, 1), tz)


def _month_buckets(year, first_month, count, tz):
    buckets = []
    for offset in range(count):
        y, m = _shift_month(year, first_month, offset)
        buckets.append((SHORT_MONTHS[m - 1], f"{LONG_MONTHS[m - 1]} {y}",
                        _month_start(y, m, tz), _month_start(*_shift_month(y, m, 1), tz)))
    return buckets


def build_period(year, quarter, month, tz) -> Period:
    # A month narrows further than a quarter; with neither, the whole year is used
    if month:
        start = _month_start(year, month, tz)
        end = _month_start(*_shift_month(year, month, 1), tz)
        days = [date(year, month, 1) + timedelta(days=i) for i in range((end.date() - start.date()).days)]
        buckets = [(str(day.day), f"{day.day} {SHORT_MONTHS[month - 1]} {year}",
                    _midnight(day, tz), _midnight(day + timedelta(days=1), tz)) for day in days]
        return Period(f"{LONG_MONTHS[month - 1]} {year}", "last month", start, end,
                      _month_start(*_shift_month(year, month, -1), tz), start, buckets)

    if quarter:
        first_month = 3 * (quarter - 1) + 1
        start = _month_start(year, first_month, tz)
        end = _month_start(*_shift_month(year, first_month, 3), tz)
        return Period(f"Q{quarter} {year}", "last quarter", start, end,
                      _month_start(*_shift_month(year, first_month, -3), tz), start,
                      _month_buckets(year, first_month, 3, tz))

    start = _month_start(year, 1, tz)
    end = _month_start(year + 1, 1, tz)
    return Period(f"Full Year {year}", "last year", start, end, _month_start(year - 1, 1, tz), start,
                  _month_buckets(year, 1, 12, tz))


def _local(value, tz):
    # Database times are naive UTC
    return value.replace(tzinfo=UTC).astimezone(tz) if value else None


def _within(value, start, end):
    return value is not None and start <= value < end


def _priority(task):
    return task.priority if task.priority in PRIORITIES else "medium"


def build_dashboard(rows, period: Period, tz, now=None):
    """rows: (task, owner_name) pairs. Returns everything the dashboard page shows."""
    now = (now or datetime.now(UTC)).astimezone(tz)
    items = [
        {
            "task": task,
            "owner": owner_name or "Unnamed user",
            "created": _local(task.created_at, tz),
            "completed": _local(task.completed_at, tz) if task.completed else None,
            "due": _local(task.due_at, tz),
        }
        for task, owner_name in rows
    ]

    def count(key, start, end):
        return sum(1 for item in items if _within(item[key], start, end))

    # Period numbers: how many tasks were added / completed inside the selected period
    added = count("created", period.start, period.end)
    completed = count("completed", period.start, period.end)

    # Live numbers: the state of things right now, whatever period is selected
    open_items = [item for item in items if not item["task"].completed]
    overdue = [item for item in open_items if item["due"] and item["due"] < now]
    next_7_days = [item for item in open_items if _within(item["due"], now, now + timedelta(days=7))]
    today = _midnight(now.date(), tz)
    due_today = [item for item in open_items if _within(item["due"], today, _midnight(now.date() + timedelta(days=1), tz))]
    done = len(items) - len(open_items)

    def summary(item):
        task = item["task"]
        return {"id": task.id, "title": task.title, "priority": _priority(task), "due_at": task.due_at,
                "completed": task.completed, "user_name": item["owner"]}

    upcoming = sorted((item for item in open_items if item["due"] and item["due"] >= now), key=lambda item: item["due"])

    def chart_point(label, full_label, start, end):
        # A bucket that hasn't started yet has no data, rather than a misleading zero
        if start > now:
            return {"label": label, "full_label": full_label, "added": None, "completed": None}
        return {"label": label, "full_label": full_label,
                "added": count("created", start, end), "completed": count("completed", start, end)}

    events = []
    for item in items:
        if item["created"]:
            events.append(("added", item["created"], item["task"].created_at, item))
        if item["completed"]:
            events.append(("completed", item["completed"], item["task"].completed_at, item))
    events.sort(key=lambda event: event[1], reverse=True)

    return {
        "period": {"label": period.label, "compare_label": period.compare_label},
        "kpis": {
            "added": added,
            "added_change": added - count("created", period.previous_start, period.previous_end),
            "completed": completed,
            "completed_change": completed - count("completed", period.previous_start, period.previous_end),
            "open": len(open_items),
            "due_next_7_days": len(next_7_days),
            "overdue": len(overdue),
            "done": done,
            "total": len(items),
            "completion_rate": round(done * 100 / len(items)) if items else 0,
        },
        "series": [chart_point(*bucket) for bucket in period.buckets],
        "by_priority": [
            {"priority": priority,
             "count": sum(1 for item in items if _within(item["created"], period.start, period.end) and _priority(item["task"]) == priority)}
            for priority in PRIORITIES
        ],
        "upcoming": [summary(item) for item in upcoming[:5]],
        "activity": [{"type": kind, "at": at, **summary(item)} for kind, _, at, item in events[:8]],
        "health": {
            "due_today": len(due_today),
            "due_next_7_days": len(next_7_days),
            "overdue": len(overdue),
            "no_due_date": sum(1 for item in open_items if not item["due"]),
        },
    }

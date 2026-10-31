"""Little Boss Biryani: serves the site and keeps the shared order list.

Run:  python3 server.py   (then open http://localhost:5310)
Orders are saved in orders.json next to this file, so every visitor sees the same list.
"""
import json, os, re, threading, uuid
from datetime import datetime, timedelta
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from zoneinfo import ZoneInfo

PORT = int(os.environ.get("PORT", 5310))
HERE = os.path.dirname(os.path.abspath(__file__))
DB = os.path.join(HERE, "orders.json")
IST = ZoneInfo("Asia/Kolkata")
LOCK = threading.Lock()

ITEMS = {"combo": 69, "biryani": 60, "chips": 15, "soda": 15}
LOCATIONS = [
    "City Palace", "Fateh Sagar Lake", "Lake Pichola", "Gulab Bagh", "Hiran Magri",
    "Sector 4, Hiran Magri", "Sukher", "Bhupalpura", "Ambamata", "Surajpole",
    "Chetak Circle", "Shobhagpura", "Udaipole", "Panchwati", "Rani Road",
    "Savina", "Pratap Nagar", "Bapu Bazar", "Delhi Gate", "Ashok Nagar",
    "University Road", "Bedla Road", "Airport Road", "Sajjangarh", "Sheetla Marg",
]


def load():
    """Read orders, dropping any whose date has ended (Udaipur time) and saving the cleanup."""
    try:
        with open(DB, encoding="utf-8") as f:
            orders = json.load(f)
    except (FileNotFoundError, ValueError):
        return []
    today = datetime.now(IST).strftime("%Y-%m-%d")
    live = [o for o in orders if o.get("date", "") >= today]
    if len(live) != len(orders):
        with LOCK:
            with open(DB, "w", encoding="utf-8") as f:
                json.dump(live, f, ensure_ascii=False)
    return live


def validate(body):
    now = datetime.now(IST)
    today = now.date()
    name = re.sub(r"\s+", " ", str(body.get("name", ""))).strip()
    if not 1 <= len(name) <= 40:
        return None, "name"
    try:
        d = datetime.strptime(body["date"], "%Y-%m-%d").date()
        t = datetime.strptime(body["time"], "%H:%M").time()
    except (KeyError, ValueError):
        return None, "datetime"
    if not today <= d <= today + timedelta(days=2):
        return None, "date"
    if not (8, 0) <= (t.hour, t.minute) <= (22, 0):
        return None, "time"
    if datetime.combine(d, t, IST) < now - timedelta(minutes=1):
        return None, "past"
    location = re.sub(r"\s+", " ", str(body.get("location", ""))).strip()
    if not 2 <= len(location) <= 100:
        return None, "location"
    items = {}
    for k, v in (body.get("items") or {}).items():
        if k in ITEMS and isinstance(v, int) and 0 < v <= 20:
            items[k] = v
    if not items:
        return None, "items"
    total = sum(ITEMS[k] * v for k, v in items.items())
    return {
        "id": uuid.uuid4().hex[:8], "name": name, "date": body["date"],
        "time": body["time"], "location": location, "items": items,
        "total": total, "placedAt": now.isoformat(timespec="seconds"),
    }, None


class Handler(SimpleHTTPRequestHandler):
    def __init__(self, *a, **kw):
        super().__init__(*a, directory=HERE, **kw)

    def send_json(self, obj, code=200):
        data = json.dumps(obj, ensure_ascii=False).encode()
        self.send_response(code)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(data)))
        self.send_header("Cache-Control", "no-store")
        self.end_headers()
        self.wfile.write(data)

    def do_GET(self):
        if self.path.split("?")[0] == "/api/orders":
            return self.send_json({"orders": load(), "now": datetime.now(IST).isoformat(timespec="seconds")})
        if self.path.split("?")[0] in ("/server.py", "/orders.json"):
            return self.send_error(404)
        super().do_GET()

    def do_POST(self):
        if self.path != "/api/orders":
            return self.send_error(404)
        try:
            n = int(self.headers.get("Content-Length", 0))
            body = json.loads(self.rfile.read(min(n, 10_000)))
        except ValueError:
            return self.send_json({"error": "bad"}, 400)
        order, err = validate(body)
        if err:
            return self.send_json({"error": err}, 400)
        orders = load()
        with LOCK:
            orders.append(order)
            with open(DB, "w", encoding="utf-8") as f:
                json.dump(orders[-2000:], f, ensure_ascii=False)
        self.send_json({"order": order}, 201)

    def end_headers(self):
        self.send_header("Cache-Control", "no-store")
        super().end_headers()


if __name__ == "__main__":
    print(f"Little Boss Biryani on http://localhost:{PORT}")
    ThreadingHTTPServer(("", PORT), Handler).serve_forever()

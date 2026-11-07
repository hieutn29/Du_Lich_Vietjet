"""Tạo file database cho DB Browser for SQLite từ schema.sql + seed.sql.

Chạy:  python data/build_db.py      (từ thư mục vietjet/)
Kết quả trong data/export/:
  - vietjet.db         : mở trực tiếp bằng DB Browser (File > Open Database)
  - vietjet_import.sql : File > Import > Database from SQL file
Ngày bay trong seed.sql sinh theo ngày hiện tại, nên file xuất ra cố định theo ngày chạy script.
"""
import os
import sqlite3

HERE = os.path.dirname(os.path.abspath(__file__))
OUT = os.path.join(HERE, "export")
DB_PATH = os.path.join(OUT, "vietjet.db")
SQL_PATH = os.path.join(OUT, "vietjet_import.sql")

# Thứ tự ghi dữ liệu theo khoá ngoại (bảng cha trước)
TABLES = ["airlines", "airports", "aircraft", "flights", "fares", "tours",
          "tour_itineraries", "customers", "orders", "order_items"]


def read(name):
    with open(os.path.join(HERE, name), encoding="utf-8") as f:
        return f.read()


def sql_literal(value):
    if value is None:
        return "NULL"
    if isinstance(value, (int, float)):
        return str(value)
    return "'" + str(value).replace("'", "''") + "'"


def main():
    os.makedirs(OUT, exist_ok=True)
    if os.path.exists(DB_PATH):
        os.remove(DB_PATH)

    schema = read("schema.sql")
    con = sqlite3.connect(DB_PATH)
    con.executescript(schema)
    con.executescript(read("seed.sql"))
    con.commit()
    con.execute("VACUUM")

    with open(SQL_PATH, "w", encoding="utf-8", newline="\n") as f:
        f.write("-- DEMO DATA – website Vietjet (dữ liệu mẫu, không phải dữ liệu thật của hãng)\n")
        f.write("-- Import: DB Browser for SQLite > File > Import > Database from SQL file\n\n")
        f.write(schema.strip() + "\n\nBEGIN TRANSACTION;\n")
        for table in TABLES:
            cur = con.execute(f"SELECT * FROM {table} ORDER BY id")
            cols = ", ".join(d[0] for d in cur.description)
            rows = cur.fetchall()
            f.write(f"\n-- {table}: {len(rows)} dòng\n")
            for row in rows:
                f.write(f"INSERT INTO {table} ({cols}) VALUES ({', '.join(sql_literal(v) for v in row)});\n")
        f.write("\nCOMMIT;\n")

    for table in TABLES:
        n = con.execute(f"SELECT COUNT(*) FROM {table}").fetchone()[0]
        print(f"{table:18} {n:6}")
    con.close()
    print("->", DB_PATH)
    print("->", SQL_PATH)


if __name__ == "__main__":
    main()

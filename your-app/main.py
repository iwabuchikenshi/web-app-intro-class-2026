"""
欲しいものリスト バックエンド
TODOアプリを改造して、欲しいもの名と値段を保存できるようにした版
"""

import sqlite3
import uvicorn

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel, Field

# --- FastAPIアプリ ---
app = FastAPI(title="Wantapp")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- データベース設定 ---
DATABASE = "todo.db"


def init_db():
    """データベースとテーブルを初期化する"""
    conn = sqlite3.connect(DATABASE)
    cursor = conn.cursor()

    cursor.execute("""
        CREATE TABLE IF NOT EXISTS todos (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            title TEXT NOT NULL,
            price INTEGER DEFAULT 0,
            done INTEGER DEFAULT 0
        )
    """)

    conn.commit()
    conn.close()


# --- Pydanticモデル ---


class TodoCreate(BaseModel):
    # 欲しいものの名前
    title: str = Field(min_length=1, max_length=100)

    # 欲しいものの値段
    price: int = Field(default=0, ge=0)


class TodoUpdate(BaseModel):
    # 入手済みかどうか
    done: bool


# --- APIエンドポイント ---


@app.get("/todos")
def get_todos():
    """欲しいもの一覧を取得する"""
    conn = sqlite3.connect(DATABASE)
    cursor = conn.cursor()

    cursor.execute("SELECT id, title, price, done FROM todos ORDER BY id")
    todos = cursor.fetchall()

    conn.close()

    return [
        {
            "id": todo[0],
            "title": todo[1],
            "price": todo[2],
            "done": bool(todo[3]),
        }
        for todo in todos
    ]


@app.post("/todos", status_code=201)
def create_todo(todo: TodoCreate):
    """新しい欲しいものを作成する"""
    conn = sqlite3.connect(DATABASE)
    cursor = conn.cursor()

    cursor.execute(
        "INSERT INTO todos (title, price, done) VALUES (?, ?, 0)",
        (todo.title, todo.price),
    )
    conn.commit()
    todo_id = cursor.lastrowid

    conn.close()

    return {
        "id": todo_id,
        "title": todo.title,
        "price": todo.price,
        "done": False,
    }


@app.put("/todos/{todo_id}")
def update_todo(todo_id: int, todo: TodoUpdate):
    """欲しいものの入手状態を更新する"""
    conn = sqlite3.connect(DATABASE)
    cursor = conn.cursor()

    cursor.execute("SELECT title, price FROM todos WHERE id = ?", (todo_id,))
    existing = cursor.fetchone()

    if existing is None:
        conn.close()
        raise HTTPException(status_code=404, detail="Item not found")

    cursor.execute(
        "UPDATE todos SET done = ? WHERE id = ?",
        (int(todo.done), todo_id),
    )
    conn.commit()

    conn.close()

    return {
        "id": todo_id,
        "title": existing[0],
        "price": existing[1],
        "done": todo.done,
    }


@app.delete("/todos/{todo_id}")
def delete_todo(todo_id: int):
    """欲しいものを削除する"""
    conn = sqlite3.connect(DATABASE)
    cursor = conn.cursor()

    cursor.execute("SELECT id FROM todos WHERE id = ?", (todo_id,))
    existing = cursor.fetchone()

    if existing is None:
        conn.close()
        raise HTTPException(status_code=404, detail="Item not found")

    cursor.execute("DELETE FROM todos WHERE id = ?", (todo_id,))
    conn.commit()

    conn.close()

    return {"message": "Item deleted", "id": todo_id}


# --- 静的ファイル配信 ---
app.mount("/", StaticFiles(directory="static", html=True), name="static")

# --- アプリ起動時にDBを初期化 ---
init_db()

if __name__ == "__main__":
 uvicorn.run(app, host="0.0.0.0", port=8000)
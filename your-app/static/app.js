/**
 * ほしいものリスト App JavaScript - 完成版
 * 第8回: セキュリティの基礎 & 総仕上げ
 *
 * 【このファイルの役割】
 * ブラウザの画面（HTML）と、バックエンド（main.py）の橋渡しをする。
 *
 * 【全体の流れ】
 * 1. ページが開かれる → loadItems() でサーバーからほしいもの一覧を取得
 * 2. renderItems() が、取得したデータを画面のリストとして描画する
 * 3. ユーザーが「追加・チェック・削除」を操作する
 *    → 対応する関数がサーバーに変更を送る（fetch）
 *    → 最後にもう一度 loadItems() して、最新の状態を画面に反映する
 *
 * ※ fetch はサーバーと通信する命令。通信は時間がかかるので、
 * async / await を使って「結果が返ってくるまで待つ」書き方をしている。
 */

// サーバー側のAPIのアドレス
// バックエンド側はそのまま使うので、URLは /todos のままにする
const API_URL = "/todos";

// ============================================================
// ほしいもの操作（CRUD）
// ============================================================

/**
 * ほしいもの一覧を取得して表示する
 */
async function loadItems() {
  try {
    const response = await fetch(API_URL);

    if (!response.ok) {
      const error = await response.json();
      showError(error.detail || "ほしいものリストの取得に失敗しました");
      return;
    }

    const items = await response.json();
    renderItems(items);
  } catch (error) {
    showError("通信エラーが発生しました");
  }
}

/**
 * 新しいほしいものを追加する
 */
async function addItem() {
  const input = document.getElementById("todo-input");
  const title = input.value.trim();

  if (title === "") {
    showError("ほしいものを入力してください");
    return;
  }

  if (title.length > 100) {
    showError("ほしいものは100文字以内で入力してください");
    return;
  }

  try {
    const response = await fetch(API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: title }),
    });

    if (!response.ok) {
      const error = await response.json();
      showError(error.detail || "ほしいものの追加に失敗しました");
      return;
    }

    input.value = "";
    await loadItems();
  } catch (error) {
    showError("通信エラーが発生しました");
  }
}

/**
 * ほしいものの入手状態を切り替える
 * id: 対象の番号 / currentDone: いまの状態(true/false)
 */
async function toggleItem(id, currentDone) {
  try {
    const response = await fetch(`${API_URL}/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ done: !currentDone }),
    });

    if (!response.ok) {
      const error = await response.json();
      showError(error.detail || "ほしいものの更新に失敗しました");
      return;
    }

    await loadItems();
  } catch (error) {
    showError("通信エラーが発生しました");
  }
}

/**
 * ほしいものを削除する
 * id: 削除したいほしいものの番号
 */
async function deleteItem(id) {
  try {
    const response = await fetch(`${API_URL}/${id}`, {
      method: "DELETE",
    });

    if (!response.ok) {
      const error = await response.json();
      showError(error.detail || "ほしいものの削除に失敗しました");
      return;
    }

    await loadItems();
  } catch (error) {
    showError("通信エラーが発生しました");
  }
}

// ============================================================
// 描画
// ============================================================

/**
 * ほしいものリストを描画する（XSS対策: createElement + textContent）
 */
function renderItems(items) {
  const list = document.getElementById("todo-list");
  list.innerHTML = "";

  items.forEach((item) => {
    const li = document.createElement("li");
    li.className = "todo-item" + (item.done ? " done" : "");

    const label = document.createElement("label");
    label.className = "todo-label";

    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.className = "todo-checkbox";
    checkbox.checked = item.done;
    checkbox.addEventListener("change", () => toggleItem(item.id, item.done));

    const titleSpan = document.createElement("span");
    titleSpan.className = "todo-title";
    titleSpan.textContent = item.title;

    label.appendChild(checkbox);
    label.appendChild(titleSpan);

    const deleteBtn = document.createElement("button");
    deleteBtn.className = "delete-button";
    deleteBtn.textContent = "削除";
    deleteBtn.addEventListener("click", () => deleteItem(item.id));

    li.appendChild(label);
    li.appendChild(deleteBtn);

    list.appendChild(li);
  });
}

// ============================================================
// メッセージ表示
// ============================================================

function showError(message) {
  const errorDiv = document.getElementById("error-message");
  errorDiv.textContent = message;
  errorDiv.style.display = "block";

  setTimeout(() => {
    errorDiv.style.display = "none";
  }, 5000);
}

// ============================================================
// イベントリスナー
// ============================================================

document.getElementById("todo-form").addEventListener("submit", function (e) {
  e.preventDefault();
  addItem();
});

// ページ読み込み時に、まずほしいもの一覧を取得して表示する
loadItems();
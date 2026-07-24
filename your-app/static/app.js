/**
 * Wantapp JavaScript
 * 欲しいものリスト + 値段 + 入手ボタン対応版
 */

const API_URL = "/todos";

// ============================================================
// 欲しいもの操作
// ============================================================

/**
 * 欲しいもの一覧を取得して表示する
 */
async function loadItems() {
  try {
    const response = await fetch(API_URL);

    if (!response.ok) {
      const error = await response.json();
      showError(error.detail || "欲しいものリストの取得に失敗しました");
      return;
    }

    const items = await response.json();
    renderItems(items);
  } catch (error) {
    showError("通信エラーが発生しました");
  }
}

/**
 * 新しい欲しいものを追加する
 */
async function addItem() {
  const titleInput = document.getElementById("todo-input");
  const priceInput = document.getElementById("price-input");

  const title = titleInput.value.trim();
  const price = Number(priceInput.value);

  if (title === "") {
    showError("欲しいものを入力してください");
    return;
  }

  if (title.length > 100) {
    showError("欲しいものは100文字以内で入力してください");
    return;
  }

  if (priceInput.value === "") {
    showError("値段を入力してください");
    return;
  }

  if (price < 0) {
    showError("値段は0円以上で入力してください");
    return;
  }

  try {
    const response = await fetch(API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: title, price: price }),
    });

    if (!response.ok) {
      const error = await response.json();
      showError(error.detail || "欲しいものの追加に失敗しました");
      return;
    }

    titleInput.value = "";
    priceInput.value = "";

    await loadItems();
  } catch (error) {
    showError("通信エラーが発生しました");
  }
}

/**
 * 入手状態を切り替える
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
      showError(error.detail || "欲しいものの更新に失敗しました");
      return;
    }

    await loadItems();
  } catch (error) {
    showError("通信エラーが発生しました");
  }
}

/**
 * 欲しいものを削除する
 */
async function deleteItem(id) {
  try {
    const response = await fetch(`${API_URL}/${id}`, {
      method: "DELETE",
    });

    if (!response.ok) {
      const error = await response.json();
      showError(error.detail || "欲しいものの削除に失敗しました");
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
 * 欲しいものリストを描画する
 */
function renderItems(items) {
  const list = document.getElementById("todo-list");
  list.innerHTML = "";

  items.forEach((item) => {
    const li = document.createElement("li");
    li.className = "todo-item" + (item.done ? " done" : "");

    const itemInfo = document.createElement("div");
    itemInfo.className = "todo-label";

    const titleSpan = document.createElement("span");
    titleSpan.className = "todo-title";
    titleSpan.textContent = item.title;

    const priceSpan = document.createElement("span");
    priceSpan.className = "todo-price";
    priceSpan.textContent = `¥${Number(item.price).toLocaleString()}`;

    itemInfo.appendChild(titleSpan);
    itemInfo.appendChild(priceSpan);

    const buttonArea = document.createElement("div");
    buttonArea.className = "button-area";

    const getBtn = document.createElement("button");
    getBtn.className = "get-button";
    getBtn.textContent = item.done ? "入手済み" : "入手";
    getBtn.addEventListener("click", () => toggleItem(item.id, item.done));

    const deleteBtn = document.createElement("button");
    deleteBtn.className = "delete-button";
    deleteBtn.textContent = "削除";
    deleteBtn.addEventListener("click", () => deleteItem(item.id));

    buttonArea.appendChild(getBtn);
    buttonArea.appendChild(deleteBtn);

    li.appendChild(itemInfo);
    li.appendChild(buttonArea);

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

// ページ読み込み時に、まず欲しいもの一覧を取得して表示する
loadItems();
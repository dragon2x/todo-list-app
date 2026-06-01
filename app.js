(function () {
  "use strict";

  const PRIORITY_RANK = { high: 0, normal: 1, low: 2 };
  const PRIORITY_LABEL = { high: "높음", normal: "보통", low: "낮음" };
  const PRIORITY_FROM_TEXT = {
    "높음": "high",
    high: "high",
    "보통": "normal",
    normal: "normal",
    "낮음": "low",
    low: "low",
  };

  /** @type {{id:number, text:string, priority:string, done:boolean}[]} */
  let todos = [];
  let nextId = 1;
  let selectedPriority = "normal";
  let enteringIds = new Set();

  const form = document.getElementById("composer");
  const input = document.getElementById("input");
  const list = document.getElementById("list");
  const empty = document.getElementById("empty");
  const summary = document.getElementById("summary");
  const prioChips = document.querySelectorAll(".prio-chip");

  prioChips.forEach((chip) => {
    chip.addEventListener("click", () => {
      selectedPriority = chip.dataset.prio;
      prioChips.forEach((c) => c.classList.toggle("is-active", c === chip));
    });
  });

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const text = input.value.trim();
    if (!text) return;
    addTodo(text, selectedPriority);
    input.value = "";
    input.focus();
    render();
  });

  // Paste from Excel: rows split by newlines, columns by tabs.
  // A second column matching 높음/보통/낮음 (or high/normal/low) sets priority.
  input.addEventListener("paste", (e) => {
    const raw = (e.clipboardData || window.clipboardData).getData("text");
    const lines = raw.split(/\r\n|\r|\n/).filter((l) => l.trim());
    if (lines.length < 2) return; // single line — let normal paste happen

    e.preventDefault();
    let added = 0;
    lines.forEach((line) => {
      const cells = line.split("\t");
      const text = cells[0].trim();
      if (!text) return;
      const prio = PRIORITY_FROM_TEXT[(cells[1] || "").trim()] || selectedPriority;
      addTodo(text, prio);
      added++;
    });
    if (added) {
      input.value = "";
      render();
    }
  });

  function addTodo(text, priority) {
    const id = nextId++;
    todos.push({ id, text, priority, done: false });
    enteringIds.add(id);
  }

  function sorted() {
    return todos.slice().sort((a, b) => {
      if (a.done !== b.done) return a.done ? 1 : -1;
      return PRIORITY_RANK[a.priority] - PRIORITY_RANK[b.priority];
    });
  }

  function commitEdit(id, el) {
    const text = el.textContent.trim();
    const todo = todos.find((t) => t.id === id);
    if (!todo) return;
    if (text) {
      todo.text = text;
    }
    render();
  }

  function render() {
    list.innerHTML = "";

    let enterIndex = 0;
    sorted().forEach((todo) => {
      const li = document.createElement("li");
      li.className = "item item--" + todo.priority + (todo.done ? " is-done" : "");
      if (enteringIds.has(todo.id)) {
        li.classList.add("item--enter");
        li.style.animationDelay = enterIndex * 0.06 + "s";
        enterIndex++;
      }

      const check = document.createElement("input");
      check.type = "checkbox";
      check.className = "item__check";
      check.checked = todo.done;
      check.setAttribute("aria-label", "완료 토글");
      check.addEventListener("change", () => {
        todo.done = check.checked;
        render();
      });

      const body = document.createElement("div");
      body.className = "item__body";

      const text = document.createElement("div");
      text.className = "item__text";
      text.textContent = todo.text;
      text.contentEditable = "true";
      text.spellcheck = false;
      text.setAttribute("role", "textbox");
      text.addEventListener("blur", () => commitEdit(todo.id, text));
      text.addEventListener("keydown", (e) => {
        if (e.key === "Enter") {
          e.preventDefault();
          text.blur();
        }
      });

      const prio = document.createElement("span");
      prio.className = "item__prio";
      prio.textContent = PRIORITY_LABEL[todo.priority];

      body.append(text, prio);

      const del = document.createElement("button");
      del.type = "button";
      del.className = "item__delete";
      del.textContent = "삭제";
      del.addEventListener("click", () => {
        todos = todos.filter((t) => t.id !== todo.id);
        render();
      });

      li.append(check, body, del);
      list.appendChild(li);
    });

    enteringIds.clear();

    const remaining = todos.filter((t) => !t.done).length;
    empty.classList.toggle("is-hidden", todos.length > 0);
    if (todos.length === 0) {
      summary.textContent = "오늘 할 일을 추가해 보세요.";
    } else if (remaining === 0) {
      summary.textContent = "모든 할 일을 완료했습니다.";
    } else {
      summary.textContent = "남은 할 일 " + remaining + "개";
    }
  }

  render();
})();

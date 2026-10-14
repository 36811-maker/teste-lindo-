
const $ = (id) => document.getElementById(id);

const STORAGE_KEY = "studyBloomData";
const today = () => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};

const initialMissions = [
    {
        id: "html",
        title: "Primeiros passos no HTML",
        description: "Aprenda a estrutura básica de uma página.",
        icon: "🌐",
        question: "Qual elemento HTML representa o título principal de uma página?",
        options: ["<p>", "<h1>", "<img>", "<footer>"],
        answer: 1,
        explanation: "O elemento <h1> representa o título principal da página."
    },
    {
        id: "css",
        title: "Estilizando com CSS",
        description: "Descubra como mudar as cores de um site.",
        icon: "🎨",
        question: "Qual propriedade CSS altera a cor do texto?",
        options: ["background", "font-size", "color", "border"],
        answer: 2,
        explanation: "A propriedade color define a cor do texto."
    },
    {
        id: "js",
        title: "Lógica JavaScript",
        description: "Conheça as variáveis da programação.",
        icon: "💻",
        question: "Qual palavra pode declarar uma variável em JavaScript?",
        options: ["let", "style", "color", "heading"],
        answer: 0,
        explanation: "let declara uma variável que pode receber um novo valor."
    },
    {
        id: "logic",
        title: "Desafio de lógica",
        description: "Pratique seu raciocínio lógico.",
        icon: "🧠",
        question: "Qual será o resultado de 5 + 3 * 2?",
        options: ["16", "13", "11", "10"],
        answer: 2,
        explanation: "A multiplicação acontece primeiro: 3 × 2 = 6. Depois, 5 + 6 = 11."
    }
];

function loadData() {
    try {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (!saved) return null;
        const data = JSON.parse(saved);
        return data && typeof data === "object" ? data : null;
    } catch (error) {
        console.error("Não foi possível carregar os dados:", error);
        return null;
    }
}

const savedData = loadData();

const state = {
    tasks: Array.isArray(savedData?.tasks) ? savedData.tasks : [],
    habits: Array.isArray(savedData?.habits) ? savedData.habits : [],
    xp: Number.isFinite(savedData?.xp) ? Math.max(0, savedData.xp) : 0,
    completedMissions: Array.isArray(savedData?.completedMissions)
        ? savedData.completedMissions : [],
    sessions: Number.isFinite(savedData?.sessions) ? savedData.sessions : 0,
    focusMinutes: Number.isFinite(savedData?.focusMinutes) ? savedData.focusMinutes : 0,
    dark: savedData?.dark === true
};

function saveData() {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch (error) {
        console.error("Não foi possível salvar os dados:", error);
        showToast("Não foi possível salvar. Verifique o armazenamento do navegador.");
    }
}

function showToast(message) {
    const toast = $("toast");
    toast.textContent = message;
    toast.classList.add("show");

    clearTimeout(showToast.timeout);
    showToast.timeout = setTimeout(() => {
        toast.classList.remove("show");
    }, 2800);
}

function escapeHTML(value) {
    return String(value).replace(/[&<>"']/g, char => ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;"
    })[char]);
}

function addXP(amount, message) {
    state.xp += amount;
    saveData();
    renderAll();
    if (message) showToast(message);
}

function getLevel() {
    return Math.floor(state.xp / 100) + 1;
}

function getLevelProgress() {
    return state.xp % 100;
}

function completedTasks() {
    return state.tasks.filter(task => task.done).length;
}

function completedHabitsToday() {
    return state.habits.filter(habit =>
        Array.isArray(habit.completedDates) &&
        habit.completedDates.includes(today())
    ).length;
}

function renderHeader() {
    const hour = new Date().getHours();
    const greeting = hour < 12 ? "Bom dia" : hour < 18 ? "Boa tarde" : "Boa noite";

    $("greeting").textContent = `${greeting}! Vamos florescer? 🌷`;
    $("today").textContent = new Date().toLocaleDateString("pt-BR", {
        weekday: "long",
        day: "numeric",
        month: "long",
        year: "numeric"
    });

    $("level").textContent = getLevel();
    $("xpText").textContent = `${state.xp} XP · ${100 - getLevelProgress()} XP para o próximo nível`;
    $("xpBar").style.width = `${getLevelProgress()}%`;

    $("completedCount").textContent = completedTasks();
    $("habitCount").textContent = `${completedHabitsToday()}/${state.habits.length}`;
    $("missionCount").textContent = state.completedMissions.length;
    $("plantCount").textContent = Math.min(plantData().length, 6);

    const taskPercentage = state.tasks.length
        ? Math.round(completedTasks() / state.tasks.length * 100) : 0;

    const habitPercentage = state.habits.length
        ? Math.round(completedHabitsToday() / state.habits.length * 100) : 0;

    $("taskProgressText").textContent = `${taskPercentage}%`;
    $("taskProgressBar").style.width = `${taskPercentage}%`;
    $("habitProgressText").textContent = `${habitPercentage}%`;
    $("habitProgressBar").style.width = `${habitPercentage}%`;
}

function renderTodayTasks() {
    const tasks = state.tasks.filter(task => task.date === today()).slice(0, 5);

    $("todayTasks").innerHTML = tasks.length
        ? tasks.map(task => `
            <div class="task-item ${task.done ? "done" : ""}">
                <button class="check-btn ${task.done ? "checked" : ""}"
                    data-action="toggle-task" data-id="${task.id}"
                    aria-label="${task.done ? "Desmarcar" : "Concluir"} tarefa">
                    ${task.done ? "✓" : ""}
                </button>
                <div class="item-content">
                    <h4>${escapeHTML(task.title)}</h4>
                    <p>${escapeHTML(task.subject)} · ${escapeHTML(task.date)}</p>
                </div>
            </div>
        `).join("")
        : `<div class="empty-state">🌸 Nenhuma tarefa para hoje. Aproveite para planejar seu dia!</div>`;
}

function renderTasks() {
    const search = $("taskSearch").value.toLowerCase().trim();
    const filter = $("taskFilter").value;

    const tasks = state.tasks.filter(task => {
        const matchesSearch =
            task.title.toLowerCase().includes(search) ||
            task.subject.toLowerCase().includes(search);

        const matchesFilter =
            filter === "Todas" ||
            (filter === "Pendentes" && !task.done) ||
            (filter === "Concluídas" && task.done);

        return matchesSearch && matchesFilter;
    }).sort((a, b) => a.date.localeCompare(b.date));

    $("taskList").innerHTML = tasks.length
        ? tasks.map(task => `
            <div class="task-item ${task.done ? "done" : ""}">
                <button class="check-btn ${task.done ? "checked" : ""}"
                    data-action="toggle-task" data-id="${task.id}"
                    aria-label="${task.done ? "Desmarcar" : "Concluir"} tarefa">
                    ${task.done ? "✓" : ""}
                </button>
                <div class="item-content">
                    <h4>${escapeHTML(task.title)}</h4>
                    <p>${escapeHTML(task.subject)} · ${escapeHTML(task.date)}</p>
                </div>
                <span class="priority ${task.priority.toLowerCase()}">
                    ${escapeHTML(task.priority)}
                </span>
                <div class="item-actions">
                    <button class="small-btn" data-action="edit-task" data-id="${task.id}">Editar</button>
                    <button class="small-btn delete" data-action="delete-task" data-id="${task.id}">Excluir</button>
                </div>
            </div>
        `).join("")
        : `<div class="empty-state">🌷 Nenhuma tarefa encontrada.</div>`;
}

function renderHabits() {
    $("habitList").innerHTML = state.habits.length
        ? state.habits.map(habit => {
            const dates = Array.isArray(habit.completedDates) ? habit.completedDates : [];
            const done = dates.includes(today());

            return `
                <div class="habit-item">
                    <button class="check-btn ${done ? "checked" : ""}"
                        data-action="toggle-habit" data-id="${habit.id}"
                        aria-label="${done ? "Desmarcar" : "Concluir"} hábito">
                        ${done ? "✓" : ""}
                    </button>
                    <div class="item-content">
                        <h4>${escapeHTML(habit.title)}</h4>
                        <p>${done ? "Concluído hoje 🌸" : "Um pequeno passo por dia."} · ${dates.length} conclusão(ões)</p>
                    </div>
                    <div class="item-actions">
                        <button class="small-btn delete" data-action="delete-habit" data-id="${habit.id}">Excluir</button>
                    </div>
                </div>
            `;
        }).join("")
        : `<div class="empty-state">🌱 Crie seu primeiro hábito para começar!</div>`;
}

function renderMissions() {
    $("missionList").innerHTML = initialMissions.map(mission => {
        const done = state.completedMissions.includes(mission.id);

        return `
            <article class="mission-card ${done ? "completed" : ""}">
                <span class="mission-icon">${mission.icon}</span>
                <h3>${mission.title}</h3>
                <p>${mission.description}</p>
                <p>⭐ Recompensa: 20 XP</p>
                <button class="${done ? "secondary-btn" : "primary-btn"}"
                    data-action="open-mission" data-id="${mission.id}"
                    ${done ? "disabled" : ""}>
                    ${done ? "✓ Concluída" : "Iniciar missão"}
                </button>
            </article>
        `;
    }).join("");
}

function plantData() {
    const unlocked = Math.min(6, Math.floor(state.xp / 20));
    const plants = [
        { name: "Margarida", icon: "🌱", grown: "🌼" },
        { name: "Tulipa", icon: "🌱", grown: "🌷" },
        { name: "Girassol", icon: "🌱", grown: "🌻" },
        { name: "Flor de cerejeira", icon: "🌱", grown: "🌸" },
        { name: "Flor roxa", icon: "🌱", grown: "🪻" },
        { name: "Trevo", icon: "🌱", grown: "☘️" }
    ];

    return plants.slice(0, unlocked).map((plant, index) => {
        const threshold = (index + 1) * 20;
        const growth = Math.min(100, Math.round(state.xp / threshold * 100));

        return {
            ...plant,
            growth,
            stage: growth >= 100 ? "Florescida" : growth >= 50 ? "Crescendo" : "Broto"
        };
    });
}

function renderGarden() {
    const plants = plantData();

    $("gardenMessage").textContent = plants.length
        ? `Você já desbloqueou ${plants.length} planta(s). Continue cultivando suas conquistas!`
        : "Complete tarefas ou missões para plantar sua primeira flor!";

    $("gardenGrid").innerHTML = plants.length
        ? plants.map(plant => `
            <article class="plant-card">
                <span class="plant-emoji">${plant.growth >= 100 ? plant.grown : plant.icon}</span>
                <h3>${plant.name}</h3>
                <p>${plant.stage} · ${plant.growth}%</p>
                <div class="progress-track">
                    <div class="progress-fill green-fill" style="width:${plant.growth}%"></div>
                </div>
            </article>
        `).join("")
        : `<div class="empty-state">🌱 Seu jardim ainda está vazio. Ganhe XP para desbloquear plantas!</div>`;
}

function renderAll() {
    renderHeader();
    renderTodayTasks();
    renderTasks();
    renderHabits();
    renderMissions();
    renderGarden();
}

// PLANNER

$("taskDate").value = today();

$("taskForm").addEventListener("submit", event => {
    event.preventDefault();

    const title = $("taskTitle").value.trim();
    const subject = $("taskSubject").value.trim();
    const date = $("taskDate").value;

    if (!title || !subject || !date) {
        showToast("Preencha todos os campos da tarefa.");
        return;
    }

    state.tasks.push({
        id: crypto.randomUUID(),
        title,
        subject,
        date,
        priority: $("taskPriority").value,
        done: false,
        xpClaimed: false
    });

    saveData();
    $("taskForm").reset();
    $("taskDate").value = today();
    renderAll();
    showToast("Tarefa adicionada com sucesso! 📚");
});

$("taskSearch").addEventListener("input", renderTasks);
$("taskFilter").addEventListener("change", renderTasks);

// HÁBITOS

$("habitForm").addEventListener("submit", event => {
    event.preventDefault();

    const title = $("habitTitle").value.trim();
    if (!title) return;

    state.habits.push({
        id: crypto.randomUUID(),
        title,
        completedDates: []
    });

    saveData();
    $("habitForm").reset();
    renderAll();
    showToast("Novo hábito criado! 🌱");
});

// AÇÕES DOS ITENS

document.addEventListener("click", event => {
    const button = event.target.closest("[data-action]");
    if (!button) return;

    const { action, id } = button.dataset;

    if (action === "toggle-task") {
        const task = state.tasks.find(item => item.id === id);
        if (!task) return;

        task.done = !task.done;

        if (task.done && !task.xpClaimed) {
            task.xpClaimed = true;
            state.xp += 10;
            showToast("Tarefa concluída! +10 XP 🌸");
        } else {
            showToast(task.done ? "Tarefa marcada como concluída." : "Tarefa reaberta.");
        }

        saveData();
        renderAll();
    }

    if (action === "edit-task") {
        const task = state.tasks.find(item => item.id === id);
        if (!task) return;

        const title = prompt("Novo título da tarefa:", task.title);
        if (title === null) return;
        if (!title.trim()) {
            showToast("O título não pode ficar vazio.");
            return;
        }

        const subject = prompt("Nova matéria:", task.subject);
        if (subject === null) return;
        if (!subject.trim()) {
            showToast("A matéria não pode ficar vazia.");
            return;
        }

        task.title = title.trim();
        task.subject = subject.trim();
        saveData();
        renderAll();
        showToast("Tarefa atualizada!");
    }

    if (action === "delete-task") {
        if (!confirm("Deseja excluir esta tarefa?")) return;
        state.tasks = state.tasks.filter(task => task.id !== id);
        saveData();
        renderAll();
        showToast("Tarefa excluída.");
    }

    if (action === "toggle-habit") {
        const habit = state.habits.find(item => item.id === id);
        if (!habit) return;

        if (!Array.isArray(habit.completedDates)) habit.completedDates = [];

        const index = habit.completedDates.indexOf(today());

        if (index !== -1) {
            habit.completedDates.splice(index, 1);
            showToast("Hábito desmarcado.");
        } else {
            habit.completedDates.push(today());
            state.xp += 5;
            showToast("Hábito concluído! +5 XP 🌱");
        }

        saveData();
        renderAll();
    }

    if (action === "delete-habit") {
        if (!confirm("Deseja excluir este hábito?")) return;
        state.habits = state.habits.filter(habit => habit.id !== id);
        saveData();
        renderAll();
        showToast("Hábito excluído.");
    }

    if (action === "open-mission") {
        openMission(id);
    }
});

// CODEQUEST

function openMission(id) {
    const mission = initialMissions.find(item => item.id === id);
    if (!mission || state.completedMissions.includes(id)) return;

    const area = $("quizArea");
    area.classList.remove("hidden");

    area.innerHTML = `
        <h3>${mission.icon} ${mission.title}</h3>
        <p>${mission.question}</p>
        <div class="quiz-options">
            ${mission.options.map((option, index) => `
                <button class="quiz-option" data-answer="${index}">
                    ${escapeHTML(option)}
                </button>
            `).join("")}
        </div>
        <p id="quizFeedback" aria-live="polite"></p>
        <button id="closeQuiz" class="secondary-btn">Fechar desafio</button>
    `;

    area.scrollIntoView({ behavior: "smooth", block: "center" });

    area.querySelectorAll("[data-answer]").forEach(button => {
        button.addEventListener("click", () => {
            const buttons = area.querySelectorAll("[data-answer]");
            buttons.forEach(item => item.disabled = true);

            const correct = Number(button.dataset.answer) === mission.answer;
            const feedback = $("quizFeedback");

            if (correct) {
                state.completedMissions.push(mission.id);
                state.xp += 20;
                saveData();
                feedback.textContent = `🎉 Resposta correta! ${mission.explanation} Você ganhou 20 XP!`;
                renderAll();
            } else {
                feedback.textContent = `💡 Ainda não! ${mission.explanation} Tente novamente em outra rodada.`;
                const retry = document.createElement("button");
                retry.className = "primary-btn";
                retry.textContent = "Tentar novamente";
                retry.style.marginTop = "12px";
                retry.addEventListener("click", () => openMission(mission.id));
                feedback.after(retry);
            }
        });
    });

    $("closeQuiz").addEventListener("click", () => {
        area.classList.add("hidden");
        area.innerHTML = "";
    });
}

// CRONÔMETRO POMODORO

let timerSeconds = 25 * 60;
let timerInterval = null;
let selectedMinutes = 25;

function renderTimer() {
    const minutes = Math.floor(timerSeconds / 60);
    const seconds = timerSeconds % 60;

    $("timer").textContent =
        `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

function stopTimer() {
    clearInterval(timerInterval);
    timerInterval = null;
    $("startTimer").textContent = "▶ Continuar";
}

document.querySelectorAll(".timer-preset").forEach(button => {
    button.addEventListener("click", () => {
        if (timerInterval) return;

        selectedMinutes = Number(button.dataset.minutes);
        timerSeconds = selectedMinutes * 60;

        document.querySelectorAll(".timer-preset").forEach(item =>
            item.classList.toggle("selected", item === button)
        );

        $("startTimer").textContent = "▶ Iniciar";
        renderTimer();
    });
});

$("startTimer").addEventListener("click", () => {
    if (timerInterval) {
        stopTimer();
        $("timerMessage").textContent = "Sessão pausada. Retome quando estiver pronta.";
        return;
    }

    if (timerSeconds <= 0) timerSeconds = selectedMinutes * 60;

    $("startTimer").textContent = "⏸ Pausar";
    $("timerMessage").textContent = "Você está indo muito bem. Continue! 💗";

    timerInterval = setInterval(() => {
        timerSeconds--;
        renderTimer();

        if (timerSeconds <= 0) {
            stopTimer();
            timerSeconds = 0;
            renderTimer();

            state.sessions++;
            state.focusMinutes += selectedMinutes;
            state.xp += 10;

            saveData();
            renderAll();

            $("startTimer").textContent = "▶ Iniciar";
            $("timerMessage").textContent = "Parabéns! Sessão concluída. Faça uma pausa. 🌸";
            showToast("Sessão de foco concluída! +10 XP 🎉");
        }
    }, 1000);
});

$("resetTimer").addEventListener("click", () => {
    stopTimer();
    timerSeconds = selectedMinutes * 60;
    renderTimer();
    $("startTimer").textContent = "▶ Iniciar";
    $("timerMessage").textContent = "Pronta para recomeçar? 🌷";
});

// TEMA E NAVEGAÇÃO

function applyTheme() {
    document.body.classList.toggle("dark", state.dark);
    $("themeBtn").textContent = state.dark ? "☀️ Mudar tema" : "🌙 Mudar tema";
}

$("themeBtn").addEventListener("click", () => {
    state.dark = !state.dark;
    saveData();
    applyTheme();
});

document.querySelectorAll(".nav-link").forEach(link => {
    link.addEventListener("click", () => {
        document.querySelectorAll(".nav-link").forEach(item =>
            item.classList.toggle("active", item === link)
        );
    });
});

// INICIALIZAÇÃO

applyTheme();
renderTimer();
renderAll();

let clients = [];
let editingClientId = null;
let deleteClientId = null; // ID клиента для удаления
let sortState = { field: 'id', direction: 'asc' }; // По умолчанию сортировка по ID

document.addEventListener("DOMContentLoaded", () => {
    fetchClients(); // Загружаем клиентов при старте

    document.getElementById("addClientBtn").addEventListener("click", () => openModal(false)); // Для добавления нового клиента
    document.getElementById("clientForm").addEventListener("submit", handleClientFormSubmit);
    document.getElementById("addContactBtn").addEventListener("click", addContactField); // Для добавления контакта
});

function fetchClients(searchQuery = "") {
    fetch(`http://localhost:3000/api/clients?search=${searchQuery}`)
        .then(response => response.json())
        .then(data => {
            clients = data;
            renderClients(); // Перерисовываем список клиентов
        })
        .catch(error => console.error("Error fetching clients:", error));
}

function renderClients() {
    const tbody = document.querySelector("#clientsTable tbody");
    tbody.innerHTML = ""; // Очищаем таблицу перед рендерингом

    clients.forEach(client => {
        const fullName = `${client.surname} ${client.name} ${client.lastName || ''}`.trim();

        // Создаем строку с контактами
        const contactIcons = client.contacts.map(contact => {
            let icon = "";
            let title = "";

            switch (contact.type) {
                case "Телефон":
                    icon = "📞";
                    title = `Номер телефона: ${contact.value}`;
                    break;
                case "Email":
                    icon = "📧";
                    title = `Email: ${contact.value}`;
                    break;
                case "Facebook":
                    icon = "📱";
                    title = `Facebook: ${contact.value}`;
                    break;
                case "VK":
                    icon = "🌐";
                    title = `VK: ${contact.value}`;
                    break;
                default:
                    icon = "🔗";
                    title = `Другой контакт: ${contact.value}`;
                    break;
            }

            return `<span title="${title}">${icon}</span>`;
        }).join(" ");

        const tr = document.createElement("tr");
        tr.innerHTML = `
            <td class="table-row__elem table-row__elem_id">${client.id}</td>
            <td class="table-row__elem table-row__elem_fullname">${fullName}</td>
            <td class="table-row__elem table-row__elem_createDate">${formatDateTime(client.createdAt)}</td>
            <td class="table-row__elem table-row__elem_lastUpdateDate">${formatDateTime(client.updatedAt)}</td>
            <td class="table-row__elem table-row__elem_contacts">${contactIcons}</td>
            <td>
                <button onclick="editClient(${client.id})">Изменить</button>
                <button onclick="deleteClient(${client.id})">Удалить</button>
            </td>
        `;
        tbody.appendChild(tr);
    });
}

function sortClients(field) {
    if (sortState.field === field) {
        sortState.direction = sortState.direction === 'asc' ? 'desc' : 'asc';
    } else {
        sortState.field = field;
        sortState.direction = 'asc';
    }

    clients.sort((a, b) => {
        let valueA = a[field] || '';
        let valueB = b[field] || '';

        if (field === 'fullName') {
            valueA = `${a.surname} ${a.name} ${a.lastName || ''}`.trim().toLowerCase();
            valueB = `${b.surname} ${b.name} ${b.lastName || ''}`.trim().toLowerCase();
        }

        if (valueA < valueB) return sortState.direction === 'asc' ? -1 : 1;
        if (valueA > valueB) return sortState.direction === 'asc' ? 1 : -1;
        return 0;
    });

    updateSortIcons();
    renderClients();
}

function updateSortIcons() {
    const fields = ['id', 'fullName', 'createdAt', 'updatedAt'];
    fields.forEach(field => {
        const icon = document.getElementById(`sort-${field}`);
        if (field === sortState.field) {
            icon.textContent = sortState.direction === 'asc' ? '↑' : '↓';
        } else {
            icon.textContent = '';
        }
    });
}

// Функция для обработки ввода и выполнения поиска
function searchClients() {
    const searchQuery = document.getElementById("searchInput").value.trim();
    fetchClients(searchQuery); // Передаем запрос в fetchClients
}

function formatDateTime(dateString) {
    const date = new Date(dateString);
    const options = {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    };
    return date.toLocaleDateString('ru-RU', options).replace(',', '');
}

function openModal(isEditMode = false) {
    const modalTitle = isEditMode ? "Редактирование клиента" : "Добавление клиента";
    document.getElementById("modalTitle").textContent = modalTitle;
    document.getElementById("clientModal").style.display = "block";
}

function closeModal() {
    // Очищаем поля формы
    document.getElementById("surname").value = "";
    document.getElementById("name").value = "";
    document.getElementById("lastName").value = "";
    document.getElementById("contactsContainer").innerHTML = ""; // Удаляем все контакты

    // Сбрасываем состояние модального окна
    editingClientId = null;

    // Закрываем модальное окно
    document.getElementById("clientModal").style.display = "none";
}


function handleClientFormSubmit(event) {
    event.preventDefault();

    const surname = document.getElementById("surname").value;
    const name = document.getElementById("name").value;
    const lastName = document.getElementById("lastName").value;

    const contacts = [];
    const contactFields = document.querySelectorAll(".contact-field");
    contactFields.forEach(field => {
        const type = field.querySelector(".contact-type").value;
        const value = field.querySelector(".contact-value").value;
        if (type && value) {
            contacts.push({ type, value });
        }
    });

    const clientData = { surname, name, lastName, contacts };

    if (editingClientId) {
        // Редактирование клиента
        fetch(`http://localhost:3000/api/clients/${editingClientId}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(clientData)
        })
        .then(() => {
            fetchClients(); // Обновляем список после изменения
            closeModal();
        })
        .catch(error => console.error("Error updating client:", error));
    } else {
        // Добавление нового клиента
        fetch("http://localhost:3000/api/clients", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(clientData)
        })
        .then(() => {
            fetchClients(); // Обновляем список после добавления
            closeModal();
        })
        .catch(error => console.error("Error adding client:", error));
    }
}

function deleteClient(id) {
    deleteClientId = id;
    const deleteModal = new bootstrap.Modal(document.getElementById('deleteModal'));
    deleteModal.show();
}

document.getElementById('confirmDeleteButton').addEventListener('click', () => {
    if (deleteClientId !== null) {
        clients = clients.filter(client => client.id !== deleteClientId);

        fetch(`http://localhost:3000/api/clients/${deleteClientId}`, {
            method: 'DELETE',
        })
        .then(response => {
            if (!response.ok) throw new Error('Ошибка удаления на сервере');
            renderClients();
            const deleteModal = bootstrap.Modal.getInstance(document.getElementById('deleteModal'));
            deleteModal.hide();
        })
        .catch(error => {
            console.error('Ошибка при удалении клиента:', error);
            alert('Не удалось удалить клиента. Повторите попытку позже.');
        });

        deleteClientId = null;
    }
});

function editClient(id) {
    fetch(`http://localhost:3000/api/clients/${id}`)
        .then(response => response.json())
        .then(client => {
            editingClientId = client.id;

            document.getElementById("surname").value = client.surname || "";
            document.getElementById("name").value = client.name || "";
            document.getElementById("lastName").value = client.lastName || "";

            const contactsContainer = document.getElementById("contactsContainer");
            contactsContainer.innerHTML = "";
            client.contacts.forEach(contact => {
                addContactField(contact.type, contact.value);
            });

            if (!client.contacts || client.contacts.length === 0) {
                addContactField();
            }

            openModal(true);
        })
        .catch(error => console.error("Ошибка при загрузке данных клиента:", error));
}

function addContactField(type = "", value = "") {
    const contactContainer = document.getElementById("contactsContainer");
    const div = document.createElement("div");
    div.classList.add("contact-field");
    div.innerHTML = `
        <select class="contact-type">
            <option value="Телефон" ${type === "Телефон" ? "selected" : ""}>Телефон</option>
            <option value="Email" ${type === "Email" ? "selected" : ""}>Email</option>
            <option value="Facebook" ${type === "Facebook" ? "selected" : ""}>Facebook</option>
            <option value="VK" ${type === "VK" ? "selected" : ""}>VK</option>
            <option value="Другой" ${type === "Другой" ? "selected" : ""}>Другой</option>
        </select>
        <input type="text" class="contact-value" value="${value}">
        <button type="button" onclick="removeContactField(this)">Удалить</button>
    `;
    
    // Получаем ссылку на элементы
    const contactTypeSelect = div.querySelector(".contact-type");
    const contactValueInput = div.querySelector(".contact-value");
    
    // Обработчик изменения типа контакта
    contactTypeSelect.addEventListener("change", () => {
        if (contactTypeSelect.value === "Телефон") {
            contactValueInput.setAttribute("type", "tel"); // Меняем тип на "tel"
            formatPhoneNumber(contactValueInput); // Форматируем телефонный номер
        } else {
            contactValueInput.setAttribute("type", "text"); // Восстанавливаем тип "text"
            contactValueInput.value = value; // Оставляем значение как текст
        }
    });
    
    // Устанавливаем начальный тип ввода и форматируем телефон, если выбран "Телефон"
    if (contactTypeSelect.value === "Телефон") {
        contactValueInput.setAttribute("type", "tel");
        formatPhoneNumber(contactValueInput);
    }

    // Форматируем номер телефона при вводе
    contactValueInput.addEventListener("input", () => {
        if (contactTypeSelect.value === "Телефон") {
            formatPhoneNumber(contactValueInput);
        }
    });

    contactContainer.appendChild(div);
}

function formatPhoneNumber(input) {
    let value = input.value.replace(/\D/g, ''); // Убираем все нецифровые символы

    if (value.length > 11) value = value.substring(0, 10); // Ограничиваем до 10 цифр (для России)

    // Форматируем номер
    if (value.length > 7) {
        value = `+7 (${value.substring(1, 4)}) ${value.substring(4, 7)}-${value.substring(7, 9)}-${value.substring(9, 11)}`;
    } else if (value.length > 4) {
        value = `+7 (${value.substring(1, 4)}) ${value.substring(4, 6)}-${value.substring(6, 8)}`;
    } else if (value.length > 1) {
        value = `+7 (${value.substring(1, 4)}`;
    } else if (value.length > 0) {
        value = `+7 (${value.substring(1)}`;
    }

    input.value = value;
}

function removeContactField(button) {
    button.parentElement.remove();
}

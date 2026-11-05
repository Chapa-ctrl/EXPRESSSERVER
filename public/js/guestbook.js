let currentUser = null;
async function deleteEntry(id) {
    if (!confirm('Delete this message?')) return;

    const listError = document.querySelector('#list-error');

    try {
        const response = await fetch(`/api/guestbook/${encodeURIComponent(id)}`, {
            method: 'DELETE'
        });

        if (!response.ok) {
            const data = await response.json().catch(() => ({}));
            listError.textContent = data.error || 'Could not delete that message.';
            return;
        }

        loadMessages();
    } catch (err) {
        listError.textContent = 'Could not reach the server. Check your connection.';
    }
}

async function saveEdit(entry, newMsg) {
    const listError = document.querySelector('#list-error');

    try {
        const response = await fetch(`/api/guestbook/${encodeURIComponent(entry.id)}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                name: entry.name,
                msg: newMsg
            })
        });

        if (!response.ok) {
            const data = await response.json().catch(() => ({}));
            listError.textContent = data.error || 'Could not save your changes.';
            return;
        }

        loadMessages();
    } catch (err) {
        listError.textContent = 'Could not reach the server. Check your connection.';
    }
}

function startEdit(li, entry) {
    li.innerHTML = '';

    const textarea = document.createElement('textarea');
    textarea.value = entry.msg;
    textarea.maxLength = 280;

    const saveButton = document.createElement('button');
    saveButton.type = 'button';
    saveButton.textContent = 'Save';
    saveButton.addEventListener('click', () => saveEdit(entry, textarea.value));

    const cancelButton = document.createElement('button');
    cancelButton.type = 'button';
    cancelButton.textContent = 'Cancel';
    cancelButton.addEventListener('click', loadMessages);

    li.append(textarea, saveButton, cancelButton);
    textarea.focus();
}


async function loadMessages() {
    const listError = document.querySelector('#list-error');
    listError.textContent = '';

    try {
        const response = await fetch('/api/guestbook');
        if (!response.ok) {
            listError.textContent = 'Could not load messages.';
            return;
        }
        const messages = await response.json().catch(() => ({}));

        if (!currentUser) {
            currentUser = await (await fetch('/api/whoami')).json();
        }

        //document.querySelector('#guestbook-list').innerHTML = messages.map(msg => `<li>${msg}</li>`).join('');
        const list = document.querySelector('#guestbook-list');
        list.innerHTML = '';


        [...messages].reverse().forEach(message => {
            const li = document.createElement('li');
            const name = document.createElement('strong');
            name.textContent = message.name;
            const date = document.createElement('small');
            date.textContent = new Date(message.createdAt).toLocaleString();
            const msg = document.createElement('p');
            msg.textContent = message.msg;
            li.append(name, ' ', date, msg);

            if (message.updatedAt) {
                const edited = document.createElement('small');
                edited.textContent = ' (edited)';
                li.append(edited);
            }

            const canEdit = message.authorId === currentUser.userId || currentUser.role === 'admin';

            if (canEdit) {
                const editButton = document.createElement('button');
                editButton.type = 'button';
                editButton.textContent = 'Edit';
                editButton.addEventListener('click', () => startEdit(li, message));

                const deleteButton = document.createElement('button');
                deleteButton.type = 'button';
                deleteButton.textContent = 'Delete';
                deleteButton.addEventListener('click', () => deleteEntry(message.id));

                li.append(editButton, deleteButton);
            }

            list.append(li);
        });
    } catch (err) {
        listError.textContent = 'Failed to load guestbook messages.';
        console.error('Error loading guestbook messages:', err);
    }
};

document.querySelector('#guestbook-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const errorBox = document.querySelector('#form-error');
    errorBox.textContent = '';

    try {

        const response = await fetch('/api/guestbook', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ msg: document.querySelector('#msg').value })
        });

        if (!response.ok) {
            const data = await response.json().catch(() => ({}));
            errorBox.textContent = data.error || 'Something went wrong. Please try again.';
            return;
        }
    } catch (err) {
        errorBox.textContent = 'Failed to post guestbook message.';
        console.error('Error posting guestbook message:', err);
    }
    e.target.reset();
    loadMessages();
});
loadMessages();
const API = "/api/posts";

async function loadNews() {
    const feed = document.getElementById('feed');
    feed.innerHTML = '<img class="loader-gif" src="https://media.tenor.com/ptkoPmx8XAkAAAAi/windows-loading.gif">';
    try {
        const res = await fetch(API);
        if (!res.ok) throw new Error('Ошибка сервера (' + res.status + ')');
        const data = await res.json();
        if (!Array.isArray(data) || data.length === 0) { 
            feed.innerHTML = '<p style="color:#666;font-style:italic;font-weight:300;">лента новостей пуста.</p>'; 
            return; 
        }
        feed.innerHTML = data.map((p, i) => {
            const title = p && p.title ? String(p.title).toLowerCase() : 'без заголовка';
            const text = p && p.text ? String(p.text) : '';
            return '<div class="post" style="animation-delay:' + (i*0.05) + 's"><h2>' + title + '</h2><p>' + text + '</p></div>';
        }).join('');
    } catch (e) {
        feed.innerHTML = '<p style="color:#e51400;font-weight:300;">не удалось загрузить ленту: ' + e.message + '</p>';
    }
}

async function postNews() {
    const titleEl = document.getElementById('t');
    const textEl = document.getElementById('d');
    const btn = document.getElementById('submit-btn');
    
    if (!titleEl.value.trim() || !textEl.value.trim()) {
        return alert('Заполните все поля!');
    }
    
    btn.disabled = true;
    btn.innerHTML = 'публикация...';
    
    try {
        const res = await fetch(API, {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({ title: titleEl.value, text: textEl.value })
        });
        const data = await res.json();
        
        if (!res.ok) {
            throw new Error(data.error || 'Сервер ответил ошибкой: ' + res.status);
        }
        
        titleEl.value = '';
        textEl.value = '';
        await loadNews();
    } catch (e) {
        alert('Ошибка при публикации: ' + e.message);
    } finally {
        btn.disabled = false;
        btn.innerHTML = '<i class="material-icons" style="font-size:18px;">send</i> опубликовать';
    }
}

document.getElementById('submit-btn').addEventListener('click', postNews);

document.addEventListener('pointerdown', (e) => {
    const target = e.target.closest('.wp-btn, .post, .wp-box');
    if (!target) return;
    const rect = target.getBoundingClientRect();
    const rotateY = ((e.clientX - rect.left - rect.width / 2) / (rect.width / 2)) * 8;
    const rotateX = -((e.clientY - rect.top - rect.height / 2) / (rect.height / 2)) * 8;
    target.style.transform = 'perspective(600px) scale(0.97) rotateX(' + rotateX + 'deg) rotateY(' + rotateY + 'deg)';
    target.style.transition = 'transform 0.05s ease-out';
    const reset = () => { target.style.transform = ''; target.style.transition = 'transform 0.3s cubic-bezier(0.1, 0.9, 0.2, 1)'; document.removeEventListener('pointerup', reset); target.removeEventListener('pointerleave', reset); };
    document.addEventListener('pointerup', reset);
    target.addEventListener('pointerleave', reset);
});

loadNews();
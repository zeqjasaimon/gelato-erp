// Inizializza l'archivio utenti in memoria se non esiste ancora
if (!localStorage.getItem('erp_utenti')) {
    const utentiIniziali = [
        { email: "admin@gelateria.com", pass: "master2027", nome: "Capo Laboratorio", ruolo: "Amministratore" }
    ];
    localStorage.setItem('erp_utenti', JSON.stringify(utentiIniziali));
}

let utenteCorrente = null;

// Funzioni per scambiare visivamente i moduli Login / Registrazione
window.mostraRegistrazione = function() {
    document.getElementById('box-login').classList.add('hidden');
    document.getElementById('box-register').classList.remove('hidden');
    nascondiMessaggio();
};

window.mostraLogin = function() {
    document.getElementById('box-register').classList.add('hidden');
    document.getElementById('box-login').classList.remove('hidden');
    nascondiMessaggio();
};

function mostraMessaggio(testo, tipo) {
    const msg = document.getElementById('auth-message');
    msg.innerText = testo;
    msg.classList.remove('hidden', 'text-red-400', 'text-emerald-400');
    msg.classList.add(tipo === 'error' ? 'text-red-400' : 'text-emerald-400');
}

function nascondiMessaggio() {
    document.getElementById('auth-message').classList.add('hidden');
}

// GESTORE DEL LOGIN
document.getElementById('login-form').addEventListener('submit', function(e) {
    e.preventDefault();
    const email = document.getElementById('login-email').value.trim();
    const pass = document.getElementById('login-password').value;
    
    const utenti = JSON.parse(localStorage.getItem('erp_utenti'));
    const utente = utenti.find(u => u.email === email && u.pass === pass);
    
    if (utente) {
        utenteCorrente = utente;
        document.getElementById('auth-container').classList.add('hidden');
        document.getElementById('app-container').classList.remove('hidden');
        
        document.getElementById('user-display').innerText = utente.nome;
        document.getElementById('role-display').innerText = utente.ruolo;
        
        navigaA('magazzino');
    } else {
        mostraMessaggio("⚠️ Email o Password errate. Riprova.", "error");
    }
});

// GESTORE DELLA REGISTRAZIONE (Nuovo utente)
document.getElementById('register-form').addEventListener('submit', function(e) {
    e.preventDefault();
    const nome = document.getElementById('reg-nome').value.trim();
    const email = document.getElementById('reg-email').value.trim();
    const pass = document.getElementById('reg-password').value;
    
    if (pass.length < 4) {
        mostraMessaggio("⚠️ La password deve contenere almeno 4 caratteri.", "error");
        return;
    }

    let utenti = JSON.parse(localStorage.getItem('erp_utenti'));
    
    // Controlla se l'email esiste già
    if (utenti.some(u => u.email === email)) {
        mostraMessaggio("⚠️ Questo indirizzo email è già registrato.", "error");
        return;
    }

    // Aggiungi il nuovo utente all'archivio
    const nuovoUtente = { email, pass, nome, ruolo: "Amministratore" };
    utenti.push(nuovoUtente);
    localStorage.setItem('erp_utenti', JSON.stringify(utenti));

    mostraMessaggio("🎉 Registrazione completata! Ora puoi accedere.", "success");
    document.getElementById('register-form').reset();
    
    // Rimanda al login dopo 2 secondi
    setTimeout(() => {
        mostraLogin();
        document.getElementById('login-email').value = email;
    }, 2000);
});

// FUNZIONE DI LOGOUT
window.logout = function() {
    utenteCorrente = null;
    document.getElementById('app-container').classList.add('hidden');
    document.getElementById('auth-container').classList.remove('hidden');
    document.getElementById('login-form').reset();
    mostraLogin();
};

// ROUTER CENTRALE (Per il caricamento asincrono delle sezioni)
window.navigaA = async function(sezione) {
    const contenitore = document.getElementById('contenuto-dinamico');
    if (!contenitore) return;
    
    ['magazzino', 'ricette', 'produzione', 'analisi'].forEach(s => {
        const btn = document.getElementById(`btn-${s}`);
        if(btn) {
            btn.classList.remove('bg-indigo-600', 'text-white');
            btn.classList.add('text-slate-400');
        }
    });
    
    const btnAttivo = document.getElementById(`btn-${sezione}`);
    if(btnAttivo) {
        btnAttivo.classList.add('bg-indigo-600', 'text-white');
        btnAttivo.classList.remove('text-slate-400');
    }

    try {
        const risposta = await fetch(`sezioni/${sezione}/${sezione}.html`);
        if(!risposta.ok) throw new Error("File non trovato");
        const html = await risposta.text();
        
        contenitore.innerHTML = html;

        const vecchioScript = document.getElementById('script-sezione');
        if(vecchioScript) vecchioScript.remove();

        const nuovoScript = document.createElement('script');
        nuovoScript.id = 'script-sezione';
        nuovoScript.src = `sezioni/${sezione}/${sezione}.js?v=${new Date().getTime()}`;
        document.body.appendChild(nuovoScript);

    } catch (error) {
        contenitore.innerHTML = `<div class="p-4 bg-red-900/30 text-red-400 border border-red-800 rounded-lg">Impossibile caricare il modulo ${sezione}. Assicurati che i file esistano su GitHub.</div>`;
    }
};

// Inizializza l'archivio utenti e le configurazioni Master di default se non esistono
if (!localStorage.getItem('erp_utenti')) {
    const utentiIniziali = [
        { email: "admin@gelateria.com", pass: "master2027", nome: "Simone Admin", ruolo: "Amministratore" }
    ];
    localStorage.setItem('erp_utenti', JSON.stringify(utentiIniziali));
}

// Ingredienti di default configurabili dal Super-Admin
if (!localStorage.getItem('master_default_ingredienti')) {
    const defaultIngredienti = [
        { id: 1, nome: "Latte Intero Alta Qualità", cat: "Base Liquida", qta: 100, min: 50, prezzo: 1.10 },
        { id: 2, nome: "Zucchero Saccarosio", cat: "Zuccheri", qta: 50, min: 20, prezzo: 1.40 },
        { id: 3, nome: "Panna Fresca 35%", cat: "Grassi", qta: 30, min: 15, prezzo: 4.80 }
    ];
    localStorage.setItem('master_default_ingredienti', JSON.stringify(defaultIngredienti));
}

let utenteCorrente = null;

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
    if(msg) {
        msg.innerText = testo;
        msg.classList.remove('hidden', 'text-red-400', 'text-emerald-400');
        msg.classList.add(tipo === 'error' ? 'text-red-400' : 'text-emerald-400');
    }
}

function nascondiMessaggio() {
    const msg = document.getElementById('auth-message');
    if(msg) msg.classList.add('hidden');
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
        
        // Nascondi il login
        document.getElementById('auth-container').classList.add('hidden');
        
        // Mostra la dashboard (gestisce sia app-container che app-dashboard per sicurezza)
        const d1 = document.getElementById('app-container');
        const d2 = document.getElementById('app-dashboard');
        if(d1) d1.classList.remove('hidden');
        if(d2) d2.classList.remove('hidden');
        
        // Aggiorna i testi del profilo operatore
        const uDisp = document.getElementById('user-display');
        const rDisp = document.getElementById('role-display');
        if(uDisp) uDisp.innerText = utente.nome;
        if(rDisp) rDisp.innerText = utente.ruolo;
        
        // Sblocca la Console Master se l'utente è l'Admin Master
        const btnConsole = document.getElementById('btn-console');
        if (btnConsole) {
            if (utente.ruolo === "Amministratore") {
                btnConsole.classList.remove('hidden');
            } else {
                btnConsole.classList.add('hidden');
            }
        }
        
        window.navigaA('magazzino');
    } else {
        mostraMessaggio("⚠️ Email o Password errate. Riprova.", "error");
    }
});

// GESTORE DELLA REGISTRAZIONE
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
    
    if (utenti.some(u => u.email === email)) {
        mostraMessaggio("⚠️ Questo indirizzo email è già registrato.", "error");
        return;
    }

    utenti.push({ email, pass, nome, ruolo: "Operatore" });
    localStorage.setItem('erp_utenti', JSON.stringify(utenti));

    const defaultIngredienti = JSON.parse(localStorage.getItem('master_default_ingredienti'));
    localStorage.setItem('mp_inventario', JSON.stringify(defaultIngredienti));

    mostraMessaggio("🎉 Registrazione completata! Pacchetto iniziale inserito.", "success");
    document.getElementById('register-form').reset();
    
    setTimeout(() => {
        window.mostraLogin();
        document.getElementById('login-email').value = email;
    }, 2000);
});

// FUNZIONE DI LOGOUT
window.logout = function() {
    utenteCorrente = null;
    const d1 = document.getElementById('app-container');
    const d2 = document.getElementById('app-dashboard');
    if(d1) d1.classList.add('hidden');
    if(d2) d2.classList.add('hidden');
    
    document.getElementById('auth-container').classList.remove('hidden');
    document.getElementById('login-form').reset();
    window.mostraLogin();
};

// ROUTER CENTRALE ASINCRONO (Compatibile al 100% con i percorsi GitHub)
window.navigaA = async function(sezione) {
    const contenitore = document.getElementById('contenuto-dinamico') || document.getElementById('main-content');
    if (!contenitore) return;
    
    ['magazzino', 'ricette', 'produzione', 'analisi', 'console'].forEach(s => {
        const btn = document.getElementById(`btn-${s}`);
        if(btn) {
            btn.className = "w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-slate-400 hover:bg-slate-900 hover:text-white transition cursor-pointer";
        }
    });
    
    const btnAttivo = document.getElementById(`btn-${sezione}`);
    if(btnAttivo) {
        btnAttivo.className = "w-full flex items-center space-x-3 px-4 py-3 rounded-lg bg-indigo-600 text-white transition cursor-pointer";
    }

    try {
        // Percorso relativo puro, ideale per GitHub Pages
        const risposta = await fetch(`sezioni/${sezione}/${sezione}.html`);
        if(!risposta.ok) throw new Error(`Impossibile trovare il file sezioni/${sezione}/${sezione}.html`);
        const html = await risposta.text();
        
        contenitore.innerHTML = html;

        const vecchioScript = document.getElementById('script-sezione');
        if(vecchioScript) vecchioScript.remove();

        const nuovoScript = document.createElement('script');
        nuovoScript.id = 'script-sezione';
        nuovoScript.src = `sezioni/${sezione}/${sezione}.js?v=${new Date().getTime()}`;
        document.body.appendChild(nuovoScript);

    } catch (error) {
        contenitore.innerHTML = `<div class="p-4 bg-red-900/30 text-red-400 border border-red-800 rounded-lg">
            <strong>Errore di caricamento:</strong> ${error.message}<br>
            <span class="text-xs text-slate-400">Verifica che la cartella su GitHub si chiami esattamente <code>sezioni/${sezione}/</code> in minuscolo.</span>
        </div>`;
    }
};

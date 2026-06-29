// Database simulato degli utenti autorizzati
const UTENTI_AUTORIZZATI = [
    { email: "admin@gelateria.com", pass: "master2027", nome: "Capo Laboratorio", ruolo: "Amministratore" },
    { email: "operaio@gelateria.com", pass: "gelato123", nome: "Team Produzione", ruolo: "Operatore" }
];

let utenteCorrente = null;

// Gestore del Login
document.getElementById('login-form').addEventListener('submit', function(e) {
    e.preventDefault();
    const email = document.getElementById('login-email').value;
    const pass = document.getElementById('login-password').value;
    
    const utente = UTENTI_AUTORIZZATI.find(u => u.email === email && u.pass === pass);
    
    if(utente) {
        utenteCorrente = utente;
        document.getElementById('auth-container').classList.add('hidden');
        document.getElementById('app-container').classList.remove('hidden');
        
        document.getElementById('user-display').innerText = utente.nome;
        document.getElementById('role-display').innerText = utente.ruolo;
        
        // Vai alla sezione di default
        navigaA('magazzino');
    } else {
        const err = document.getElementById('login-error');
        err.classList.remove('hidden');
        setTimeout(() => err.classList.add('hidden'), 4000);
    }
});

// Funzione di Logout
function logout() {
    utenteCorrente = null;
    document.getElementById('app-container').classList.add('hidden');
    document.getElementById('auth-container').classList.remove('hidden');
    document.getElementById('login-form').reset();
}

// Router Centrale: Carica le sezioni in modo asincrono
async function navigaA(sezione) {
    const contenitore = document.getElementById('contenuto-dinamico');
    
    // Rimuovi lo stato attivo da tutti i bottoni
    ['magazzino', 'ricette', 'produzione', 'analisi'].forEach(s => {
        document.getElementById(`btn-${s}`).classList.remove('bg-indigo-600', 'text-white');
        document.getElementById(`btn-${s}`).classList.add('text-slate-400');
    });
    
    // Attiva il bottone corrente
    document.getElementById(`btn-${sezione}`).classList.add('bg-indigo-600', 'text-white');
    document.getElementById(`btn-${sezione}`).classList.remove('text-slate-400');

    try {
        // Rimosso il punto iniziale per rendere il percorso compatibile al 100% con GitHub Pages
        const risposta = await fetch(`sezioni/${sezione}/${sezione}.html`);
        if(!risposta.ok) throw new Error("Errore nel caricamento del modulo");
        const html = await risposta.text();
        
        contenitore.innerHTML = html;

        const vecchioScript = document.getElementById('script-sezione');
        if(vecchioScript) vecchioScript.remove();

        const nuovoScript = document.createElement('script');
        nuovoScript.id = 'script-sezione';
        nuovoScript.src = `sezioni/${sezione}/${sezione}.js?v=${new Date().getTime()}`;
        document.body.appendChild(nuovoScript);

    } catch (error) {
        contenitore.innerHTML = `<div class="p-4 bg-red-900/30 text-red-400 border border-red-800 rounded-lg">Impossibile caricare il modulo ${sezione}: ${error.message}</div>`;
    }
}

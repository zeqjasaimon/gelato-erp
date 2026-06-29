// Inizializza l'archivio utenti e l'admin se non esistono
if (!localStorage.getItem('erp_utenti')) {
    const utentiIniziali = [
        { email: "admin@gelateria.com", pass: "master2027", nome: "Saimon Admin", ruolo: "Amministratore", approvato: true, gelateria: "Master HQ", indirizzo: "Arco, TN" }
    ];
    localStorage.setItem('erp_utenti', JSON.stringify(utentiIniziali));
}

// Ingredienti di default
if (!localStorage.getItem('master_default_ingredienti')) {
    const defaultIngredienti = [
        { id: 1, nome: "Latte Intero Alta Qualità", cat: "Base Liquida", qta: 100, min: 50, prezzo: 1.10 },
        { id: 2, nome: "Zucchero Saccarosio", cat: "Zuccheri", qta: 50, min: 20, prezzo: 1.40 },
        { id: 3, nome: "Panna Fresca 35%", cat: "Grassi", qta: 30, min: 15, prezzo: 4.80 }
    ];
    localStorage.setItem('master_default_ingredienti', JSON.stringify(defaultIngredienti));
}

let utenteCorrente = null;

// Funzione globale per simulare le email a schermo
window.simulaInvioEmail = function(titolo, messaggio) {
    const box = document.getElementById('email-simulator-box');
    const testo = document.getElementById('email-simulator-text');
    if(box && testo) {
        testo.innerHTML = `<strong>${titolo}</strong><br><br>${messaggio}`;
        box.classList.remove('hidden');
    }
};

window.mostraRegistrazione = function() {
    document.getElementById('box-login').classList.add('hidden');
    document.getElementById('box-register').classList.remove('hidden');
};

window.mostraLogin = function() {
    document.getElementById('box-register').classList.add('hidden');
    document.getElementById('box-login').classList.remove('hidden');
};

// LOGIN CON CONTROLLO APPROVAZIONE
document.getElementById('login-form').addEventListener('submit', function(e) {
    e.preventDefault();
    const email = document.getElementById('login-email').value.trim();
    const pass = document.getElementById('login-password').value;
    
    const utenti = JSON.parse(localStorage.getItem('erp_utenti'));
    const utente = utenti.find(u => u.email === email && u.pass === pass);
    
    if (utente) {
        if (!utente.approvato) {
            alert("⚠️ Il tuo account è in fase di revisione. Riceverai una mail non appena Saimon approverà la tua richiesta!");
            return;
        }
        
        utenteCorrente = utente;
        document.getElementById('auth-container').classList.add('hidden');
        document.getElementById('app-container').classList.remove('hidden');
        
        document.getElementById('user-display').innerText = utente.nome;
        document.getElementById('role-display').innerText = utente.ruolo;
        
        const btnConsole = document.getElementById('btn-console');
        if (btnConsole) {
            if (utente.ruolo === "Amministratore") btnConsole.classList.remove('hidden');
            else btnConsole.classList.add('hidden');
        }
        
        window.navigaA('magazzino');
    } else {
        alert("⚠️ Email o Password errate.");
    }
});

// REGISTRAZIONE CON NUOVI CAMPI ED EMAIL AUTOMATICHE (1 e 2)
document.getElementById('register-form').addEventListener('submit', function(e) {
    e.preventDefault();
    const titolare = document.getElementById('reg-titolare').value.trim();
    const gelateria = document.getElementById('reg-gelateria').value.trim();
    const indirizzo = document.getElementById('reg-indirizzo').value.trim();
    const email = document.getElementById('reg-email').value.trim();
    const pass = document.getElementById('reg-password').value;
    
    if (pass.length < 4) {
        alert("⚠️ La password deve contenere almeno 4 caratteri.");
        return;
    }

    let utenti = JSON.parse(localStorage.getItem('erp_utenti'));
    if (utenti.some(u => u.email === email)) {
        alert("⚠️ Email già registrata.");
        return;
    }

    // Salva l'utente impostando 'approvato: false'
    utenti.push({ 
        email, pass, nome: titolare, gelateria, indirizzo, 
        ruolo: "Operatore", approvato: false 
    });
    localStorage.setItem('erp_utenti', JSON.stringify(utenti));

    alert("🎉 Richiesta inviata con successo! Il tuo profilo è in attesa di approvazione.");
    document.getElementById('register-form').reset();
    window.mostraLogin();

    // EMAIL 1: Al cliente appena registrato
    setTimeout(() => {
        window.simulaInvioEmail(
            "📧 Email inviata a: " + email,
            "Ciao " + titolare + ", abbiamo ricevuto la tua richiesta per la gelateria <strong>" + gelateria + "</strong>. Il nostro team verificherà i dati il prima possibile!"
        );
    }, 1500);

    // EMAIL 2: A te (Saimon Admin) per avvisarti della revisione
    setTimeout(() => {
        window.simulaInvioEmail(
            "📧 Email ricevuta da: Saimon Admin (admin@gelateria.com)",
            "Un nuovo utente si è registrato!<br><strong>Titolare:</strong> " + titolare + "<br><strong>Gelateria:</strong> " + gelateria + "<br><strong>Sede:</strong> " + indirizzo + "<br>Accedi alla Console Master per approvarlo o rifiutarlo."
        );
    }, 5000);
});

window.logout = function() {
    utenteCorrente = null;
    document.getElementById('app-container').classList.add('hidden');
    document.getElementById('auth-container').classList.remove('hidden');
    window.mostraLogin();
};

window.navigaA = async function(sezione) {
    const contenitore = document.getElementById('contenuto-dinamico');
    if (!contenitore) return;

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
        contenitore.innerHTML = `<div class="p-4 bg-red-900/30 text-red-400 rounded-lg">Errore nel caricamento del modulo ${sezione}.</div>`;
    }
};

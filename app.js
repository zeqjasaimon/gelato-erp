// ==========================================
// 1. IMPORTAZIONE MODULI FIREBASE (CLOUD)
// ==========================================
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { 
    getAuth, 
    createUserWithEmailAndPassword, 
    signInWithEmailAndPassword, 
    signOut, 
    onAuthStateChanged 
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import { 
    getFirestore, 
    doc, 
    setDoc, 
    getDoc 
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

// La tua configurazione ufficiale salvata su Firebase
const firebaseConfig = {
  apiKey: "AIzaSyDAVkzzL0oaEZ0ajP7ol-8WtwbXOSMFRR4",
  authDomain: "gelateria-erp.firebaseapp.com",
  projectId: "gelateria-erp",
  storageBucket: "gelateria-erp.firebasestorage.app",
  messagingSenderId: "614362128350",
  appId: "1:614362128350:web:00dc0d950061a8274a874f",
  measurementId: "G-E0ZRTLQL6E"
};

// Inizializzazione dei servizi Cloud
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// Rendiamo i servizi accessibili anche agli altri file (.js) delle sezioni
window.fbAuth = auth;
window.fbDb = db;

// ==========================================
// 2. LOGICA DI CONTROLLO ACCESSO (AUTH LOOPS)
// ==========================================

onAuthStateChanged(auth, async (user) => {
    if (user) {
        const docRef = doc(db, "utenti", user.uid);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
            const datiUtente = docSnap.data();

            if (!datiUtente.approvato) {
                alert("⚠️ Il tuo account è in fase di revisione. Riceverai una mail non appena Saimon approverà la tua richiesta!");
                await signOut(auth);
                return;
            }

            localStorage.setItem('current_user_email', datiUtente.email);

            document.getElementById('auth-container').classList.add('hidden');
            document.getElementById('app-container').classList.remove('hidden');
            
            document.getElementById('user-display').innerText = datiUtente.nome;
            document.getElementById('role-display').innerText = datiUtente.ruolo;
            
            const btnConsole = document.getElementById('btn-console');
            if (btnConsole) {
                if (datiUtente.ruolo === "Amministratore") {
                    btnConsole.classList.remove('hidden');
                } else {
                    btnConsole.classList.add('hidden');
                }
            }
            
            window.navigaA('magazzino');
        }
    } else {
        localStorage.removeItem('current_user_email');
        document.getElementById('app-container').classList.add('hidden');
        document.getElementById('auth-container').classList.remove('hidden');
        window.mostraLogin();
    }
});

// GESTORE ACCESSO (LOGIN)
document.getElementById('login-form').addEventListener('submit', async function(e) {
    e.preventDefault();
    const email = document.getElementById('login-email').value.trim();
    const pass = document.getElementById('login-password').value;
    
    try {
        await signInWithEmailAndPassword(auth, email, pass);
    } catch (error) {
        console.error(error);
        alert("⚠️ Email o Password errate o utente non esistente sul Cloud.");
    }
});

// GESTORE REGISTRAZIONE (REGISTRAZIONE CLOUD + INVENTARIO DI PARTENZA)
document.getElementById('register-form').addEventListener('submit', async function(e) {
    e.preventDefault();
    const titolare = document.getElementById('reg-titolare').value.trim();
    const gelateria = document.getElementById('reg-gelateria').value.trim();
    const indirizzo = document.getElementById('reg-indirizzo').value.trim();
    const email = document.getElementById('reg-email').value.trim();
    const pass = document.getElementById('reg-password').value;
    
    if (pass.length < 6) {
        alert("⚠️ Per motivi di sicurezza, la password deve contenere almeno 6 caratteri.");
        return;
    }

    try {
        const userCredential = await createUserWithEmailAndPassword(auth, email, pass);
        const user = userCredential.user;

        const isAdmin = email === "admin@gelateria.com";

        // Crea anagrafica su Firestore
        await setDoc(doc(db, "utenti", user.uid), {
            uid: user.uid,
            email: email,
            nome: titolare,
            gelateria: gelateria,
            indirizzo: indirizzo,
            ruolo: isAdmin ? "Amministratore" : "Operatore",
            approvato: isAdmin ? true : false
        });

        // Crea magazzino di base online per questo utente
        const defaultIngredienti = [
            { id: 1, nome: "Latte Intero Alta Qualità", cat: "Base Liquida", qta: 100, min: 50, prezzo: 1.10 },
            { id: 2, nome: "Zucchero Saccarosio", cat: "Zuccheri", qta: 50, min: 20, prezzo: 1.40 },
            { id: 3, nome: "Panna Fresca 35%", cat: "Grassi", qta: 30, min: 15, prezzo: 4.80 },
            { id: 4, nome: "Miscela Base Pastorizzata", cat: "Semilavorati", qta: 0, min: 10, prezzo: 0.00 }
        ];

        await setDoc(doc(db, "magazzini", user.uid), { articoli: defaultIngredienti });

        alert(isAdmin ? "🎉 Admin configurato con successo sul Cloud!" : "🎉 Richiesta inviata sul Cloud! Profilo in attesa di approvazione.");
        
        document.getElementById('register-form').reset();
        await signOut(auth);
        window.mostraLogin();

    } catch (error) {
        console.error(error);
        alert("⚠️ Errore durante la registrazione Cloud: " + error.message);
    }
});

// GESTORE USCITA (LOGOUT)
window.logout = async function() {
    try {
        await signOut(auth);
    } catch (error) {
        console.error("Errore durante il logout:", error);
    }
};

// ==========================================
// 3. INTERFACCIA E NAVIGAZIONE DINAMICA
// ==========================================
window.mostraRegistrazione = function() {
    document.getElementById('box-login').classList.add('hidden');
    document.getElementById('box-register').classList.remove('hidden');
};

window.mostraLogin = function() {
    document.getElementById('box-register').classList.add('hidden');
    document.getElementById('box-login').classList.remove('hidden');
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
        nuovoScript.type = 'module'; // Fondamentale per i sottomoduli
        nuovoScript.src = `sezioni/${sezione}/${sezione}.js?v=${new Date().getTime()}`;
        document.body.appendChild(nuovoScript);
    } catch (error) {
        contenitore.innerHTML = `<div class="p-4 bg-red-900/30 text-red-400 rounded-lg">Errore di caricamento della sezione.</div>`;
    }
};

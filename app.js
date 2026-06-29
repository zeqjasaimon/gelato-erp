// Funzione per caricare dinamicamente le sezioni HTML e i relativi script
function caricaSezione(nomeSezione) {
    const contenitore = document.getElementById('contenuto-dinamico');
    if (!contenitore) return;

    // Carica il file HTML della sezione
    fetch(`sezioni/${nomeSezione}/${nomeSezione}.html`)
        .then(response => {
            if (!response.ok) throw new Error(`Impossibile caricare la sezione: ${nomeSezione}`);
            return response.text();
        })
        .then(html => {
            contenitore.innerHTML = html;

            // Rimuove eventuali script della sezione precedentemente caricati per evitare duplicati
            const vecchioScript = document.getElementById('script-sezione-attivo');
            if (vecchioScript) vecchioScript.remove();

            // Crea e inserisce il tag script per il file JS della sezione corrente
            const nuovoScript = document.createElement('script');
            nuovoScript.src = `sezioni/${nomeSezione}/${nomeSezione}.js`;
            nuovoScript.id = 'script-sezione-attivo';
            nuovoScript.type = 'module'; // IMPORTANTE: Impostato come modulo per supportare Firebase import
            document.body.appendChild(nuovoScript);

            // Aggiorna lo stato dei menu laterali (classe active)
            document.querySelectorAll('aside nav a').forEach(link => {
                link.classList.remove('bg-slate-800', 'text-white');
                if (link.getAttribute('onclick') === `caricaSezione('${nomeSezione}')`) {
                    link.classList.add('bg-slate-800', 'text-white');
                }
            });
        })
        .catch(error => {
            console.error("Errore nel caricamento della sezione:", error);
            contenitore.innerHTML = `<div class="p-4 text-red-400">⚠️ Errore nel caricamento della pagina selezionata.</div>`;
        });
}

// Funzione di logout globale
window.logout = function() {
    if (window.fbAuth) {
        window.fbAuth.signOut().then(() => {
            localStorage.removeItem('current_user_email');
            location.reload();
        }).catch(err => {
            console.error("Errore durante il logout:", err);
        });
    } else {
        localStorage.removeItem('current_user_email');
        location.reload();
    }
};

// Avvio automatico sulla console se l'utente è l'amministratore (Saimon)
document.addEventListener("DOMContentLoaded", () => {
    const email = localStorage.getItem('current_user_email');
    if (email === "saimon@gelato.it") {
        caricaSezione('console');
    } else {
        caricaSezione('magazzino');
    }
});

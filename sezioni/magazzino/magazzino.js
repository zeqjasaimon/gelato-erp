import { doc, getDoc, setDoc } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

let idArticoloInModifica = null;

function getUidUtente() {
    return window.fbAuth && window.fbAuth.currentUser ? window.fbAuth.currentUser.uid : null;
}

// INIZIALIZZA IL MAGAZZINO
async function inizializzaMagazzino() {
    idArticoloInModifica = null;
    const uid = getUidUtente();
    
    if (!uid) {
        console.warn("In attesa di autenticazione Firebase...");
        return;
    }

    const form = document.getElementById('form-aggiungi-mp');
    if (form) form.reset();
    
    const btnSalva = document.querySelector('#form-aggiungi-mp button[type="submit"]');
    if (btnSalva) btnSalva.innerText = "💾 Inserisci in Magazzino";

    // Aggancia l'evento di submit se il form esiste nella pagina
    if (form && !form.dataset.listenerAgganciato) {
        form.dataset.listenerAgganciato = "true";
        form.addEventListener('submit', async function(e) {
            e.preventDefault();
            await gestisciInviaForm();
        });
    }

    await renderTabellaMagazzino();
}

async function ottieniArticoliCloud(uid) {
    try {
        const docRef = doc(window.fbDb, "magazzini", uid);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) return docSnap.data().articoli || [];
    } catch (error) {
        console.error("Errore recupero Cloud:", error);
    }
    return [];
}

async function salvaArticoliCloud(uid, articoli) {
    try {
        const docRef = doc(window.fbDb, "magazzini", uid);
        await setDoc(docRef, { articoli: articoli });
    } catch (error) {
        alert("⚠️ Errore di connessione al Cloud.");
    }
}

async function gestisciInviaForm() {
    const uid = getUidUtente();
    if (!uid) return;

    const elNome = document.getElementById('mp-nome') || document.getElementById('nome');
    const elCat = document.getElementById('mp-categoria') || document.getElementById('categoria');
    const elQta = document.getElementById('mp-quantita') || document.getElementById('mp-qta') || document.getElementById('giacenza');
    const elMin = document.getElementById('mp-scorta') || document.getElementById('mp-min') || document.getElementById('scorta');
    const elPrezzo = document.getElementById('mp-prezzo') || document.getElementById('prezzo');

    const nome = elNome ? elNome.value.trim() : "";
    const cat = elCat ? elCat.value : "Generico";
    const qta = elQta ? (parseFloat(elQta.value) || 0) : 0;
    const min = elMin ? (parseFloat(elMin.value) || 0) : 0;
    const prezzo = elPrezzo ? (parseFloat(elPrezzo.value) || 0) : 0;

    if (!nome) {
        alert("⚠️ Inserisci il nome dell'ingrediente.");
        return;
    }

    let inventario = await ottieniArticoliCloud(uid);

    if (idArticoloInModifica !== null) {
        let indice = inventario.findIndex(item => item.id === idArticoloInModifica);
        if (indice !== -1) {
            inventario[indice].nome = nome;
            inventario[indice].cat = cat;
            inventario[indice].qta = qta;
            inventario[indice].min = min;
            inventario[indice].prezzo = prezzo;
            alert(`🎉 Ingrediente "${nome}" aggiornato!`);
        }
    } else {
        if (inventario.some(i => i.nome.toLowerCase() === nome.toLowerCase())) {
            alert("⚠️ Questo ingrediente è già presente.");
            return;
        }
        inventario.push({ id: Date.now(), nome, cat, qta, min, prezzo });
        alert(`🎉 "${nome}" salvato con successo!`);
    }

    await salvaArticoliCloud(uid, inventario);
    
    const modal = document.getElementById('modal-materia') || document.getElementById('modal-ingrediente');
    if (modal) modal.classList.add('hidden');
    
    await inizializzaMagazzino();
}

// ESPOSIZIONE DELLE FUNZIONI SULLA FINESTRA GLOBALE
window.apriModalMateria = function() {
    idArticoloInModifica = null;
    const form = document.getElementById('form-aggiungi-mp');
    if (form) form.reset();

    const btnSalva = document.querySelector('#form-aggiungi-mp button[type="submit"]');
    if (btnSalva) btnSalva.innerText = "💾 Inserisci in Magazzino";

    const modal = document.getElementById('modal-materia') || document.getElementById('modal-ingrediente');
    if (modal) {
        modal.classList.remove('hidden');
    } else {
        const inputNome = document.getElementById('mp-nome') || document.getElementById('nome');
        if (inputNome) inputNome.focus();
    }
};

window.chiudiModalMateria = function() {
    const modal = document.getElementById('modal-materia') || document.getElementById('modal-ingrediente');
    if (modal) modal.classList.add('hidden');
    idArticoloInModifica = null;
};

window.avviaModificaArticolo = async function(id) {
    const uid = getUidUtente();
    if (!uid) return;

    let inventario = await ottieniArticoliCloud(uid);
    const articolo = inventario.find(i => i.id === id);
    if (!articolo) return;

    idArticoloInModifica = id;

    const elNome = document.getElementById('mp-nome') || document.getElementById('nome');
    const elCat = document.getElementById('mp-categoria') || document.getElementById('categoria');
    const elQta = document.getElementById('mp-quantita') || document.getElementById('mp-qta') || document.getElementById('giacenza');
    const elMin = document.getElementById('mp-scorta') || document.getElementById('mp-min') || document.getElementById('scorta');
    const elPrezzo = document.getElementById('mp-prezzo') || document.getElementById('prezzo');

    if (elNome) elNome.value = articolo.nome;
    if (elCat) elCat.value = articolo.cat || 'Generico';
    if (elQta) elQta.value = articolo.qta;
    if (elMin) elMin.value = articolo.min || 0;
    if (elPrezzo) elPrezzo.value = articolo.prezzo;

    const btnSalva = document.querySelector('#form-aggiungi-mp button[type="submit"]');
    if (btnSalva) btnSalva.innerText = "🔄 Aggiorna Articolo";

    const modal = document.getElementById('modal-materia') || document.getElementById('modal-ingrediente');
    if (modal) modal.classList.remove('hidden');
}

window.aggiornaGiacenzaRapida = async function(id) {
    const uid = getUidUtente();
    const input = document.getElementById(`rapido-${id}`);
    const valore = parseFloat(input.value) || 0;
    if (valore === 0 || !uid) return;

    let inventario = await ottieniArticoliCloud(uid);
    let articolo = inventario.find(i => i.id === id);
    
    if (articolo) {
        articolo.qta += valore;
        if (articolo.qta < 0) articolo.qta = 0;
        await salvaArticoliCloud(uid, inventario);
        await renderTabellaMagazzino();
        input.value = "";
    }
};

window.eliminaArticoloMagazzino = async function(id, nome) {
    const uid = getUidUtente();
    if (!uid) return;

    if (!confirm(`Sei sicuro di voler eliminare "${nome}"?`)) return;
    
    let inventario = await ottieniArticoliCloud(uid);
    inventario = inventario.filter(i => i.id !== id);
    
    await salvaArticoliCloud(uid, inventario);
    await renderTabellaMagazzino();
};

async function renderTabellaMagazzino() {
    const uid = getUidUtente();
    if (!uid) return;

    const inventario = await ottieniArticoliCloud(uid);
    const tbody = document.getElementById('tabella-magazzino');
    if (!tbody) return;

    tbody.innerHTML = "";
    let contatoreSottoScorta = 0;
    let valoreTotaleMagazzino = 0;

    if (inventario.length === 0) {
        tbody.innerHTML = `<tr><td colspan="6" class="p-4 text-center text-slate-500 italic">Il tuo magazzino è vuoto. Clicca su "Inserisci Ingrediente" in alto.</td></tr>`;
        if(document.getElementById('tot-ingredienti')) document.getElementById('tot-ingredienti').innerText = "0";
        if(document.getElementById('tot-sottoscorta')) document.getElementById('tot-sottoscorta').innerText = "0";
        if(document.getElementById('valore-magazzino')) document.getElementById('valore-magazzino').innerText = "€ 0.00";
        return;
    }

    inventario.forEach(item => {
        const sottoSoglia = item.qta <= (item.min || 0);
        if (sottoSoglia) contatoreSottoScorta++;
        valoreTotaleMagazzino += (item.qta * item.prezzo);

        const rigaAllarmeClass = sottoSoglia ? 'bg-rose-500/5 hover:bg-rose-500/10' : 'hover:bg-slate-800/20';
        const badgeStato = sottoSoglia 
            ? `<span class="px-2 py-1 text-[10px] font-bold bg-rose-500/10 text-rose-400 border border-rose-500/20 rounded-md uppercase tracking-wider">Sotto Scorta</span>`
            : `<span class="px-2 py-1 text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-md uppercase tracking-wider">OK</span>`;

        tbody.innerHTML += `
            <tr class="text-slate-300 border-b border-slate-800/60 text-xs ${rigaAllarmeClass}">
                <td class="p-4 font-bold text-white text-sm">${item.nome}</td>
                <td class="p-4 uppercase text-slate-400 font-semibold tracking-wider text-[10px]">${item.cat || 'Generico'}</td>
                <td class="p-4 font-mono text-right text-sm ${sottoSoglia ? 'text-rose-400 font-bold' : 'text-sky-400 font-semibold'}">${(item.qta || 0).toFixed(2)} kg</td>
                <td class="p-4 font-mono text-right text-emerald-400 font-medium">€ ${(item.prezzo || 0).toFixed(2)}</td>
                <td class="p-4 text-center">${badgeStato}</td>
                <td class="p-4 text-center">
                    <div class="flex items-center justify-center gap-2">
                        <button onclick="avviaModificaArticolo(${item.id})" class="text-slate-400 hover:text-sky-400 p-1.5 transition cursor-pointer">
                            <i class="fa-solid fa-pen-to-square text-sm"></i>
                        </button>
                        <button onclick="eliminaArticoloMagazzino(${item.id}, '${item.nome}')" class="text-slate-500 hover:text-rose-400 p-1.5 transition cursor-pointer">
                            <i class="fa-regular fa-trash-can text-sm"></i>
                        </button>
                    </div>
                </td>
            </tr>
        `;
    });

    if(document.getElementById('tot-ingredienti')) document.getElementById('tot-ingredienti').innerText = inventario.length;
    if(document.getElementById('tot-sottoscorta')) document.getElementById('tot-sottoscorta').innerText = contatoreSottoScorta;
    if(document.getElementById('valore-magazzino')) document.getElementById('valore-magazzino').innerText = `€ ${valoreTotaleMagazzino.toFixed(2)}`;
}

// Avvio continuo per intercettare il caricamento asincrono della pagina
setInterval(function() {
    if (window.fbAuth && window.fbAuth.currentUser) {
        const tbody = document.getElementById('tabella-magazzino');
        if (tbody && tbody.innerHTML === "") {
            inizializzaMagazzino();
        }
    }
}, 600);

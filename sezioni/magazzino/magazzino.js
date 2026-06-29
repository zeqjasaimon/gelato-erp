import { doc, getDoc, setDoc } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

let idArticoloInModifica = null;

function getUid() {
    return window.fbAuth && window.fbAuth.currentUser ? window.fbAuth.currentUser.uid : null;
}

window.apriModalMateria = function() {
    idArticoloInModifica = null;
    const form = document.getElementById('form-aggiungi-mp');
    if (form) form.reset();
    document.getElementById('modal-titolo').innerText = "💾 Inserisci Nuovo Ingrediente";
    document.getElementById('modal-materia').classList.remove('hidden');
};

window.chiudiModalMateria = function() {
    document.getElementById('modal-materia').classList.add('hidden');
    idArticoloInModifica = null;
};

window.avviaModifica = async function(id) {
    const uid = getUid();
    if(!uid) return;
    try {
        const docSnap = await getDoc(doc(window.fbDb, "magazzini", uid));
        if (!docSnap.exists()) return;
        const item = docSnap.data().articoli.find(i => i.id === id);
        if (!item) return;

        idArticoloInModifica = id;
        document.getElementById('mp-nome').value = item.nome;
        document.getElementById('mp-categoria').value = item.cat || 'Generico';
        document.getElementById('mp-quantita').value = item.qta;
        document.getElementById('mp-scorta').value = item.min || 0;
        document.getElementById('mp-prezzo').value = item.prezzo;

        document.getElementById('modal-titolo').innerText = "🔄 Modifica Ingrediente";
        document.getElementById('modal-materia').classList.remove('hidden');
    } catch(e) { console.error(e); }
};

window.eliminaArticolo = async function(id, nome) {
    const uid = getUid();
    if(!uid) return;
    if (!confirm(`Sei sicuro di voler eliminare "${nome}"?`)) return;
    try {
        const docRef = doc(window.fbDb, "magazzini", uid);
        const docSnap = await getDoc(docRef);
        if (!docSnap.exists()) return;
        const nuovo = docSnap.data().articoli.filter(i => i.id !== id);
        await setDoc(docRef, { articoli: nuovo });
        caricaTabella();
    } catch(e) { console.error(e); }
};

async function caricaTabella() {
    const uid = getUid();
    const tbody = document.getElementById('tabella-magazzino');
    if (!tbody) return;

    if (!uid) {
        tbody.innerHTML = `<tr><td colspan="6" class="p-4 text-center text-slate-500 italic">In attesa di autenticazione Cloud...</td></tr>`;
        return;
    }

    try {
        const docSnap = await getDoc(doc(window.fbDb, "magazzini", uid));
        const inventario = docSnap.exists() ? (docSnap.data().articoli || []) : [];
        
        tbody.innerHTML = "";
        let sottoScorta = 0;
        let valoreTotale = 0;

        if (inventario.length === 0) {
            tbody.innerHTML = `<tr><td colspan="6" class="p-4 text-center text-slate-500 italic">Il tuo magazzino Cloud è vuoto. Premi il pulsante in alto per iniziare.</td></tr>`;
            return;
        }

        inventario.forEach(item => {
            const isSotto = item.qta <= (item.min || 0);
            if (isSotto) sottoScorta++;
            valoreTotale += (item.qta * item.prezzo);

            const bgRow = isSotto ? 'bg-rose-500/5' : '';
            const badge = isSotto ? `<span class="px-2 py-0.5 text-[9px] bg-rose-500/10 text-rose-400 border border-rose-500/20 rounded">SOTTO SCORTA</span>` : `<span class="px-2 py-0.5 text-[9px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded">OK</span>`;

            tbody.innerHTML += `
                <tr class="text-slate-300 border-b border-slate-800/60 text-xs ${bgRow} hover:bg-slate-800/10">
                    <td class="p-4 font-bold text-white text-sm">${item.nome}</td>
                    <td class="p-4 uppercase text-slate-400 tracking-wider text-[10px]">${item.cat || 'Generico'}</td>
                    <td class="p-4 font-mono text-right text-sm ${isSotto ? 'text-rose-400 font-bold' : 'text-sky-400'}">${item.qta.toFixed(2)} kg</td>
                    <td class="p-4 font-mono text-right text-emerald-400">€ ${item.prezzo.toFixed(2)}</td>
                    <td class="p-4 text-center">${badge}</td>
                    <td class="p-4 text-center">
                        <button onclick="window.avviaModifica(${item.id})" class="text-slate-400 hover:text-sky-400 p-1 cursor-pointer"><i class="fa-solid fa-pen-to-square"></i></button>
                        <button onclick="window.eliminaArticolo(${item.id}, '${item.nome}')" class="text-slate-500 hover:text-rose-400 p-1 ml-2 cursor-pointer"><i class="fa-regular fa-trash-can"></i></button>
                    </td>
                </tr>
            `;
        });

        if(document.getElementById('tot-ingredienti')) document.getElementById('tot-ingredienti').innerText = inventario.length;
        if(document.getElementById('tot-sottoscorta')) document.getElementById('tot-sottoscorta').innerText = sottoScorta;
        if(document.getElementById('valore-magazzino')) document.getElementById('valore-magazzino').innerText = `€ ${valoreTotale.toFixed(2)}`;

    } catch (e) { console.error(e); }
}

const formElement = document.getElementById('form-aggiungi-mp');
if (formElement) {
    formElement.onsubmit = async function(e) {
        e.preventDefault();
        const uid = getUid();
        if(!uid) return;

        const nome = document.getElementById('mp-nome').value.trim();
        const cat = document.getElementById('mp-categoria').value;
        const qta = parseFloat(document.getElementById('mp-quantita').value) || 0;
        const min = parseFloat(document.getElementById('mp-scorta').value) || 0;
        const prezzo = parseFloat(document.getElementById('mp-prezzo').value) || 0;

        try {
            const docRef = doc(window.fbDb, "magazzini", uid);
            const docSnap = await getDoc(docRef);
            let inventario = docSnap.exists() ? (docSnap.data().articoli || []) : [];

            if (idArticoloInModifica !== null) {
                let idx = inventario.findIndex(i => i.id === idArticoloInModifica);
                if(idx !== -1) inventario[idx] = { id: idArticoloInModifica, nome, cat, qta, min, prezzo };
            } else {
                inventario.push({ id: Date.now(), nome, cat, qta, min, prezzo });
            }

            await setDoc(docRef, { articoli: inventario });
            window.chiudiModalMateria();
            caricaTabella();
        } catch(error) { console.error(error); }
    };
}

// Inizializzazione asincrona coordinata
let bootInterval = setInterval(() => {
    if (window.fbAuth && window.fbAuth.currentUser) {
        caricaTabella();
        clearInterval(bootInterval);
    }
}, 300);

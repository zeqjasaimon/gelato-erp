// ========================================================
// REPERTO SINCRO CLOUD PER SEZIONE MAGAZZINO (BLINDATO)
// ========================================================
import { doc, getDoc, setDoc } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

let idArticoloInModifica = null;

window.apriModalMateria = function() {
    idArticoloInModifica = null;
    const form = document.getElementById('form-aggiungi-mp');
    if (form) form.reset();
    
    const mt = document.getElementById('modal-titolo');
    if (mt) mt.innerText = "💾 Inserisci Nuovo Ingrediente";
    
    const modal = document.getElementById('modal-materia');
    if (modal) modal.classList.remove('hidden');
};

window.chiudiModalMateria = function() {
    const modal = document.getElementById('modal-materia');
    if (modal) modal.classList.add('hidden');
    idArticoloInModifica = null;
};

async function ricaricaTabellaMagazzinoCloud() {
    if (!window.fbAuth || !window.fbAuth.currentUser) return;
    const uid = window.fbAuth.currentUser.uid;
    const tbody = document.getElementById('tabella-magazzino');
    if (!tbody) return;

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
                        <button onclick="window.avviaModificaMagazzino(${item.id})" class="text-slate-400 hover:text-sky-400 p-1 cursor-pointer"><i class="fa-solid fa-pen-to-square"></i></button>
                        <button onclick="window.eliminaArticoloMagazzinoCloud(${item.id}, '${item.nome}')" class="text-slate-500 hover:text-rose-400 p-1 ml-2 cursor-pointer"><i class="fa-regular fa-trash-can"></i></button>
                    </td>
                </tr>
            `;
        });

        if(document.getElementById('tot-ingredienti')) document.getElementById('tot-ingredienti').innerText = inventario.length;
        if(document.getElementById('tot-sottoscorta')) document.getElementById('tot-sottoscorta').innerText = sottoScorta;
        if(document.getElementById('valore-magazzino')) document.getElementById('valore-magazzino').innerText = `€ ${valoreTotale.toFixed(2)}`;

        // Configura il form al volo quando la pagina viene renderizzata
        const form = document.getElementById('form-aggiungi-mp');
        if (form) {
            form.onsubmit = async function(e) {
                e.preventDefault();
                const nome = document.getElementById('mp-nome').value.trim();
                const cat = document.getElementById('mp-categoria').value;
                const qta = parseFloat(document.getElementById('mp-quantita').value) || 0;
                const min = parseFloat(document.getElementById('mp-scorta').value) || 0;
                const prezzo = parseFloat(document.getElementById('mp-prezzo').value) || 0;

                const docRef = doc(window.fbDb, "magazzini", uid);
                const snap = await getDoc(docRef);
                let inv = snap.exists() ? (snap.data().articoli || []) : [];

                if (idArticoloInModifica !== null) {
                    let idx = inv.findIndex(i => i.id === idArticoloInModifica);
                    if(idx !== -1) inv[idx] = { id: idArticoloInModifica, nome, cat, qta, min, prezzo };
                } else {
                    inv.push({ id: Date.now(), nome, cat, qta, min, prezzo });
                }

                await setDoc(docRef, { articoli: inv });
                window.chiudiModalMateria();
                ricaricaTabellaMagazzinoCloud();
            };
        }

    } catch (e) { console.error(e); }
}

window.avviaModificaMagazzino = async function(id) {
    if (!window.fbAuth || !window.fbAuth.currentUser) return;
    const uid = window.fbAuth.currentUser.uid;
    const docSnap = await getDoc(doc(window.fbDb, "magazzini", uid));
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
};

window.eliminaArticoloMagazzinoCloud = async function(id, nome) {
    if (!window.fbAuth || !window.fbAuth.currentUser) return;
    const uid = window.fbAuth.currentUser.uid;
    if (!confirm(`Eliminare ${nome}?`)) return;
    
    const docRef = doc(window.fbDb, "magazzini", uid);
    const docSnap = await getDoc(docRef);
    const nuovo = docSnap.data().articoli.filter(i => i.id !== id);
    await setDoc(docRef, { articoli: nuovo });
    ricaricaTabellaMagazzinoCloud();
};

// Guardiano costante: se la tabella del magazzino appare a schermo vuota, la popola all'istante
setInterval(() => {
    const tbody = document.getElementById('tabella-magazzino');
    if (tbody && tbody.children.length <= 1) {
        ricaricaTabellaMagazzinoCloud();
    }
}, 500);

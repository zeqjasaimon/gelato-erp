import { doc, getDoc, setDoc } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

(function() {
    const db = window.fbDb;
    const auth = window.fbAuth;

    let idArticoloInModifica = null;

    function getUidUtente() {
        return auth && auth.currentUser ? auth.currentUser.uid : null;
    }

    async function ottieniArticoliCloud(uid) {
        try {
            const docRef = doc(db, "magazzini", uid);
            const docSnap = await getDoc(docRef);
            if (docSnap.exists()) {
                return docSnap.data().articoli || [];
            }
        } catch (error) {
            console.error("Errore recupero cloud:", error);
        }
        return [];
    }

    async function salvaArticoliCloud(uid, articoli) {
        try {
            const docRef = doc(db, "magazzini", uid);
            await setDoc(docRef, { articoli: articoli });
        } catch (error) {
            console.error("Errore salvataggio cloud:", error);
            alert("⚠️ Errore di connessione. Modifiche non salvate online.");
        }
    }

    async function inizializzaMagazzino() {
        idArticoloInModifica = null;
        const uid = getUidUtente();
        if (!uid) return;

        const form = document.getElementById('form-aggiungi-mp');
        if (form) form.reset();
        
        const btnSalva = document.querySelector('#form-aggiungi-mp button[type="submit"]');
        if (btnSalva) btnSalva.innerText = "💾 Inserisci in Magazzino";

        await renderTabellaMagazzino();
    }

    // Gestione submit del form senza cloni o manipolazioni strutturali del DOM
    const formMp = document.getElementById('form-aggiungi-mp');
    if (formMp) {
        formMp.onsubmit = async function(e) {
            e.preventDefault();
            const uid = getUidUtente();
            if (!uid) return;

            // Recupero universale dei campi provando sia i vecchi che i nuovi ID
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
                    alert("⚠️ Questo ingrediente è già presente in magazzino.");
                    return;
                }
                inventario.push({ id: Date.now(), nome, cat, qta, min, prezzo });
                alert(`🎉 Ingrediente "${nome}" inserito!`);
            }

            await salvaArticoliCloud(uid, inventario);
            await inizializzaMagazzino();
        };
    }

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

        if(elNome) elNome.value = articolo.nome;
        if(elCat) elCat.value = articolo.cat || 'Base Liquida';
        if(elQta) elQta.value = articolo.qta;
        if(elMin) elMin.value = articolo.min;
        if(elPrezzo) elPrezzo.value = articolo.prezzo;

        const btnSalva = document.querySelector('#form-aggiungi-mp button[type="submit"]');
        if (btnSalva) btnSalva.innerText = "🔄 Aggiorna Articolo";

        if(elNome) elNome.focus();
    };

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
        await inizializzaMagazzino();
    };

    async function renderTabellaMagazzino() {
        const uid = getUidUtente();
        if (!uid) return;

        const inventario = await ottieniArticoliCloud(uid);
        const tbody = document.getElementById('tabella-magazzino');
        if (!tbody) return;

        tbody.innerHTML = "";

        if (inventario.length === 0) {
            tbody.innerHTML = `<tr><td colspan="6" class="p-4 text-center text-slate-500 italic">Il tuo magazzino è vuoto. Inserisci il primo ingrediente a sinistra.</td></tr>`;
            return;
        }

        inventario.forEach(item => {
            const sottoSoglia = item.qta <= (item.min || 0);
            const rigaAllarmeClass = sottoSoglia ? 'bg-rose-500/5 hover:bg-rose-500/10' : 'hover:bg-slate-800/20';
            const badgeSottoSoglia = sottoSoglia ? `<span class="ml-2 text-[9px] font-bold bg-rose-500/20 text-rose-400 border border-rose-500/30 px-1.5 py-0.5 rounded uppercase">Scorta Minima</span>` : '';

            tbody.innerHTML += `
                <tr class="text-slate-300 border-b border-slate-800/60 text-xs ${rigaAllarmeClass}">
                    <td class="p-3">
                        <span class="font-bold text-white text-sm">${item.nome}</span> ${badgeSottoSoglia}
                        <p class="text-[10px] text-slate-500 mt-0.5 uppercase tracking-wider font-semibold">${item.cat || 'Generico'}</p>
                    </td>
                    <td class="p-3 font-mono text-right text-sm ${sottoSoglia ? 'text-rose-400 font-bold' : 'text-sky-400 font-semibold'}">${(item.qta || 0).toFixed(2)} kg</td>
                    <td class="p-3 font-mono text-right text-slate-400">${(item.min || 0).toFixed(1)} kg</td>
                    <td class="p-3 font-mono text-right text-emerald-400 font-medium">€ ${(item.prezzo || 0).toFixed(2)}</td>
                    
                    <td class="p-3 text-center">
                        <div class="flex items-center justify-center gap-1 max-w-[120px] mx-auto">
                            <input type="number" id="rapido-${item.id}" placeholder="± Kg" class="w-14 bg-slate-950 border border-slate-700 rounded px-1.5 py-1 text-center text-xs text-white focus:outline-none focus:border-indigo-500">
                            <button onclick="aggiornaGiacenzaRapida(${item.id})" class="bg-slate-800 hover:bg-slate-700 text-slate-200 p-1 rounded transition cursor-pointer">
                                <i class="fa-solid fa-square-plus text-sm"></i>
                            </button>
                        </div>
                    </td>
                    
                    <td class="p-3 text-center">
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
    }

    setTimeout(inizializzaMagazzino, 400);
})();

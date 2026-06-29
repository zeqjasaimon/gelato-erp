import { doc, getDoc, setDoc } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

(function() {
    // Recuperiamo l'istanza del database Cloud passata da app.js
    const db = window.fbDb;
    const auth = window.fbAuth;

    let idArticoloInModifica = null;

    // Funzione interna per verificare che l'utente sia effettivamente loggato su Firebase
    function getUidUtente() {
        if (auth && auth.currentUser) {
            return auth.currentUser.uid;
        }
        return null;
    }

    // INIZIALIZZA IL MAGAZZINO CLOUD
    async function inizializzaMagazzino() {
        idArticoloInModifica = null;
        const uid = getUidUtente();
        
        if (!uid) {
            console.error("Nessun utente loggato su Firebase.");
            return;
        }

        // Reset visivo del form
        const form = document.getElementById('form-aggiungi-mp');
        if (form) form.reset();
        
        const btnSalva = document.querySelector('#form-aggiungi-mp button[type="submit"]');
        if (btnSalva) btnSalva.innerText = "💾 Inserisci in Magazzino";

        // Scarica i dati dal Cloud e renderizza la tabella
        await renderTabellaMagazzino();
    }

    // FUNZIONE PER SCARICARE L'ARRAY DI ARTICOLI DA FIREBASE
    async function ottieniArticoliCloud(uid) {
        try {
            const docRef = doc(db, "magazzini", uid);
            const docSnap = await getDoc(docRef);
            if (docSnap.exists()) {
                return docSnap.data().articoli || [];
            }
        } catch (error) {
            console.error("Errore nel recupero dei dati dal Cloud:", error);
        }
        return [];
    }

    // FUNZIONE PER SALVARE L'ARRAY DI ARTICOLI SU FIREBASE
    async function salvaArticoliCloud(uid, articoli) {
        try {
            const docRef = doc(db, "magazzini", uid);
            await setDoc(docRef, { articoli: articoli });
        } catch (error) {
            console.error("Errore nel salvataggio dei dati sul Cloud:", error);
            alert("⚠️ Errore di connessione al Cloud. Riprova.");
        }
    }

    // GESTIONE INSERIMENTO O MODIFICA ARTICOLO CLOUD
    const formMp = document.getElementById('form-aggiungi-mp');
    if (formMp) {
        const nuovoForm = formMp.cloneNode(true);
        formMp.parentNode.replaceChild(nuovoForm, formMp);

        nuovoForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            const uid = getUidUtente();
            if (!uid) return;

            // Mappatura corretta degli ID reali presenti nel form HTML della pagina
            const nome = document.getElementById('mp-nome').value.trim();
            const cat = document.getElementById('mp-categoria').value;
            
            // Fix ID: Prova prima mp-quantita o mp-qta se modificato, altrimenti 0
            const inputQta = document.getElementById('mp-quantita') || document.getElementById('mp-qta');
            const qta = inputQta ? (parseFloat(inputQta.value) || 0) : 0;
            
            // Fix ID: Prova prima mp-scorta o mp-min se modificato, altrimenti 0
            const inputMin = document.getElementById('mp-scorta') || document.getElementById('mp-min');
            const min = inputMin ? (parseFloat(inputMin.value) || 0) : 0;
            
            const prezzo = parseFloat(document.getElementById('mp-prezzo').value) || 0;

            let inventario = await ottieniArticoliCloud(uid);

            if (idArticoloInModifica !== null) {
                // MODALITÀ AGGIORNAMENTO SU CLOUD
                let indice = inventario.findIndex(item => item.id === idArticoloInModifica);
                if (indice !== -1) {
                    inventario[indice].nome = nome;
                    inventario[indice].cat = cat;
                    inventario[indice].qta = qta;
                    inventario[indice].min = min;
                    inventario[indice].prezzo = prezzo;
                    alert(`🎉 Ingrediente "${nome}" aggiornato sul Cloud!`);
                }
            } else {
                // MODALITÀ NUOVO ARTICOLO SU CLOUD
                if (inventario.some(i => i.nome.toLowerCase() === nome.toLowerCase())) {
                    alert("⚠️ Un ingrediente con questo nome è già presente in magazzino.");
                    return;
                }

                inventario.push({
                    id: Date.now(),
                    nome: nome,
                    cat: cat,
                    qta: qta,
                    min: min,
                    prezzo: prezzo
                });
                alert(`🎉 Nuovo ingrediente "${nome}" salvato sul Cloud!`);
            }

            await salvaArticoliCloud(uid, inventario);
            inizializzaMagazzino();
        });
    }

    // CARICA L'ARTICOLO NEL FORM IN ALTO PER LA MODIFICA
    window.avviaModificaArticolo = async function(id) {
        const uid = getUidUtente();
        if (!uid) return;

        let inventario = await ottieniArticoliCloud(uid);
        const articolo = inventario.find(i => i.id === id);
        if (!articolo) return;

        idArticoloInModifica = id;

        document.getElementById('mp-nome').value = articolo.nome;
        document.getElementById('mp-categoria').value = articolo.cat || 'Base Liquida';
        
        const inputQta = document.getElementById('mp-quantita') || document.getElementById('mp-qta');
        if (inputQta) inputQta.value = articolo.qta;
        
        const inputMin = document.getElementById('mp-scorta') || document.getElementById('mp-min');
        if (inputMin) inputMin.value = articolo.min;
        
        document.getElementById('mp-prezzo').value = articolo.prezzo;

        const btnSalva = document.querySelector('#form-aggiungi-mp button[type="submit"]');
        if (btnSalva) btnSalva.innerText = "🔄 Aggiorna Articolo";

        document.getElementById('mp-nome').focus();
    };

    // MOVIMENTO RAPIDO DI CARICO/SCARICO SUL CLOUD
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

    // ELIMINA ARTICOLO DAL CLOUD
    window.eliminaArticoloMagazzino = async function(id, nome) {
        const uid = getUidUtente();
        if (!uid) return;

        if (!confirm(`Sei sicuro di voler eliminare "${nome}" dal magazzino Cloud?`)) return;
        
        let inventario = await ottieniArticoliCloud(uid);
        inventario = inventario.filter(i => i.id !== id);
        
        await salvaArticoliCloud(uid, inventario);
        inizializzaMagazzino();
    };

    // RENDERING DELLA TABELLA CON I DATI IN TEMPO REALE
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

    // Eseguiamo il boot iniziale aspettando una frazione di secondo che Firebase dichiari l'utente loggato
    setTimeout(inizializzaMagazzino, 400);
})();

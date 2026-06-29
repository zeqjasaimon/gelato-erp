(function() {
    // Recupero chiavi in base all'utente loggato
    const emailUtente = localStorage.getItem('current_user_email') || 'admin@gelateria.com';
    const KEY_INVENTARIO = `mp_inventario_${emailUtente}`;

    let idArticoloInModifica = null; // Traccia se stiamo modificando un ingrediente esistente

    function caricaDati(chiave) {
        return JSON.parse(localStorage.getItem(chiave));
    }

    function salvaDati(chiave, dati) {
        localStorage.setItem(chiave, JSON.stringify(dati));
    }

    // INIZIALIZZA IL MAGAZZINO
    function inizializzaMagazzino() {
        idArticoloInModifica = null;
        
        // Se il magazzino dell'utente è vuoto, carica il pacchetto base impostato dalla Console Master
        if (!localStorage.getItem(KEY_INVENTARIO)) {
            const masterDefaults = JSON.parse(localStorage.getItem('master_default_ingredienti')) || [];
            salvaDati(KEY_INVENTARIO, masterDefaults);
        }

        // Reset del form e del testo del bottone
        const form = document.getElementById('form-aggiungi-mp');
        if (form) form.reset();
        
        const btnSalva = document.querySelector('#form-aggiungi-mp button[type="submit"]');
        if (btnSalva) btnSalva.innerText = "💾 Inserisci in Magazzino";

        renderTabellaMagazzino();
    }

    // GESTIONE INSERIMENTO O MODIFICA ARTICOLO
    const formMp = document.getElementById('form-aggiungi-mp');
    if (formMp) {
        // Rimuove vecchi listener per evitare doppi inserimenti
        const nuovoForm = formMp.cloneNode(true);
        formMp.parentNode.replaceChild(nuovoForm, formMp);

        nuovoForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            const nome = document.getElementById('mp-nome').value.trim();
            const cat = document.getElementById('mp-categoria').value;
            const qta = parseFloat(document.getElementById('mp-qta').value) || 0;
            const min = parseFloat(document.getElementById('mp-min').value) || 0;
            const prezzo = parseFloat(document.getElementById('mp-prezzo').value) || 0;

            let inventario = caricaDati(KEY_INVENTARIO) || [];

            if (idArticoloInModifica !== null) {
                // MODALITÀ AGGIORNAMENTO
                let indice = inventario.findIndex(item => item.id === idArticoloInModifica);
                if (indice !== -1) {
                    inventario[indice].nome = nome;
                    inventario[indice].cat = cat;
                    inventario[indice].qta = qta;
                    inventario[indice].min = min;
                    inventario[indice].prezzo = prezzo;
                    alert(`🎉 Ingrediente "${nome}" aggiornato con successo!`);
                }
            } else {
                // MODALITÀ NUOVO ARTICOLO
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
                alert(`🎉 Nuovo ingrediente "${nome}" inserito nel magazzino!`);
            }

            salvaDati(KEY_INVENTARIO, inventario);
            inizializzaMagazzino();
        });
    }

    // CARICA L'ARTICOLO NEL FORM IN ALTO PER LA MODIFICA
    window.avviaModificaArticolo = function(id) {
        let inventario = caricaDati(KEY_INVENTARIO) || [];
        const articolo = inventario.find(i => i.id === id);
        if (!articolo) return;

        idArticoloInModifica = id;

        // Popola i campi del form con i dati attuali
        document.getElementById('mp-nome').value = articolo.nome;
        document.getElementById('mp-categoria').value = articolo.cat || 'Base Liquida';
        document.getElementById('mp-qta').value = articolo.qta;
        document.getElementById('mp-min').value = articolo.min;
        document.getElementById('mp-prezzo').value = articolo.prezzo;

        // Cambia il testo del pulsante per indicare la modifica
        const btnSalva = document.querySelector('#form-aggiungi-mp button[type="submit"]');
        if (btnSalva) btnSalva.innerText = "🔄 Aggiorna Articolo";

        // Sposta il focus sul primo campo per comodità
        document.getElementById('mp-nome').focus();
    };

    // FUNZIONE RAPIDA PER FARE SOLO IL CARICO/SCARICO DI KG (VELOCE)
    window.aggiornaGiacenzaRapida = function(id) {
        const input = document.getElementById(`rapido-${id}`);
        const valore = parseFloat(input.value) || 0;
        if (valore === 0) return;

        let inventario = caricaDati(KEY_INVENTARIO) || [];
        let articolo = inventario.find(i => i.id === id);
        
        if (articolo) {
            articolo.qta += valore;
            if (articolo.qta < 0) articolo.qta = 0; // Impedisce scorte negative accidentali da questa interfaccia
            salvaDati(KEY_INVENTARIO, inventario);
            renderTabellaMagazzino();
            input.value = "";
            alert(`⚙️ Giacenza aggiornata per ${articolo.nome}.`);
        }
    };

    // ELIMINA ARTICOLO
    window.eliminaArticoloMagazzino = function(id, nome) {
        if (!confirm(`Sei sicuro di voler eliminare "${nome}" dal magazzino?`)) return;
        
        let inventario = caricaDati(KEY_INVENTARIO) || [];
        inventario = inventario.filter(i => i.id !== id);
        salvaDati(KEY_INVENTARIO, inventario);
        inizializzaMagazzino();
    };

    // RENDERING DELLA TABELLA A SCHERMO
    function renderTabellaMagazzino() {
        const inventario = caricaDati(KEY_INVENTARIO) || [];
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
            const badgeSottoSoglia = sottoSoglia ? `<span class="ml-2 text-[9px] font-bold bg-rose-500/20 text-rose-400 border border-rose-500/30 px-1.5 py-0.5 rounded uppercase animate-pulse">Scorta Minima</span>` : '';

            tbody.innerHTML += `
                <tr class="text-slate-300 border-b border-slate-800/60 text-xs ${rigaAllarmeClass}">
                    <td class="p-3">
                        <span class="font-bold text-white text-sm">${item.nome}</span> ${badgeSottoSoglia}
                        <p class="text-[10px] text-slate-500 mt-0.5 uppercase tracking-wider font-semibold">${item.cat || 'Generico'}</p>
                    </td>
                    <td class="p-3 font-mono text-right text-sm ${sottoSoglia ? 'text-rose-400 font-bold' : 'text-sky-400 font-semibold'}">${(item.qta || 0).toFixed(2)} kg</td>
                    <td class="p-3 font-mono text-right text-slate-400">${(item.min || 0).toFixed(1)} kg</td>
                    <td class="p-3 font-mono text-right text-emerald-400 font-medium">€ ${(item.prezzo || 0).toFixed(2)}</td>
                    
                    <!-- AGGIORNAMENTO RAPIDO QUANTITÀ -->
                    <td class="p-3 text-center">
                        <div class="flex items-center justify-center gap-1 max-w-[120px] mx-auto">
                            <input type="number" id="rapido-${item.id}" placeholder="± Kg" class="w-14 bg-slate-950 border border-slate-800 rounded px-1.5 py-1 text-center text-xs text-white focus:outline-none focus:border-sky-500">
                            <button onclick="aggiornaGiacenzaRapida(${item.id})" class="bg-slate-800 hover:bg-slate-700 text-slate-200 p-1 rounded transition cursor-pointer" title="Applica movimento rapido">
                                <i class="fa-solid fa-square-plus text-sm"></i>
                            </button>
                        </div>
                    </td>
                    
                    <!-- AZIONI: MODIFICA ED ELIMINAZIONE -->
                    <td class="p-3 text-center">
                        <div class="flex items-center justify-center gap-2">
                            <button onclick="avviaModificaArticolo(${item.id})" class="text-slate-400 hover:text-sky-400 p-1.5 transition cursor-pointer" title="Modifica Anagrafica/Prezzo">
                                <i class="fa-solid fa-pen-to-square text-sm"></i>
                            </button>
                            <button onclick="eliminaArticoloMagazzino(${item.id}, '${item.nome}')" class="text-slate-500 hover:text-rose-400 p-1.5 transition cursor-pointer" title="Elimina">
                                <i class="fa-regular fa-trash-can text-sm"></i>
                            </button>
                        </div>
                    </td>
                </tr>
            `;
        });
    }

    inizializzaMagazzino();
})();

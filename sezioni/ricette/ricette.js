(function() {
    // Recupero chiavi in base all'utente loggato
    const emailUtente = JSON.parse(localStorage.getItem('erp_utenti'))?.find(u => u.email === localStorage.getItem('current_user_email'))?.email || '';
    const KEY_INVENTARIO = emailUtente ? `mp_inventario_${emailUtente}` : 'mp_inventario';
    const KEY_RICETTE = emailUtente ? `ricette_${emailUtente}` : 'ricette_gelato';

    let ingredientiSelezionati = [];

    // RICETTA DI DEFAULT BLINDATA (Miscela Base Pastorizzata)
    const ID_RICETTA_PASTORIZZATA = 999999; // ID fisso univoco per riconoscerla
    const ricettaPastorizzataDefault = {
        id: ID_RICETTA_PASTORIZZATA,
        nome: "Miscela Base Pastorizzata",
        tipo: "Semilavorato",
        blindata: true, // Flag per impedire l'eliminazione
        pesoTotale: 1.000,
        ingredienti: [
            { nome: "Latte Intero Alta Qualità", quantita: 0.700, prezzo: 1.10 },
            { nome: "Zucchero Saccarosio", quantita: 0.150, prezzo: 1.40 },
            { nome: "Panna Fresca 35%", quantita: 0.150, prezzo: 4.80 }
        ]
    };

    function caricaDati(chiave, defaultData) {
        return JSON.parse(localStorage.getItem(chiave)) || defaultData;
    }

    function salvaDati(chiave, dati) {
        localStorage.setItem(chiave, JSON.stringify(dati));
    }

    // INIZIALIZZA LA SCHERMATA E GARANTISCE LA RICETTA DI DEFAULT
    function inizializzaRicettario() {
        ingredientiSelezionati = [];
        
        // Verifica e inserisce la ricetta fissa se non esiste
        let ricette = caricaDati(KEY_RICETTE, []);
        let esistePastorizzata = ricette.some(r => r.id === ID_RICETTA_PASTORIZZATA || r.nome.toLowerCase().trim() === "miscela base pastorizzata");
        
        if (!esistePastorizzata) {
            ricette.unshift(ricettaPastorizzataDefault); // La mette in cima
            salvaDati(KEY_RICETTE, ricette);
        }

        aggiornaTabellaIngredientiNuovaRicetta();
        popolaSelettoreMateriePrime();
        renderListaRicette();
    }

    // POPOLA IL MENU A TENDINA CON GLI INGREDIENTI
    function popolaSelettoreMateriePrime() {
        const inventario = caricaDati(KEY_INVENTARIO, []);
        const selettore = document.getElementById('seleziona-materia-prima');
        if (!selettore) return;

        selettore.innerHTML = '<option value="">-- Seleziona Ingrediente --</option>';
        inventario.forEach(item => {
            selettore.innerHTML += `<option value="${item.nome}">🍦 ${item.nome} (€ ${item.prezzo.toFixed(2)}/kg)</option>`;
        });
    }

    // AGGIUNGE UN INGREDIENTE ALLA RICETTA IN CORSO
    window.aggiungiIngredienteARicetta = function() {
        const nome = document.getElementById('seleziona-materia-prima').value;
        const quantita = parseFloat(document.getElementById('quantita-materia-prima').value) || 0;

        if (!nome || quantita <= 0) {
            alert("⚠️ Seleziona un ingrediente valido e inserisci la quantità in kg.");
            return;
        }

        const inventario = caricaDati(KEY_INVENTARIO, []);
        const infoMateria = inventario.find(i => i.nome === nome);
        const prezzoAlKg = infoMateria ? infoMateria.prezzo : 0;

        const esistente = ingredientiSelezionati.find(i => i.nome === nome);
        if (esistente) {
            esistente.quantita += quantita;
        } else {
            ingredientiSelezionati.push({ nome, quantita, prezzo: prezzoAlKg });
        }

        document.getElementById('quantita-materia-prima').value = "";
        aggiornaTabellaIngredientiNuovaRicetta();
    };

    window.rimuoviIngredienteDaNuovaRicetta = function(index) {
        ingredientiSelezionati.splice(index, 1);
        aggiornaTabellaIngredientiNuovaRicetta();
    };

    function aggiornaTabellaIngredientiNuovaRicetta() {
        const tbody = document.getElementById('tabella-ingredienti-nuova-ricetta');
        if (!tbody) return;

        tbody.innerHTML = "";
        let pesoTotale = 0;
        let costoTotale = 0;

        ingredientiSelezionati.forEach((ing, index) => {
            const costoIngrediente = ing.quantita * ing.prezzo;
            pesoTotale += ing.quantita;
            costoTotale += costoIngrediente;

            tbody.innerHTML += `
                <tr class="text-xs text-slate-300">
                    <td class="p-2 font-semibold text-white">${ing.nome}</td>
                    <td class="p-2 font-mono text-right">${ing.quantita.toFixed(3)} kg</td>
                    <td class="p-2 font-mono text-right">€ ${ing.prezzo.toFixed(2)}</td>
                    <td class="p-2 font-mono text-right text-emerald-400">€ ${costoIngrediente.toFixed(2)}</td>
                    <td class="p-2 text-center">
                        <button onclick="rimuoviIngredienteDaNuovaRicetta(${index})" class="text-rose-400 hover:text-rose-500 transition cursor-pointer">
                            <i class="fa-solid fa-xmark"></i>
                        </button>
                    </td>
                </tr>
            `;
        });

        const costoAlKg = pesoTotale > 0 ? (costoTotale / pesoTotale) : 0;
        const elemPeso = document.getElementById('anteprima-peso-totale');
        const elemCosto = document.getElementById('anteprima-costo-kg');
        if(elemPeso) elemPeso.innerText = `${pesoTotale.toFixed(3)} kg`;
        if(elemCosto) elemCosto.innerText = `€ ${costoAlKg.toFixed(2)} / kg`;
    }

    window.salvaRicettaCompleta = function(e) {
        if(e) e.preventDefault();
        
        const nomeRicetta = document.getElementById('nome-ricetta').value.trim();
        const tipoRicetta = document.getElementById('tipo-ricetta').value;

        if (!nomeRicetta || ingredientiSelezionati.length === 0) {
            alert("⚠️ Assegna un nome alla ricetta e inserisci almeno un ingrediente.");
            return;
        }

        let ricette = caricaDati(KEY_RICETTE, []);
        
        let pesoTotale = 0;
        let costoTotale = 0;
        ingredientiSelezionati.forEach(ing => {
            pesoTotale += ing.quantita;
            costoTotale += (ing.quantita * ing.prezzo);
        });

        ricette.push({
            id: Date.now(),
            nome: nomeRicetta,
            tipo: tipoRicetta,
            blindata: false,
            ingredienti: ingredientiSelezionati,
            pesoTotale: pesoTotale,
            costoTeoricoKg: costoTotale / pesoTotale
        });

        salvaDati(KEY_RICETTE, ricette);
        document.getElementById('form-crea-ricetta').reset();
        inizializzaRicettario();
        alert(`🎉 Ricetta "${nomeRicetta}" salvata correttamente!`);
    };

    // ELIMINA RICETTA CON BLOCCO PER QUELLA PREIMPOSTATA
    window.eliminaRicetta = function(id, blindata) {
        if (blindata || id === ID_RICETTA_PASTORIZZATA) {
            alert("🔒 Questa è una ricetta di sistema predefinita (Semilavorato Base). Non può essere eliminata.");
            return;
        }
        
        if (!confirm("Sei sicuro di voler eliminare questa ricetta?")) return;
        let ricette = caricaDati(KEY_RICETTE, []);
        ricette = ricette.filter(r => r.id !== id);
        salvaDati(KEY_RICETTE, ricette);
        inizializzaRicettario();
    };

    // RENDERING LISTA RICETTE
    function renderListaRicette() {
        const ricette = caricaDati(KEY_RICETTE, []);
        const inventario = caricaDati(KEY_INVENTARIO, []);
        const contenitore = document.getElementById('elenco-ricette-salvate');
        if (!contenitore) return;

        contenitore.innerHTML = "";

        ricette.forEach(ricetta => {
            let costoTotaleAggiornato = 0;
            let dettagliIngredientiHtml = "";

            ricetta.ingredienti.forEach(ing => {
                const matMagazzino = inventario.find(i => i.nome.toLowerCase().trim() === ing.nome.toLowerCase().trim());
                const prezzoAttuale = matMagazzino ? matMagazzino.prezzo : ing.prezzo;
                costoTotaleAggiornato += ing.quantita * prezzoAttuale;

                dettagliIngredientiHtml += `
                    <div class="flex justify-between text-xs text-slate-400 border-b border-slate-800/40 py-1">
                        <span>• ${ing.nome}</span>
                        <span class="font-mono">${ing.quantita.toFixed(3)} kg</span>
                    </div>
                `;
            });

            const costoAlKgAttuale = costoTotaleAggiornato / (ricetta.pesoTotale || 1);
            const badgeColore = ricetta.tipo === 'Semilavorato' ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' : 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20';
            
            // Gestione icona cestino o lucchetto
            const èBlindata = ricetta.blindata === true || ricetta.id === ID_RICETTA_PASTORIZZATA;
            const bottoneElimina = èBlindata 
                ? `<span class="text-slate-600 p-1 cursor-not-allowed" title="Ricetta fissa di sistema"><i class="fa-solid fa-lock text-sm text-amber-500/70"></i></span>`
                : `<button onclick="eliminaRicetta(${ricetta.id}, false)" class="text-slate-500 hover:text-rose-400 p-1 transition cursor-pointer"><i class="fa-regular fa-trash-can"></i></button>`;

            contenitore.innerHTML += `
                <div class="bg-slate-900 border ${èBlindata ? 'border-amber-500/30 bg-gradient-to-b from-slate-900 to-amber-950/10' : 'border-slate-800'} rounded-xl p-4 space-y-3 shadow-md">
                    <div class="flex justify-between items-start">
                        <div>
                            <h4 class="font-bold text-white text-base">${ricetta.nome}</h4>
                            <span class="inline-block border text-[9px] font-bold px-2 py-0.5 rounded-full mt-1 uppercase ${badgeColore}">
                                ${ricetta.tipo || 'Gusto'}
                            </span>
                        </div>
                        ${bottoneElimina}
                    </div>

                    <div class="bg-slate-950/40 p-3 rounded-lg border border-slate-800/60 space-y-1">
                        <p class="text-[10px] uppercase font-bold tracking-wider text-slate-500">Struttura Ricetta (Rapporto su 1kg)</p>
                        ${dettagliIngredientiHtml}
                    </div>

                    <div class="grid grid-cols-2 gap-2 pt-1 text-center">
                        <div class="bg-slate-950/60 p-2 rounded-lg border border-slate-800">
                            <p class="text-[9px] text-slate-500 uppercase font-bold">Peso Base</p>
                            <p class="text-sm font-semibold text-sky-400 font-mono">${ricetta.pesoTotale.toFixed(3)} kg</p>
                        </div>
                        <div class="bg-slate-950/60 p-2 rounded-lg border border-slate-800">
                            <p class="text-[9px] text-slate-500 uppercase font-bold">Costo al Kg</p>
                            <p class="text-sm font-bold text-emerald-400 font-mono">€ ${costoAlKgAttuale.toFixed(2)}</p>
                        </div>
                    </div>
                </div>
            `;
        });
    }

    inizializzaRicettario();
})();

(function() {
    // 1. CHIAVI DI ACCESSO
    const emailUtente = localStorage.getItem('current_user_email') || 'admin@gelateria.com';
    const KEY_INVENTARIO = `mp_inventario_${emailUtente}`;
    const KEY_RICETTE = `ricette_${emailUtente}`;

    let ingredientiSelezionati = [];
    const ID_RICETTA_PASTORIZZATA = 999999;

    // Struttura fissa intoccabile della pastorizzata base
    const ricettaPastorizzataDefault = {
        id: ID_RICETTA_PASTORIZZATA,
        nome: "Miscela Base Pastorizzata",
        tipo: "Semilavorato",
        blindata: true,
        pesoTotale: 1.000,
        ingredienti: [
            { nome: "Latte Intero Alta Qualità", quantita: 0.700, prezzo: 1.10 },
            { nome: "Zucchero Saccarosio", quantita: 0.150, prezzo: 1.40 },
            { nome: "Panna Fresca 35%", quantita: 0.150, prezzo: 4.80 }
        ]
    };

    function caricaDati(chiave) {
        return JSON.parse(localStorage.getItem(chiave)) || [];
    }

    function salvaDati(chiave, dati) {
        localStorage.setItem(chiave, JSON.stringify(dati));
    }

    // 2. AVVIO DELLA SEZIONE
    function inizializzaRicettario() {
        ingredientiSelezionati = [];
        
        let ricette = caricaDati(KEY_RICETTE);
        
        // CONTROLLO FORZATO AD OGNI APERTURA DI SCHEDA
        let esiste = ricette.some(r => r.id === ID_RICETTA_PASTORIZZATA || r.nome.toLowerCase().trim() === "miscela base pastorizzata");
        if (!esiste) {
            ricette.unshift(ricettaPastorizzataDefault);
            salvaDati(KEY_RICETTE, ricette);
        }

        aggiornaTabellaIngredientiNuovaRicetta();
        popolaSelettoreMateriePrime();
        renderListaRicette();
    }

    // 3. SELETTORE DELLE MATERIE PRIME
    function popolaSelettoreMateriePrime() {
        // Se non trova l'inventario personalizzato, prova a prendere quello master di default
        let inventario = JSON.parse(localStorage.getItem(KEY_INVENTARIO)) || JSON.parse(localStorage.getItem('master_default_ingredienti')) || [];
        const selettore = document.getElementById('seleziona-materia-prima');
        if (!selettore) return;

        selettore.innerHTML = '<option value="">-- Seleziona Ingrediente --</option>';
        inventario.forEach(item => {
            selettore.innerHTML += `<option value="${item.nome}">🍦 ${item.nome} (€ ${(item.prezzo || 0).toFixed(2)}/kg)</option>`;
        });
    }

    // 4. LOGICA AGGIUNTA INGREDIENTI
    window.aggiungiIngredienteARicetta = function() {
        const nome = document.getElementById('seleziona-materia-prima').value;
        const quantita = parseFloat(document.getElementById('quantita-materia-prima').value) || 0;

        if (!nome || quantita <= 0) {
            alert("⚠️ Seleziona un ingrediente valido e inserisci la quantità in kg.");
            return;
        }

        let inventario = JSON.parse(localStorage.getItem(KEY_INVENTARIO)) || JSON.parse(localStorage.getItem('master_default_ingredienti')) || [];
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

    // 5. SALVATAGGIO
    window.salvaRicettaCompleta = function(e) {
        if(e) e.preventDefault();
        
        const nomeRicetta = document.getElementById('nome-ricetta').value.trim();
        const tipoRicetta = document.getElementById('tipo-ricetta').value;

        if (!nomeRicetta || ingredientiSelezionati.length === 0) {
            alert("⚠️ Assegna un nome alla ricetta e inserisci almeno un ingrediente.");
            return;
        }

        let ricette = caricaDati(KEY_RICETTE);
        
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

    window.eliminaRicetta = function(id, blindata) {
        if (blindata || id === ID_RICETTA_PASTORIZZATA) {
            alert("🔒 Questa è una ricetta fissa di sistema. Non può essere rimossa.");
            return;
        }
        
        if (!confirm("Sei sicuro di voler eliminare questa ricetta?")) return;
        let ricette = caricaDati(KEY_RICETTE);
        ricette = ricette.filter(r => r.id !== id);
        salvaDati(KEY_RICETTE, ricette);
        inizializzaRicettario();
    };

    // 6. RENDER DEI BOX RICETTA A SCHERMO
    function renderListaRicette() {
        let ricette = caricaDati(KEY_RICETTE);
        let inventario = JSON.parse(localStorage.getItem(KEY_INVENTARIO)) || JSON.parse(localStorage.getItem('master_default_ingredienti')) || [];
        const contenitore = document.getElementById('elenco-ricette-salvate');
        if (!contenitore) return;

        contenitore.innerHTML = "";

        // Forza la presenza della pastorizzata nell'array da mostrare a video
        if (!ricette.some(r => r.id === ID_RICETTA_PASTORIZZATA)) {
            ricette.unshift(ricettaPastorizzataDefault);
        }

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
            
            const èBlindata = ricetta.blindata === true || ricetta.id === ID_RICETTA_PASTORIZZATA;
            const bottoneElimina = èBlindata 
                ? `<span class="text-slate-600 p-1"><i class="fa-solid fa-lock text-sm text-amber-500/70"></i></span>`
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

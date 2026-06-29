(function() {
    // Carica i dati centrali dal LocalStorage dell'utente corrente
    const emailUtente = JSON.parse(localStorage.getItem('erp_utenti'))?.find(u => u.email === localStorage.getItem('current_user_email'))?.email || '';
    const KEY_INVENTARIO = emailUtente ? `mp_inventario_${emailUtente}` : 'mp_inventario';
    const KEY_RICETTE = emailUtente ? `ricette_${emailUtente}` : 'ricette_gelato';
    const KEY_PRODUZIONE = emailUtente ? `registro_produzione_${emailUtente}` : 'registro_produzione';

    function caricaDati(chiave, defaultData) {
        return JSON.parse(localStorage.getItem(chiave)) || defaultData;
    }

    function salvaDati(chiave, dati) {
        localStorage.setItem(chiave, JSON.stringify(dati));
    }

    // Inizializza la pagina di produzione
    function inizializzaProduzione() {
        const ricette = caricaDati(KEY_RICETTE, []);
        const selettore = document.getElementById('seleziona-ricetta-produzione');
        if (!selettore) return;

        selettore.innerHTML = '<option value="">-- Scegli cosa produrre --</option>';
        ricette.forEach(r => {
            selettore.innerHTML += `<option value="${r.id}">${r.nome} (${r.tipo || 'Gusto'})</option>`;
        });

        renderRegistroProduzione();
    }

    // MOSTRA I DETTAGLI DELLA RICETTA SELEZIONATA (Anteprima Ingredienti necessari)
    window.aggiornaAnteprimaProduzione = function() {
        const idRicetta = parseInt(document.getElementById('seleziona-ricetta-produzione').value);
        const kgDaProdurre = parseFloat(document.getElementById('kg-da-produrre').value) || 0;
        const boxAnteprima = document.getElementById('box-anteprime-ingredienti');
        
        if (!idRicetta || kgDaProdurre <= 0) {
            if(boxAnteprima) boxAnteprima.innerHTML = `<p class="text-slate-500 italic text-sm">Seleziona una ricetta e inserisci i kg per vedere il fabbisogno delle materie prime.</p>`;
            return;
        }

        const ricette = caricaDati(KEY_RICETTE, []);
        const inventario = caricaDati(KEY_INVENTARIO, []);
        const ricetta = ricette.find(r => r.id === idRicetta);

        if (!ricetta) return;

        let html = `<div class="space-y-2">`;
        let fattore = kgDaProdurre / (ricetta.pesoTotale || 1); // Ricalcola in base ai kg scelti rispetto al peso totale della ricetta

        ricetta.ingredienti.forEach(ing => {
            const qtaNecessaria = ing.quantita * fattore;
            const invMateria = inventario.find(i => i.nome.toLowerCase().trim() === ing.nome.toLowerCase().trim());
            const qtaDisponibile = invMateria ? invMateria.qta : 0;
            const sufficiente = qtaDisponibile >= qtaNecessaria;

            html += `
                <div class="flex justify-between items-center bg-slate-950/40 p-2.5 rounded-lg border border-slate-800 text-xs">
                    <div>
                        <span class="font-semibold text-white">${ing.nome}</span>
                        <p class="text-[10px] text-slate-400">Richiesti: ${qtaNecessaria.toFixed(3)} kg | In magazzino: ${qtaDisponibile.toFixed(2)} kg</p>
                    </div>
                    <span class="${sufficiente ? 'text-emerald-400 font-bold' : 'text-rose-400 font-bold animate-pulse'}">
                        ${sufficiente ? '✓ Disponibile' : '⚠️ Scorte Insufficienti'}
                    </span>
                </div>
            `;
        });

        html += `</div>`;
        if(boxAnteprima) boxAnteprima.innerHTML = html;
    };

    // AVVIA IL CICLO DI PRODUZIONE REALE
    window.avviaProduzioneLotto = function() {
        const idRicetta = parseInt(document.getElementById('seleziona-ricetta-produzione').value);
        const kgDaProdurre = parseFloat(document.getElementById('kg-da-produrre').value) || 0;

        if (!idRicetta || kgDaProdurre <= 0) {
            alert("⚠️ Seleziona una ricetta valida e inserisci i kg da produrre.");
            return;
        }

        let ricette = caricaDati(KEY_RICETTE, []);
        let inventario = caricaDati(KEY_INVENTARIO, []);
        let registro = caricaDati(KEY_PRODUZIONE, []);

        const ricetta = ricette.find(r => r.id === idRicetta);
        if (!ricetta) return;

        let fattore = kgDaProdurre / (ricetta.pesoTotale || 1);
        let erroreScorte = false;

        // 1. Controllo preventivo della disponibilità di tutti gli ingredienti
        ricetta.ingredienti.forEach(ing => {
            const qtaNecessaria = ing.quantita * fattore;
            const invMateria = inventario.find(i => i.nome.toLowerCase().trim() === ing.nome.toLowerCase().trim());
            if (!invMateria || invMateria.qta < qtaNecessaria) {
                erroreScorte = true;
            }
        });

        if (erroreScorte) {
            if (!confirm("⚠️ Attenzione: Alcuni ingredienti non hanno scorte sufficienti in magazzino. Vuoi forzare la produzione lo stesso mandando le scorte in negativo?")) {
                return;
            }
        }

        // 2. SCALA LE MATERIE PRIME ED ELABORA IL COSTO REALE
        let costoTotaleLotto = 0;

        ricetta.ingredienti.forEach(ing => {
            const qtaNecessaria = ing.quantita * fattore;
            const invMateria = inventario.find(i => i.nome.toLowerCase().trim() === ing.nome.toLowerCase().trim());
            
            if (invMateria) {
                // Calcola il costo basandosi sul prezzo della materia prima salvata nel magazzino
                costoTotaleLotto += qtaNecessaria * (invMateria.prezzo || 0);
                invMateria.qta -= qtaNecessaria; // Sottrae dal magazzino
            }
        });

        const costoAlKgLotto = costoTotaleLotto / kgDaProdurre;

        // 3. SE È UN SEMILAVORATO (es. Miscela Base Pastorizzata): AGGIORNA IL MAGAZZINO CON IL PREZZO REALE CALCOLATO
        let notaSemilavorato = "";
        // Cerchiamo se nel magazzino esiste un ingrediente con lo stesso esatto nome della ricetta prodotta
        let semilavoratoInMagazzino = inventario.find(i => i.nome.toLowerCase().trim() === ricetta.nome.toLowerCase().trim());

        if (semilavoratoInMagazzino) {
            // Aggiorna la quantità aggiungendo quella appena prodotta
            const vecchiaQta = semilavoratoInMagazzino.qta || 0;
            const vecchioPrezzo = semilavoratoInMagazzino.prezzo || 0;
            const nuovaQta = vecchiaQta + kgDaProdurre;
            
            // Calcola il prezzo medio ponderato se c'erano già giacenze, altrimenti assegna il costo attuale
            let prezzoAggiornato = costoAlKgLotto;
            if (vecchiaQta > 0) {
                prezzoAggiornato = ((vecchiaQta * vecchioPrezzo) + (kgDaProdurre * costoAlKgLotto)) / nuovaQta;
            }

            semilavoratoInMagazzino.qta = nuovaQta;
            semilavoratoInMagazzino.prezzo = prezzoAggiornato;
            
            notaSemilavorato = ` ✨ Caricati +${kgDaProdurre.toFixed(2)}kg in Magazzino come Semilavorato al costo calcolato di € ${costoAlKgLotto.toFixed(2)}/kg`;
        }

        // Salva l'inventario aggiornato (materie prime scalate + eventuale semilavorato aggiunto)
        salvaDati(KEY_INVENTARIO, inventario);

        // 4. REGISTRA IL LOTTO NEL REGISTRO DI PRODUZIONE
        const nuovoLotto = {
            id: Date.now(),
            data: new Date().toLocaleString('it-IT'),
            ricetta: ricetta.nome,
            tipo: ricetta.tipo || 'Gusto',
            quantita: kgDaProdurre,
            costoKg: costoAlKgLotto,
            costoTotale: costoTotaleLotto
        };

        registro.unshift(nuovoLotto); // Aggiunge in cima alla lista
        salvaDati(KEY_PRODUZIONE, registro);

        alert(`🎉 Lotto prodotto con successo!${notaSemilavorato}\nCosto totale lotto: € ${costoTotaleLotto.toFixed(2)} (€ ${costoAlKgLotto.toFixed(2)}/kg)`);
        
        // Reset form e aggiorna tabelle
        document.getElementById('kg-da-prodbanco')?.reset();
        document.getElementById('kg-da-produrre').value = "10";
        inizializzaProduzione();
        window.aggiornaAnteprimaProduzione();
    };

    // RENDERIZZA LA TABELLA DELLO STORICO DEI LOTTI PRODOTTI
    function renderRegistroProduzione() {
        const registro = caricaDati(KEY_PRODUZIONE, []);
        const tbody = document.getElementById('tabella-registro-produzione');
        if (!tbody) return;

        tbody.innerHTML = "";

        if (registro.length === 0) {
            tbody.innerHTML = `<tr><td colspan="5" class="p-4 text-center text-slate-500 italic">Nessun lotto prodotto in questo laboratorio.</td></tr>`;
            return;
        }

        registro.forEach(lotto => {
            const coloreTipo = lotto.tipo === 'Semilavorato' ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' : 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20';
            tbody.innerHTML += `
                <tr class="hover:bg-slate-800/20 text-slate-300">
                    <td class="p-3 text-xs text-slate-400 font-mono">${lotto.data}</td>
                    <td class="p-3">
                        <span class="font-semibold text-white">${lotto.ricetta}</span>
                        <span class="ml-2 border text-[10px] px-1.5 py-0.5 rounded-full uppercase ${coloreTipo}">${lotto.tipo}</span>
                    </td>
                    <td class="p-3 text-right font-semibold text-sky-400">${lotto.quantita.toFixed(1)} kg</td>
                    <td class="p-3 text-right font-mono text-emerald-400">€ ${lotto.costoKg.toFixed(2)}</td>
                    <td class="p-3 text-right font-mono font-bold text-white">€ ${lotto.costoTotale.toFixed(2)}</td>
                </tr>
            `;
        });
    }

    // Avvia all'apertura del modulo
    inizializzaProduzione();
})();

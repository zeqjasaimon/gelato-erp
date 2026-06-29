(function() {
    function renderConsoleDefaults() {
        const defaultIngredienti = JSON.parse(localStorage.getItem('master_default_ingredienti')) || [];
        const tbody = document.getElementById('tabella-console-default');
        if(tbody) {
            tbody.innerHTML = "";
            defaultIngredienti.forEach((ing, index) => {
                tbody.innerHTML += `
                    <tr class="hover:bg-slate-800/20 text-slate-300">
                        <td class="p-3 font-semibold text-white">${ing.nome}</td>
                        <td class="p-3"><span class="bg-slate-800 text-slate-400 text-xs px-2 py-0.5 rounded">${ing.cat}</span></td>
                        <td class="p-3 text-right font-mono">${ing.qta} kg</td>
                        <td class="p-3 text-right font-mono">€ ${ing.prezzo.toFixed(2)}</td>
                        <td class="p-3 text-center">
                            <button onclick="rimuoviMateriaDefault(${index})" class="text-slate-500 hover:text-rose-400 p-1 cursor-pointer transition">
                                <i class="fa-regular fa-trash-can"></i>
                            </button>
                        </td>
                    </tr>
                `;
            });
        }
    }

    // FUNZIONE PER CARICARE GLI UTENTI DA ACCETTARE
    function renderRichiesteUtenti() {
        const utenti = JSON.parse(localStorage.getItem('erp_utenti')) || [];
        const tbody = document.getElementById('tabella-richieste-approvazione');
        if(!tbody) return;

        tbody.innerHTML = "";
        
        // Filtra solo quelli non approvati
        const inAttesa = utenti.filter(u => u.approvato === false);

        if(inAttesa.length === 0) {
            tbody.innerHTML = `<tr><td colspan="5" class="p-4 text-center text-slate-500 italic">Nessuna richiesta di registrazione in attesa.</td></tr>`;
            return;
        }

        inAttesa.forEach((u) => {
            tbody.innerHTML += `
                <tr class="hover:bg-slate-800/20">
                    <td class="p-3 font-medium text-white">${u.nome}</td>
                    <td class="p-3 text-indigo-300 font-semibold">${u.gelateria}</td>
                    <td class="p-3 text-xs text-slate-400">${u.indirizzo || 'Non specificato'}</td>
                    <td class="p-3 font-mono text-xs">${u.email}</td>
                    <td class="p-3 text-center">
                        <button onclick="accettaCliente('${u.email}')" class="bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs px-3 py-1 rounded transition cursor-pointer">
                            Approva e Attiva
                        </button>
                    </td>
                </tr>
            `;
        });
    }

    // ACCETTAZIONE CLIENTE + FUNZIONE COPIA INVENTARIO BASE + EMAIL 3
    window.accettaCliente = function(emailUtente) {
        let utenti = JSON.parse(localStorage.getItem('erp_utenti')) || [];
        const utenteIndex = utenti.findIndex(u => u.email === emailUtente);

        if(utenteIndex !== -1) {
            utenti[utenteIndex].approvato = true;
            localStorage.setItem('erp_utenti', JSON.stringify(utenti));

            // Clona il magazzino base impostato dall'admin all'account del cliente approvato
            const defaultIngredienti = JSON.parse(localStorage.getItem('master_default_ingredienti'));
            localStorage.setItem(`mp_inventario_${emailUtente}`, JSON.stringify(defaultIngredienti));

            alert("⚡ Utente approvato e magazzino iniziale configurato!");
            renderRichiesteUtenti();

            // EMAIL 3: Parte nel momento in cui Saimon accetta il cliente
            if(window.simulaInvioEmail) {
                window.simulaInvioEmail(
                    "📧 Email inviata a: " + emailUtente,
                    "Grandiosi aggiornamenti! <strong>Saimon Admin</strong> ha approvato il tuo account.<br>Da questo momento puoi accedere a GelatoERP Pro usando la tua password e iniziare a calcolare i tuoi lotti di produzione!"
                );
            }
        }
    };

    window.aggiungiMateriaDefault = function() {
        const nome = prompt("Nome dell'ingrediente iniziale:");
        if (!nome) return;
        const cat = prompt("Categoria:") || "Varie";
        const qta = parseFloat(prompt("Quantità in kg:")) || 0;
        const min = parseFloat(prompt("Soglia di allarme (kg):")) || 0;
        const prezzo = parseFloat(prompt("Prezzo standard al kg (€):")) || 0;

        let defaultIngredienti = JSON.parse(localStorage.getItem('master_default_ingredienti')) || [];
        defaultIngredienti.push({ id: Date.now(), nome, cat, qta, min, prezzo });
        localStorage.setItem('master_default_ingredienti', JSON.stringify(defaultIngredienti));
        
        renderConsoleDefaults();
    };

    window.rimuoviMateriaDefault = function(index) {
        if(!confirm("Rimuovere dal pacchetto base?")) return;
        let defaultIngredienti = JSON.parse(localStorage.getItem('master_default_ingredienti')) || [];
        defaultIngredienti.splice(index, 1);
        localStorage.setItem('master_default_ingredienti', JSON.stringify(defaultIngredienti));
        renderConsoleDefaults();
    };

    renderConsoleDefaults();
    renderRichiesteUtenti();
})();

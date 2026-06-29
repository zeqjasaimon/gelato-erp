(function() {
    if(!localStorage.getItem('registro_lotti')) {
        localStorage.setItem('registro_lotti', JSON.stringify([]));
    }

    function initProduzione() {
        const ricette = JSON.parse(localStorage.getItem('ricettario')) || [];
        const select = document.getElementById('prod-ricetta-select');
        if(!select) return;

        select.innerHTML = "";
        ricette.forEach(r => {
            select.innerHTML += `<option value="${r.id}">${r.nome}</option>`;
        });

        renderLotti();
    }

    function renderLotti() {
        const lotti = JSON.parse(localStorage.getItem('registro_lotti')) || [];
        const container = document.getElementById('lista-lotti');
        if(!container) return;

        if(lotti.length === 0) {
            container.innerHTML = `<p class="text-xs text-slate-500 italic">Nessuna produzione registrata oggi.</p>`;
            return;
        }

        container.innerHTML = "";
        lotti.reverse().forEach(l => {
            container.innerHTML += `
                <div class="bg-slate-900/60 border border-slate-800 p-3 rounded-lg flex justify-between items-center text-sm">
                    <div>
                        <div class="flex items-center gap-2">
                            <span class="font-bold text-white">${l.ricettaNome}</span>
                            <span class="text-[10px] bg-indigo-950 text-indigo-400 px-1.5 py-0.5 rounded font-mono font-bold">${l.codiceLotto}</span>
                        </div>
                        <p class="text-xs text-slate-400 mt-1">Data: ${l.data} | Peso totale: <span class="font-mono text-slate-300 font-medium">${l.pesoTotale} Kg</span></p>
                    </div>
                    <span class="text-xs text-emerald-400 bg-emerald-950/40 border border-emerald-900/40 px-2 py-1 rounded font-medium">✨ Concluso</span>
                </div>
            `;
        });
    }

    window.eseguiProduzione = function() {
        const ricette = JSON.parse(localStorage.getItem('ricettario')) || [];
        const merci = JSON.parse(localStorage.getItem('mp_inventario')) || [];
        
        const idRicetta = parseInt(document.getElementById('prod-ricetta-select').value);
        const kgDesiderati = parseFloat(document.getElementById('prod-moltiplicatore').value) || 1;
        
        const ricetta = ricette.find(r => r.id === idRicetta);
        if(!ricetta) return;

        // Formula semplice: le nostre ricette base sono impostate matematicamente su 1000g (1kg) totali.
        // Quindi scaliamo direttamente in base ai chili impostati.
        
        let controlloMagazzinoOK = true;
        
        // Verifica preliminare se c'è abbastanza merce
        ricetta.ingredienti.forEach(ing => {
            const pesoNecessarioKg = (ing.peso / 1000) * kgDesiderati;
            const itemMagazzino = merci.find(m => m.nome.toLowerCase().includes(ing.nome.toLowerCase()) || ing.nome.toLowerCase().includes(m.nome.toLowerCase()));
            
            if(!itemMagazzino || itemMagazzino.qta < pesoNecessarioKg) {
                controlloMagazzinoOK = false;
                alert(`Impossibile produrre: Componente [${ing.nome}] insufficiente in magazzino.`);
            }
        });

        if(!controlloMagazzinoOK) return;

        // Se il controllo passa, esegui lo scarico effettivo
        ricetta.ingredienti.forEach(ing => {
            const pesoNecessarioKg = (ing.peso / 1000) * kgDesiderati;
            const itemMagazzino = merci.find(m => m.nome.toLowerCase().includes(ing.nome.toLowerCase()) || ing.nome.toLowerCase().includes(m.nome.toLowerCase()));
            if(itemMagazzino) {
                itemMagazzino.qta = Math.max(0, itemMagazzino.qta - pesoNecessarioKg);
            }
        });

        // Salva lo stato scaricato del magazzino
        localStorage.setItem('mp_inventario', JSON.stringify(merci));

        // Genera il codice di tracciabilità del lotto
        const ora = new Date();
        const codiceLotto = "LT-" + ora.getFullYear() + String(ora.getMonth()+1).padStart(2,'0') + String(ora.getDate()).padStart(2,'0') + "-" + Math.floor(100 + Math.random() * 900);

        // Salva nel registro lotti
        const lotti = JSON.parse(localStorage.getItem('registro_lotti')) || [];
        lotti.push({
            ricettaNome: ricetta.nome,
            codiceLotto: codiceLotto,
            pesoTotale: kgDesiderati,
            data: ora.toLocaleString('it-IT')
        });
        localStorage.setItem('registro_lotti', JSON.stringify(lotti));

        alert(`Produzione completata con successo!\nGenerato Lotto unico ministeriale: ${codiceLotto}\nLe materie prime sono state detratte.`);
        initProduzione();
    };

    initProduzione();
})();

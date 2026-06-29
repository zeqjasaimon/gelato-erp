(function() {
    // Carichiamo o creiamo i dati in LocalStorage per preservarli al refresh
    if(!localStorage.getItem('mp_inventario')) {
        const mockup = [
            { id: 1, nome: "Latte Intero Alta Qualità", cat: "Base Liquida", qta: 120, min: 50, prezzo: 1.10 },
            { id: 2, nome: "Zucchero Saccarosio", cat: "Zuccheri", qta: 85, min: 30, prezzo: 1.40 },
            { id: 3, nome: "Panna Fresca 35%", cat: "Grassi", qta: 15, min: 25, prezzo: 4.80 },
            { id: 4, nome: "Pasta Pistacchio Bronte DOP", cat: "Caratterizzanti", qta: 8, min: 5, prezzo: 42.00 }
        ];
        localStorage.setItem('mp_inventario', JSON.stringify(mockup));
    }

    function renderMagazzino() {
        const merci = JSON.parse(localStorage.getItem('mp_inventario'));
        const tbody = document.getElementById('tabella-magazzino');
        if(!tbody) return;
        
        tbody.innerHTML = "";
        let sottoScortaContatore = 0;
        let valoreTotale = 0;

        merci.forEach(m => {
            const isSotto = m.qta <= m.min;
            if(isSotto) sottoScortaContatore++;
            valoreTotale += (m.qta * m.prezzo);

            tbody.innerHTML += `
                <tr class="hover:bg-slate-800/20 transition">
                    <td class="p-4 font-medium text-white">${m.nome}</td>
                    <td class="p-4 text-slate-400"><span class="bg-slate-800 text-slate-300 px-2 py-0.5 rounded text-xs">${m.cat}</span></td>
                    <td class="p-4 text-right font-mono ${isSotto ? 'text-amber-400 font-bold':''}">${m.qta} kg</td>
                    <td class="p-4 text-right font-mono">€ ${m.prezzo.toFixed(2)}</td>
                    <td class="p-4 text-center">
                        <span class="px-2 py-0.5 text-xs rounded-full font-medium ${isSotto ? 'bg-red-950 text-red-400 border border-red-900':'bg-emerald-950 text-emerald-400 border border-emerald-900'}">
                            ${isSotto ? 'Sotto Scorta':'Disponibile'}
                        </span>
                    </td>
                    <td class="p-4 text-center">
                        <button onclick="rimuoviMerce(${m.id})" class="text-slate-500 hover:text-red-400 px-1 py-0.5 rounded transition"><i class="fa-regular fa-trash-can"></i></button>
                    </td>
                </tr>
            `;
        });

        document.getElementById('tot-ingredienti').innerText = merci.length;
        document.getElementById('tot-sottoscorta').innerText = sottoScortaContatore;
        document.getElementById('valore-magazzino').innerText = `€ ${valoreTotale.toFixed(2)}`;
    }

    window.rimuoviMerce = function(id) {
        let merci = JSON.parse(localStorage.getItem('mp_inventario'));
        merci = merci.filter(x => x.id !== id);
        localStorage.setItem('mp_inventario', JSON.stringify(merci));
        renderMagazzino();
    };

    window.apriModalMateria = function() {
        // Funzione semplificata tramite prompt nativo per brevità del codice
        const nome = prompt("Nome ingrediente:");
        if(!nome) return;
        const cat = prompt("Categoria (es. Zuccheri, Grassi, Basi):") || "Varie";
        const qta = parseFloat(prompt("Quantità iniziale in Kg:")) || 0;
        const min = parseFloat(prompt("Soglia minima di allarme in Kg:")) || 0;
        const prezzo = parseFloat(prompt("Prezzo d'acquisto al Kg (€):")) || 0;

        let merci = JSON.parse(localStorage.getItem('mp_inventario'));
        merci.push({ id: Date.now(), nome, cat, qta, min, prezzo });
        localStorage.setItem('mp_inventario', JSON.stringify(merci));
        renderMagazzino();
    };

    renderMagazzino();
})();

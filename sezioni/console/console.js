(function() {
    function renderConsoleDefaults() {
        const defaultIngredienti = JSON.parse(localStorage.getItem('master_default_ingredienti')) || [];
        const tbody = document.getElementById('tabella-console-default');
        if(!tbody) return;

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

    window.aggiungiMateriaDefault = function() {
        const nome = prompt("Nome dell'ingrediente iniziale di default:");
        if (!nome) return;
        const cat = prompt("Categoria dell'ingrediente (es. Grassi, Zuccheri, Frutta):") || "Varie";
        const qta = parseFloat(prompt("Quantità iniziale precaricata (in kg):")) || 0;
        const min = parseFloat(prompt("Soglia di allarme di default (in kg):")) || 0;
        const prezzo = parseFloat(prompt("Prezzo standard stimato al kg (€):")) || 0;

        let defaultIngredienti = JSON.parse(localStorage.getItem('master_default_ingredienti')) || [];
        defaultIngredienti.push({ id: Date.now(), nome, cat, qta, min, prezzo });
        localStorage.setItem('master_default_ingredienti', JSON.stringify(defaultIngredienti));
        
        renderConsoleDefaults();
    };

    window.rimuoviMateriaDefault = function(index) {
        if(!confirm("Vuoi escludere questo ingrediente dal pacchetto di registrazione iniziale dei prossimi utenti?")) return;
        let defaultIngredienti = JSON.parse(localStorage.getItem('master_default_ingredienti')) || [];
        defaultIngredienti.splice(index, 1);
        localStorage.setItem('master_default_ingredienti', JSON.stringify(defaultIngredienti));
        
        renderConsoleDefaults();
    };

    renderConsoleDefaults();
})();

(function() {
    if(!localStorage.getItem('ricettario')) {
        const mockupRicette = [
            {
                id: 101,
                nome: "Miscela Base Fiordilatte",
                parametri: { pod: "17%", pac: "28%", grassi: "8.5%", solidi: "38.2%" },
                ingredienti: [
                    { nome: "Latte Intero", peso: 650 },
                    { nome: "Panna 35%", peso: 150 },
                    { nome: "Zucchero Saccarosio", peso: 140 },
                    { nome: "Latte in polvere magro", peso: 55 },
                    { nome: "Neutro 5", peso: 5 }
                ]
            },
            {
                id: 102,
                nome: "Sorbetto Limone Strutturato",
                parametri: { pod: "0%", pac: "31%", grassi: "0%", solidi: "31.5%" },
                ingredienti: [
                    { nome: "Acqua", peso: 480 },
                    { nome: "Succo di Limone", peso: 250 },
                    { nome: "Zucchero Saccarosio", peso: 180 },
                    { nome: "Destrosio", peso: 60 },
                    { nome: "Neutro Frutta", peso: 30 }
                ]
            }
        ];
        localStorage.setItem('ricettario', JSON.stringify(mockupRicette));
    }

    function renderRicette() {
        const ricette = JSON.parse(localStorage.getItem('ricettario'));
        const container = document.getElementById('griglia-ricette');
        if(!container) return;

        container.innerHTML = "";

        ricette.forEach(r => {
            let listaIngredientiHTML = "";
            r.ingredienti.forEach(i => {
                listaIngredientiHTML += `
                    <div class="flex justify-between text-xs text-slate-300 border-b border-slate-700/30 py-1">
                        <span>• ${i.nome}</span>
                        <span class="font-mono font-medium">${i.peso}g</span>
                    </div>
                `;
            });

            container.innerHTML += `
                <div class="bg-slate-800/40 border border-slate-700/60 rounded-xl p-5 shadow-lg flex flex-col justify-between">
                    <div>
                        <h3 class="text-base font-bold text-white mb-3 flex items-center gap-2">
                            <span class="text-amber-400">📊</span> ${r.nome}
                        </h3>
                        
                        <!-- Parametri Tecnici di Bilanciamento -->
                        <div class="grid grid-cols-4 gap-1 text-center bg-slate-900/60 p-2 rounded-lg mb-4 text-[10px] font-mono border border-slate-800">
                            <div><p class="text-slate-500 font-sans">GRASSI</p><p class="text-white font-bold">${r.parametri.grassi}</p></div>
                            <div><p class="text-slate-500 font-sans">POD</p><p class="text-pink-400 font-bold">${r.parametri.pod}</p></div>
                            <div><p class="text-slate-500 font-sans">PAC</p><p class="text-sky-400 font-bold">${r.parametri.pac}</p></div>
                            <div><p class="text-slate-500 font-sans">SOLIDI</p><p class="text-emerald-400 font-bold">${r.parametri.solidi}</p></div>
                        </div>

                        <p class="text-[11px] font-semibold uppercase tracking-wider text-slate-500 mb-1">Composizione (Su 1Kg totali)</p>
                        <div class="space-y-1 mb-6 max-h-40 overflow-y-auto pr-1">
                            ${listaIngredientiHTML}
                        </div>
                    </div>

                    <button onclick="eliminaRicetta(${r.id})" class="w-full text-center text-xs text-slate-500 hover:text-red-400 transition pt-2 border-t border-slate-700/50">
                        <i class="fa-regular fa-trash-can mr-1"></i> Elimina Formula
                    </button>
                </div>
            `;
        });
    }

    window.eliminaRicetta = function(id) {
        let ricette = JSON.parse(localStorage.getItem('ricettario'));
        ricette = ricette.filter(x => x.id !== id);
        localStorage.setItem('ricettario', JSON.stringify(ricette));
        renderRicette();
    };

    window.nuovaRicetta = function() {
        alert("Il motore di bilanciamento matematico avanzato è configurato sulla struttura dati locale. Nelle versioni avanzate caricheremo i form dinamici.");
    };

    renderRicette();
})();

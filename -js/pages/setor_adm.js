document.addEventListener('DOMContentLoaded', () => {
    
    const baseUrl = 'https://umvtsquzpugempndwitx.supabase.co/rest/v1';
    const apiKey = 'sb_publishable_58JIZcrwwFjp2gnEPPVZeg_tkrJ-LHb';
    const headersConfig = {
        'Content-Type': 'application/json',
        "apikey": apiKey,
        "Authorization": `Bearer ${apiKey}`,
        "Prefer": "return=representation"
    };

    const listaSetores = document.getElementById('listaSetores');
    const botaoNovoSetor = document.getElementById('botaoNovoSetor');
    const modalSetor = document.getElementById('modalSetor');
    const btnFechar = document.getElementById('fecharModal');
    const btnCancelar = document.getElementById('cancelarModal');
    const formNovoSetor = document.getElementById('formNovoSetor');

    async function carregarSetores() {
        try {
            const resposta = await fetch(`${baseUrl}/local?select=*`, {
                method: 'GET',
                headers: headersConfig
            });

            if (!resposta.ok) throw new Error("Erro ao buscar setores");

            const setores = await resposta.json();
            
            listaSetores.innerHTML = '';

            if (setores.length === 0) {
                listaSetores.innerHTML = '<p>Nenhum setor cadastrado ainda.</p>';
                return;
            }


            setores.forEach(setor => {
                const cardHtml = `
                    <article class="card-setor">
                      <div class="cabecalho-card-setor">
                        <div class="informacoes-setor">
                          <h2>${setor.setor}</h2>
                          <p class="responsavel-setor">
                            ID do Banco: <span>#${setor.id}</span>
                          </p>
                        </div>
                        <div class="icone-setor" aria-hidden="true">
                          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round">
                            <path d="M4 20V10l8-6 8 6v10"></path>
                            <path d="M9 20v-6h6v6"></path>
                            <path d="M8 10h.01"></path>
                            <path d="M12 10h.01"></path>
                            <path d="M16 10h.01"></path>
                          </svg>
                        </div>
                      </div>
                    </article>
                `;
                listaSetores.innerHTML += cardHtml;
            });

        } catch (erro) {
            console.error("Falha ao carregar setores:", erro);
        }
    }

    formNovoSetor.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const nomeDoSetor = document.getElementById('nomeSetor').value;

        try {
            const resposta = await fetch(`${baseUrl}/local`, {
                method: 'POST',
                headers: headersConfig,
                body: JSON.stringify({ setor: nomeDoSetor })
            });

            if (!resposta.ok) {
                throw new Error(await resposta.text());
            }

            alert("Setor cadastrado com sucesso!");
            formNovoSetor.reset();
            modalSetor.style.display = 'none';
            carregarSetores(); 

        } catch (erro) {
            console.error("Falha ao cadastrar:", erro);
            alert("Erro ao cadastrar. Verifique o console.");
        }
    });

    botaoNovoSetor.addEventListener('click', () => modalSetor.style.display = 'flex');
    btnFechar.addEventListener('click', () => modalSetor.style.display = 'none');
    btnCancelar.addEventListener('click', () => modalSetor.style.display = 'none');

    carregarSetores();
});
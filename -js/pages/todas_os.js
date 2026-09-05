document.addEventListener('DOMContentLoaded', () => {

    // ==========================================
    // CONFIGURAÇÕES DA API SUPABASE
    // ==========================================
    const baseUrl = 'https://umvtsquzpugempndwitx.supabase.co/rest/v1';
    const apiKey = 'sb_publishable_58JIZcrwwFjp2gnEPPVZeg_tkrJ-LHb'; 
    const headersConfig = {
        'Content-Type': 'application/json',
        "apikey": apiKey,
        "Authorization": `Bearer ${apiKey}`
    };

    // Elementos da Tela
    const corpoTabelaOrdens = document.getElementById('corpoTabelaOrdens');
    const inputPesquisa = document.getElementById('pesquisaOS');
    const inputData = document.getElementById('filtroData');
    const selectStatus = document.getElementById('filtroStatus');
    const selectTipo = document.getElementById('filtroTipo');
    const selectSetor = document.getElementById('filtroSetor');
    const spanQuantidade = document.getElementById('quantidadeRegistros');

    // Variável Global
    let todasAsOrdens = [];

    // ==============================================
    // 1. CARREGAR DADOS COM MULTI-JOIN
    // ==============================================
    async function carregarOrdensDeServico() {
        try {
            // A Query traz a OS e abre relacionamento com Equipamento, Local, Tipo, Usuário Solicitante e a Abertura.
            const query = `select=id,created_at,equipamento(asset,descricao,local(setor)),tipo_manutencao(descricao),usuario!fk_ordem_servico_id_usuario_solicitante(nome),abertura_ordem_servico(data_abertura,status_ordem_servico(descricao))&order=id.desc`;
            
            const resposta = await fetch(`${baseUrl}/ordem_servico?${query}`, {
                method: 'GET',
                headers: headersConfig
            });

            if (!resposta.ok) throw new Error("Erro ao buscar as Ordens de Serviço.");

            todasAsOrdens = await resposta.json();
            
            // Renderiza inicial
            aplicarFiltrosERenderizar();

        } catch (erro) {
            console.error("Falha ao carregar OS:", erro);
            corpoTabelaOrdens.innerHTML = `<tr><td colspan="8" style="text-align: center; color: red;">Erro ao carregar dados. Verifique a conexão com o banco.</td></tr>`;
        }
    }

    // ==============================================
    // 2. LÓGICA DE FILTRAGEM CRUZADA
    // ==============================================
    function aplicarFiltrosERenderizar() {
        const termo = inputPesquisa.value.toLowerCase();
        const dataSelecionada = inputData.value; // Formato YYYY-MM-DD
        const statusFiltro = selectStatus.value.toLowerCase();
        const tipoFiltro = selectTipo.value.toLowerCase();
        const setorFiltro = selectSetor.value.toLowerCase();

        const ordensFiltradas = todasAsOrdens.filter(os => {
            // Extração segura dos dados dos joins
            const numeroOS = String(os.id).padStart(6, '0');
            const asset = os.equipamento?.asset?.toLowerCase() || '';
            const equipDesc = os.equipamento?.descricao?.toLowerCase() || '';
            const nomeSetor = os.equipamento?.local?.setor?.toLowerCase() || '';
            const tipoDesc = os.tipo_manutencao?.descricao?.toLowerCase() || '';
            const solicitante = os.usuario?.nome?.toLowerCase() || '';
            
            // Tratar dados de abertura (como é 1 para N, o supabase retorna um array, pegamos a posição 0)
            const dadosAbertura = os.abertura_ordem_servico && os.abertura_ordem_servico.length > 0 ? os.abertura_ordem_servico[0] : null;
            const dataAberturaRaw = dadosAbertura?.data_abertura || os.created_at; // Fallback pra creation se não tiver data_abertura
            const dataAberturaISO = dataAberturaRaw.split('T')[0]; // Pega só YYYY-MM-DD
            
            let statusDesc = dadosAbertura?.status_ordem_servico?.descricao?.toLowerCase() || 'sem status';
            // Normalizar nomes compostos do status ("Em Andamento" -> "andamento")
            if(statusDesc.includes('andamento')) statusDesc = 'andamento';

            // Comparações dos Filtros
            const matchTermo = numeroOS.includes(termo) || asset.includes(termo) || equipDesc.includes(termo) || solicitante.includes(termo);
            const matchData = dataSelecionada === '' ? true : (dataAberturaISO === dataSelecionada);
            const matchStatus = (statusFiltro === 'todos' || statusFiltro === '') ? true : statusDesc.includes(statusFiltro);
            const matchTipo = (tipoFiltro === 'todos' || tipoFiltro === '') ? true : tipoDesc.includes(tipoFiltro);
            const matchSetor = (setorFiltro === 'todos' || setorFiltro === '') ? true : nomeSetor.includes(setorFiltro);

            return matchTermo && matchData && matchStatus && matchTipo && matchSetor;
        });

        renderizarTabela(ordensFiltradas);
    }

    // ==============================================
    // 3. RENDERIZAR RESULTADOS NO HTML
    // ==============================================
    function renderizarTabela(dados) {
        corpoTabelaOrdens.innerHTML = '';
        spanQuantidade.textContent = `${dados.length} registro(s)`;

        if (dados.length === 0) {
            corpoTabelaOrdens.innerHTML = `<tr><td colspan="8" style="text-align: center;">Nenhuma Ordem de Serviço encontrada com os filtros atuais.</td></tr>`;
            return;
        }

        dados.forEach(os => {
            const numeroFormatado = String(os.id).padStart(6, '0');
            const equipDesc = os.equipamento?.descricao || 'Equip. Desconhecido';
            const asset = os.equipamento?.asset || 'S/N';
            const setor = os.equipamento?.local?.setor || '-';
            const tipo = os.tipo_manutencao?.descricao || 'Outro';
            const solicitante = os.usuario?.nome || '-';
            
            const dadosAbertura = os.abertura_ordem_servico && os.abertura_ordem_servico.length > 0 ? os.abertura_ordem_servico[0] : null;
            const dataAberturaDate = new Date(dadosAbertura?.data_abertura || os.created_at);
            const dataFormatada = dataAberturaDate.toLocaleDateString('pt-BR');
            
            const statusLabel = dadosAbertura?.status_ordem_servico?.descricao || 'Nova';

            // Lógica para Classes de Tipo e Status baseadas nos termos
            let classeTipo = '';
            if(tipo.toLowerCase().includes('corretivo')) classeTipo = 'etiqueta-corretivo';
            else if(tipo.toLowerCase().includes('preventivo')) classeTipo = 'etiqueta-preventivo';
            else if(tipo.toLowerCase().includes('preditivo')) classeTipo = 'etiqueta-preditivo';

            let classeStatus = '';
            if(statusLabel.toLowerCase().includes('aberta')) classeStatus = 'status-aberta';
            else if(statusLabel.toLowerCase().includes('andamento')) classeStatus = 'status-andamento';
            else if(statusLabel.toLowerCase().includes('concluid') || statusLabel.toLowerCase().includes('encerrad')) classeStatus = 'status-encerrada';
            else if(statusLabel.toLowerCase().includes('cancelada')) classeStatus = 'status-cancelada';

            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td><a href="#" class="numero-os">#${numeroFormatado}</a></td>
                <td>
                    <div class="informacao-equipamento">
                    <span>${equipDesc}</span>
                    <small>${asset}</small>
                    </div>
                </td>
                <td>${setor}</td>
                <td><span class="etiqueta-os ${classeTipo}">${tipo}</span></td>
                <td>${solicitante}</td>
                <td>${dataFormatada}</td>
                <td><span class="status-os ${classeStatus}">${statusLabel}</span></td>
                <td>
                    <button class="botao-visualizar" type="button" aria-label="Visualizar ordem ${numeroFormatado}">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
                            <path d="M2 12s3.5-5 10-5 10 5 10 5-3.5 5-10 5-10-5-10-5Z"></path>
                            <circle cx="12" cy="12" r="2.5"></circle>
                        </svg>
                    </button>
                </td>
            `;
            corpoTabelaOrdens.appendChild(tr);
        });
    }

    // ==============================================
    // 4. EVENT LISTENERS DOS FILTROS
    // ==============================================
    inputPesquisa.addEventListener('input', aplicarFiltrosERenderizar);
    inputData.addEventListener('change', aplicarFiltrosERenderizar);
    selectStatus.addEventListener('change', aplicarFiltrosERenderizar);
    selectTipo.addEventListener('change', aplicarFiltrosERenderizar);
    selectSetor.addEventListener('change', aplicarFiltrosERenderizar);

    // Boot inicial
    carregarOrdensDeServico();
});
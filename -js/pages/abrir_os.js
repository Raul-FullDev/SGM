document.getElementById('formularioOrdemServico').addEventListener('submit', async function(event) {
    event.preventDefault();

    // 1. Capturando os valores do formulário HTML
    const idEquipamento = document.getElementById('equipamento').value;
    const tipoManutencao = document.getElementById('tipoManutencao').value;
    const descricaoProblema = document.getElementById('descricaoProblema').value;
    const prioridade = document.getElementById('prioridade').value; 
    const idTecnicoResponsavel = document.getElementById('tecnicoResponsavel').value; 

    // Dados fixos para teste inicial (depois você pega da sessão de login)
    const idUsuarioSolicitante = 1; // ID 1 = Admin Sistema (no seu banco)
    const idStatusAberta = 1;       // ID 1 = 'Aberta' (no seu banco)

    // ==========================================
    // CONFIGURAÇÕES DA API (PROJETO CORRETO)
    // ==========================================
    const baseUrl = 'https://umvtsquzpugempndwitx.supabase.co/rest/v1'; // URL Atualizada
    const apiKey = 'sb_publishable_58JIZcrwwFjp2gnEPPVZeg_tkrJ-LHb'; // <-- Substitua pela sua chave inteira

    const headersConfig = {
        'Content-Type': 'application/json',
        "apikey": apiKey,
        "Authorization": `Bearer ${apiKey}`,
        "Prefer": "return=representation" // Obriga o Supabase a devolver os dados inseridos
    };

    try {
        // ==========================================
        // TAREFA 1: INSERT na tabela ordem_servico
        // ==========================================
        const novaOrdemServico = {
            descricao_problema: descricaoProblema,
            prioridade: prioridade, 
            id_usuario_solicitante: idUsuarioSolicitante,
            id_tipo_manutencao: Number(tipoManutencao),
            id_equipamento: Number(idEquipamento)
        };

        const responseOs = await fetch(`${baseUrl}/ordem_servico`, {
            method: 'POST',
            headers: headersConfig,
            body: JSON.stringify(novaOrdemServico)
        });

        if (!responseOs.ok) throw new Error(await responseOs.text());
        
        const dadosOs = await responseOs.json();
        const idOsGerada = dadosOs[0].id; // Retendo o ID da OS gerada
        console.log("Passo 1 OK! OS gerada ID:", idOsGerada);

        // ==========================================
        // TAREFA 2: INSERT na tabela abertura_ordem_servico
        // ==========================================
        const novaAbertura = {
            id_ordem_servico: idOsGerada, // Usando o ID retido acima
            id_status: idStatusAberta,
            id_usuario_responsavel: Number(idTecnicoResponsavel),
            id_usuario_ultima_atualizacao: idUsuarioSolicitante
        };

        const responseAbertura = await fetch(`${baseUrl}/abertura_ordem_servico`, {
            method: 'POST',
            headers: headersConfig,
            body: JSON.stringify(novaAbertura)
        });

        if (!responseAbertura.ok) throw new Error(await responseAbertura.text());

        const dadosAbertura = await responseAbertura.json();
        const idAberturaGerada = dadosAbertura[0].id; // Retendo o ID da Abertura
        console.log("Passo 2 OK! Abertura gerada ID:", idAberturaGerada);

        // ==========================================
        // TAREFA 3: INSERT no historico_status_ordem_servico
        // ==========================================
        const novoHistorico = {
            id_abertura_ordem_servico: idAberturaGerada, // Usando o ID retido acima
            id_status_novo: idStatusAberta,
            id_usuario_responsavel: idUsuarioSolicitante,
            observacao: 'Ordem de serviço aberta manualmente.'
        };

        const responseHistorico = await fetch(`${baseUrl}/historico_status_ordem_servico`, {
            method: 'POST',
            headers: headersConfig,
            body: JSON.stringify(novoHistorico)
        });

        if (!responseHistorico.ok) throw new Error(await responseHistorico.text());

        console.log("Passo 3 OK! Histórico registrado.");

        // ==========================================
        // SUCESSO FINAL
        // ==========================================
        alert('Ordem de Serviço criada com sucesso!');
        window.location.href = 'todas_os.html'; // Redireciona para a listagem

    } catch (erro) {
        console.error('Erro na integração com Supabase:', erro);
        alert('Ocorreu um erro ao abrir a OS. Verifique o console.');
    }
});
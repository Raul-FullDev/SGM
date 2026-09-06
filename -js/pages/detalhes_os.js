document.addEventListener("DOMContentLoaded", () => {
  // ==========================================
  // CONFIGURAÇÕES DA API SUPABASE
  // ==========================================
  const baseUrl = "https://umvtsquzpugempndwitx.supabase.co/rest/v1";
  const apiKey = "sb_publishable_58JIZcrwwFjp2gnEPPVZeg_tkrJ-LHb";
  const headersConfig = {
    "Content-Type": "application/json",
    apikey: apiKey,
    Authorization: `Bearer ${apiKey}`,
    Prefer: "return=minimal",
  };

  // Referências dos elementos HTML
  const botoesStatus = document.querySelectorAll(".opcao-status");
  const btnCancelarOS = document.getElementById("cancelarOS");
  const btnFinalizarOS = document.getElementById("finalizarOS");
  const modalEncerrar = document.getElementById("modalEncerrarOS");
  const btnCancelarModal = document.getElementById("cancelarModal");
  const btnConfirmarEncerramento = document.getElementById(
    "confirmarEncerramento",
  );

  let idAberturaAtual = null;
  let idStatusAtual = null;
  let idUsuarioLogado = null;

  // Objeto para mapear os IDs reais que estão no seu banco
  const mapStatusIds = {
    aberta: null,
    andamento: null,
    cancelada: null,
    concluida: null,
  };

  // ==========================================
  // 1. CARREGAR DADOS DINÂMICOS
  // ==========================================
  async function inicializarOS() {
    try {
      // A. Pega a OS atual para teste
      const resOs = await fetch(
        `${baseUrl}/abertura_ordem_servico?select=id,id_status&order=id.desc&limit=1`,
        { headers: headersConfig },
      );
      const dadosOs = await resOs.json();
      if (dadosOs.length > 0) {
        idAberturaAtual = dadosOs[0].id;
        idStatusAtual = dadosOs[0].id_status;
      }

      // B. Pega um usuário válido para não dar erro de Chave Estrangeira (Erro 400)
      const resUser = await fetch(`${baseUrl}/usuario?select=id&limit=1`, {
        headers: headersConfig,
      });
      const dadosUser = await resUser.json();
      if (dadosUser.length > 0) idUsuarioLogado = dadosUser[0].id;

      // C. Pega os IDs reais da tabela de status dinamicamente (Erro 400)
      const resStatus = await fetch(
        `${baseUrl}/status_ordem_servico?select=id,descricao`,
        { headers: headersConfig },
      );
      const dadosStatus = await resStatus.json();

      dadosStatus.forEach((s) => {
        const desc = s.descricao.toLowerCase();
        if (desc.includes("aberta")) mapStatusIds["aberta"] = s.id;
        else if (desc.includes("andamento")) mapStatusIds["andamento"] = s.id;
        else if (desc.includes("concluid") || desc.includes("concluida"))
          mapStatusIds["concluida"] = s.id;
        else if (desc.includes("cancelada")) mapStatusIds["cancelada"] = s.id;
      });
    } catch (e) {
      console.error("Erro ao inicializar dados:", e);
    }
  }

  // ==========================================
  // 2. FUNÇÃO CENTRAL: ATUALIZAR STATUS E HISTÓRICO
  // ==========================================
  async function executarTrocaDeStatus(chaveStatus) {
    const novoStatusId = mapStatusIds[chaveStatus];

    if (!idAberturaAtual || !idUsuarioLogado || !novoStatusId) {
      alert(
        "Aguarde, o sistema ainda está carregando as informações do banco de dados...",
      );
      return;
    }

    if (novoStatusId === idStatusAtual) {
      alert("Esta OS já se encontra neste status.");
      return;
    }

    try {
      const payloadAbertura = {
        id_status: novoStatusId,
        id_usuario_ultima_atualizacao: idUsuarioLogado,
      };

      // Se finalizou, injeta o timestamp
      if (chaveStatus === "concluida") {
        payloadAbertura.data_fechamento = new Date().toISOString();
        payloadAbertura.id_usuario_conclusao = idUsuarioLogado;
      }

      // SUBTAREFA 1: UPDATE (PATCH)
      const resPatch = await fetch(
        `${baseUrl}/abertura_ordem_servico?id=eq.${idAberturaAtual}`,
        {
          method: "PATCH",
          headers: headersConfig,
          body: JSON.stringify(payloadAbertura),
        },
      );

      // Extração explícita de erros para depuração
      if (!resPatch.ok) {
        const erroInfo = await resPatch.json();
        throw new Error(
          `Erro Supabase (PATCH): ${erroInfo.message || JSON.stringify(erroInfo)}`,
        );
      }

      // SUBTAREFA 2: INSERT (POST)
      const resPost = await fetch(`${baseUrl}/historico_status_ordem_servico`, {
        method: "POST",
        headers: headersConfig,
        body: JSON.stringify({
          id_abertura_ordem_servico: idAberturaAtual,
          id_status_anterior: idStatusAtual,
          id_status_novo: novoStatusId,
          id_usuario_responsavel: idUsuarioLogado,
          observacao:
            "Status atualizado automaticamente via painel de detalhes.",
        }),
      });

      if (!resPost.ok) {
        const erroInfo = await resPost.json();
        throw new Error(
          `Erro Supabase (POST): ${erroInfo.message || JSON.stringify(erroInfo)}`,
        );
      }

      alert("Status atualizado com sucesso!");
      window.location.reload();
    } catch (erro) {
      console.error(erro);
      alert(erro.message); // Exibirá exatamente o que o banco recusou
    }
  }

  // ==========================================
  // 3. EVENT LISTENERS DA TELA
  // ==========================================

  botoesStatus.forEach((btn) => {
    btn.addEventListener("click", (e) => {
      const statusStr = e.target.getAttribute("data-status");
      if (statusStr) executarTrocaDeStatus(statusStr);
    });
  });

  if (btnCancelarOS) {
    btnCancelarOS.addEventListener("click", () => {
      if (
        confirm("ATENÇÃO: Tem certeza que deseja cancelar totalmente esta OS?")
      ) {
        executarTrocaDeStatus("cancelada");
      }
    });
  }

  if (btnFinalizarOS && modalEncerrar) {
    btnFinalizarOS.addEventListener(
      "click",
      () => (modalEncerrar.style.display = "flex"),
    );
    btnCancelarModal.addEventListener(
      "click",
      () => (modalEncerrar.style.display = "none"),
    );
    btnConfirmarEncerramento.addEventListener("click", () => {
      modalEncerrar.style.display = "none";
      executarTrocaDeStatus("concluida");
    });
  }

  inicializarOS();
});

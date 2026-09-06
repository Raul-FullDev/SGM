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
  };

  // Referências HTML
  const listaHistorico = document.getElementById("listaHistorico");
  const inputPesquisa = document.getElementById("pesquisaHistorico");
  const filtroTipo = document.getElementById("filtroTipoHistorico");
  const filtroStatus = document.getElementById("filtroStatusHistorico");

  // ==========================================
  // O SEGREDO DA SUBTAREFA: Ler ID na URL
  // ==========================================
  const urlParams = new URLSearchParams(window.location.search);
  const idEquipamentoFiltro = urlParams.get("equipamento");

  let dadosHistorico = [];

  // ==========================================
  // 1. BUSCAR HISTÓRICO COM JOIN
  // ==========================================
  async function carregarHistorico() {
    try {
      // Query combinando ordem_servico, abertura, tipo, equipamento e técnico
      let query = `select=id,equipamento(id,asset,descricao),tipo_manutencao(descricao),abertura_ordem_servico(data_abertura,data_fechamento,status_ordem_servico(descricao),usuario!fk_abertura_ordem_servico_id_usuario_responsavel(nome))&order=id.desc`;

      // FILTRO DE EQUIPAMENTO (Exigência do Jira)
      if (idEquipamentoFiltro) {
        query += `&id_equipamento=eq.${idEquipamentoFiltro}`;

        // Dá um feedback visual na tela de que está filtrado
        const subtitulo = document.querySelector(".cabecalho-pagina p");
        if (subtitulo)
          subtitulo.textContent = `Mostrando histórico apenas do equipamento selecionado.`;
      }

      const resposta = await fetch(`${baseUrl}/ordem_servico?${query}`, {
        method: "GET",
        headers: headersConfig,
      });

      if (!resposta.ok) throw new Error("Erro ao buscar histórico.");

      dadosHistorico = await resposta.json();
      aplicarFiltrosERenderizar();
    } catch (erro) {
      console.error("Falha ao carregar histórico:", erro);
      listaHistorico.innerHTML = `<tr><td colspan="8" style="text-align: center; color: red;">Erro ao carregar histórico do banco de dados.</td></tr>`;
    }
  }

  // ==========================================
  // 2. APLICAR FILTROS DA TELA EM TEMPO REAL
  // ==========================================
  function aplicarFiltrosERenderizar() {
    const termo = inputPesquisa ? inputPesquisa.value.toLowerCase() : "";
    const tipoSelecionado = filtroTipo
      ? filtroTipo.value.toLowerCase()
      : "todos";
    const statusSelecionado = filtroStatus
      ? filtroStatus.value.toLowerCase()
      : "todos";

    const filtrados = dadosHistorico.filter((os) => {
      const numeroOS = `OS-${new Date().getFullYear()}-${String(os.id).padStart(4, "0")}`;
      const equipDesc = os.equipamento?.descricao?.toLowerCase() || "";
      const asset = os.equipamento?.asset?.toLowerCase() || "";
      const tipo = os.tipo_manutencao?.descricao?.toLowerCase() || "";

      const abertura =
        os.abertura_ordem_servico && os.abertura_ordem_servico.length > 0
          ? os.abertura_ordem_servico[0]
          : null;
      const tecnico = abertura?.usuario?.nome?.toLowerCase() || "";
      const status =
        abertura?.status_ordem_servico?.descricao?.toLowerCase() || "";

      const matchPesquisa =
        numeroOS.toLowerCase().includes(termo) ||
        equipDesc.includes(termo) ||
        asset.includes(termo) ||
        tecnico.includes(termo);
      const matchTipo =
        tipoSelecionado === "todos" ? true : tipo.includes(tipoSelecionado);
      const matchStatus =
        statusSelecionado === "todos"
          ? true
          : status.includes(statusSelecionado);

      return matchPesquisa && matchTipo && matchStatus;
    });

    renderizarTabela(filtrados);
  }

  // ==========================================
  // 3. DESENHAR A TABELA NO HTML
  // ==========================================
  function renderizarTabela(dados) {
    listaHistorico.innerHTML = "";

    if (dados.length === 0) {
      listaHistorico.innerHTML = `<tr><td colspan="8" style="text-align: center;">Nenhum registro de manutenção encontrado.</td></tr>`;
      return;
    }

    dados.forEach((os) => {
      const numeroFormatado = `OS-${new Date().getFullYear()}-${String(os.id).padStart(4, "0")}`;
      const equipDesc = os.equipamento?.descricao || "-";
      const tipo = os.tipo_manutencao?.descricao || "-";

      const abertura =
        os.abertura_ordem_servico && os.abertura_ordem_servico.length > 0
          ? os.abertura_ordem_servico[0]
          : null;
      const tecnico = abertura?.usuario?.nome || "Não atribuído";

      const dataAberturaDate = abertura?.data_abertura
        ? new Date(abertura.data_abertura)
        : new Date();
      const dataFormatada = dataAberturaDate.toLocaleDateString("pt-BR");

      const statusLabel = abertura?.status_ordem_servico?.descricao || "Aberta";

      // Lógica de Cores do Status
      let classeStatus = "";
      if (
        statusLabel.toLowerCase().includes("conclu") ||
        statusLabel.toLowerCase().includes("encerrad")
      )
        classeStatus = "status-concluida";
      else if (statusLabel.toLowerCase().includes("andamento"))
        classeStatus = "status-andamento";
      else if (statusLabel.toLowerCase().includes("cancelada"))
        classeStatus = "status-cancelada";

      // Lógica de Cores do Tipo
      let classeTipo = "";
      if (tipo.toLowerCase().includes("preventiv"))
        classeTipo = "tipo-preventiva";
      else if (tipo.toLowerCase().includes("corretiv"))
        classeTipo = "tipo-corretiva";
      else if (tipo.toLowerCase().includes("preditiv"))
        classeTipo = "tipo-preditiva";

      // Cálculo da duração (se tiver data de fechamento, caso da subtarefa de Encerrar OS)
      let duracao = "-";
      if (abertura?.data_fechamento) {
        const diff =
          new Date(abertura.data_fechamento) - new Date(abertura.data_abertura);
        const horas = Math.floor(diff / (1000 * 60 * 60));
        duracao = horas > 0 ? `${horas}h` : "< 1h";
      }

      const tr = document.createElement("tr");
      tr.innerHTML = `
                <td class="os-historico">${numeroFormatado}</td>
                <td class="equipamento-historico">${equipDesc}</td>
                <td class="tipo-historico ${classeTipo}">${tipo}</td>
                <td class="tecnico-historico">${tecnico}</td>
                <td class="data-historico">${dataFormatada}</td>
                <td class="duracao-historico">${duracao}</td>
                <td class="status-historico ${classeStatus}">${statusLabel}</td>
                <td class="custo-historico">R$ 0,00</td>
            `;
      listaHistorico.appendChild(tr);
    });
  }

  // Escutadores de Eventos
  if (inputPesquisa)
    inputPesquisa.addEventListener("input", aplicarFiltrosERenderizar);
  if (filtroTipo)
    filtroTipo.addEventListener("change", aplicarFiltrosERenderizar);
  if (filtroStatus)
    filtroStatus.addEventListener("change", aplicarFiltrosERenderizar);

  // Dispara a requisição inicial
  carregarHistorico();
});

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
  const filtroData = document.getElementById("filtroDataHistorico");

  // Parâmetro da URL (se o usuário veio filtrando um equipamento)
  const urlParams = new URLSearchParams(window.location.search);
  const idEquipamentoFiltro = urlParams.get("equipamento");

  let dadosHistorico = [];

  // ==========================================
  // 1. BUSCAR HISTÓRICO NO BANCO
  // ==========================================
  async function carregarHistorico() {
    try {
      let query = `select=id,equipamento(id,asset,descricao),tipo_manutencao(descricao),abertura_ordem_servico(data_abertura,data_fechamento,status_ordem_servico(descricao),usuario!fk_abertura_ordem_servico_id_usuario_responsavel(nome))&order=id.desc`;

      if (idEquipamentoFiltro) {
        query += `&id_equipamento=eq.${idEquipamentoFiltro}`;
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
      if (listaHistorico)
        listaHistorico.innerHTML = `<tr><td colspan="8" style="text-align: center; color: red;">Erro ao carregar histórico.</td></tr>`;
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
    const dataSelecionada = filtroData ? filtroData.value : "todas";

    // Pega a data de Hoje à meia-noite (para fazer contas de dias perfeitas)
    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);

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
      const dataAberturaOriginal = abertura?.data_abertura
        ? new Date(abertura.data_abertura)
        : null;

      // Filtro 1: Texto (Pesquisa)
      const matchPesquisa =
        numeroOS.toLowerCase().includes(termo) ||
        equipDesc.includes(termo) ||
        asset.includes(termo) ||
        tecnico.includes(termo);

      // Filtro 2: Tipo (Correção do "a" vs "o". Comparamos só o comecinho da palavra)
      let matchTipo = true;
      if (tipoSelecionado !== "todos") {
        // Pega as 7 primeiras letras (ex: "prevent", "correti", "prediti") e ignora a última vogal
        const prefixoFiltro = tipoSelecionado.substring(0, 7);
        matchTipo = tipo.includes(prefixoFiltro);
      }

      // Filtro 3: Status
      const matchStatus =
        statusSelecionado === "todos"
          ? true
          : status.includes(statusSelecionado);

      // Filtro 4: Data (Correção do Fuso Horário)
      let matchData = true;
      if (dataSelecionada !== "todas" && dataAberturaOriginal) {
        // Ajusta a data que veio do banco para o nosso fuso e zera as horas
        const dataOSLocal = new Date(
          dataAberturaOriginal.getTime() +
            Math.abs(dataAberturaOriginal.getTimezoneOffset() * 60000),
        );
        dataOSLocal.setHours(0, 0, 0, 0);

        // Calcula a diferença exata de dias
        const diffTime = hoje.getTime() - dataOSLocal.getTime();
        const diffDias = Math.round(diffTime / (1000 * 60 * 60 * 24));

        if (dataSelecionada === "hoje") matchData = diffDias === 0;
        else if (dataSelecionada === "7dias")
          matchData = diffDias >= 0 && diffDias <= 7;
        else if (dataSelecionada === "30dias")
          matchData = diffDias >= 0 && diffDias <= 30;
        else if (dataSelecionada === "90dias")
          matchData = diffDias >= 0 && diffDias <= 90;
      }

      return matchPesquisa && matchTipo && matchStatus && matchData;
    });

    renderizarTabela(filtrados);
  }

  // ==========================================
  // 3. DESENHAR A TABELA NO HTML
  // ==========================================
  function renderizarTabela(dados) {
    if (!listaHistorico) return;
    listaHistorico.innerHTML = "";

    if (dados.length === 0) {
      listaHistorico.innerHTML = `<tr><td colspan="8" style="text-align: center; padding: 20px; color: #69809f;">Nenhum registro de manutenção encontrado.</td></tr>`;
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

      // Data corrigida para não dar dia errado por causa de fuso
      let dataFormatada = "-";
      if (abertura?.data_abertura) {
        const dt = new Date(abertura.data_abertura);
        const dtCorrigida = new Date(
          dt.getTime() + Math.abs(dt.getTimezoneOffset() * 60000),
        );
        dataFormatada = dtCorrigida.toLocaleDateString("pt-BR");
      }

      const statusLabel = abertura?.status_ordem_servico?.descricao || "Aberta";

      let classeStatus = "";
      const statusLower = statusLabel.toLowerCase();
      if (statusLower.includes("conclu") || statusLower.includes("encerrad"))
        classeStatus = "status-concluida";
      else if (statusLower.includes("andamento"))
        classeStatus = "status-andamento";
      else if (statusLower.includes("cancelada"))
        classeStatus = "status-cancelada";

      let classeTipo = "";
      const tipoLower = tipo.toLowerCase();
      if (tipoLower.includes("preventiv")) classeTipo = "tipo-preventiva";
      else if (tipoLower.includes("corretiv")) classeTipo = "tipo-corretiva";
      else if (tipoLower.includes("preditiv")) classeTipo = "tipo-preditiva";

      let duracao = "-";
      if (abertura?.data_fechamento && abertura?.data_abertura) {
        const horas = Math.floor(
          (new Date(abertura.data_fechamento) -
            new Date(abertura.data_abertura)) /
            (1000 * 60 * 60),
        );
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
  if (filtroData)
    filtroData.addEventListener("change", aplicarFiltrosERenderizar);

  // Iniciar
  carregarHistorico();
});

document.addEventListener("DOMContentLoaded", () => {
  const baseUrl = "https://umvtsquzpugempndwitx.supabase.co/rest/v1";
  const apiKey = "sb_publishable_58JIZcrwwFjp2gnEPPVZeg_tkrJ-LHb";
  const headersConfig = {
    "Content-Type": "application/json",
    apikey: apiKey,
    Authorization: `Bearer ${apiKey}`,
  };

  const sessaoStr = localStorage.getItem("sgm_sessao");
  if (!sessaoStr) return;

  const sessao = JSON.parse(sessaoStr);
  const papel = sessao.id_papel;
  const idUsuario = sessao.id;

  const btnNovaOS = document.getElementById("btnNovaOS");
  if (papel === 4 && btnNovaOS) {
    btnNovaOS.style.display = "none";
  }

  const corpoTabelaOrdens = document.getElementById("corpoTabelaOrdens");
  const inputPesquisa = document.getElementById("pesquisaOS");
  const inputDataCriacao = document.getElementById("filtroDataCriacao");
  const inputDataFim = document.getElementById("filtroDataFim");
  const selectStatus = document.getElementById("filtroStatus");
  const selectTipo = document.getElementById("filtroTipo");
  const selectSetor = document.getElementById("filtroSetor");
  const spanQuantidade = document.getElementById("quantidadeRegistros");

  let todasAsOrdens = [];

  async function carregarFiltros() {
    try {
      const resStatus = await fetch(
        `${baseUrl}/status_ordem_servico?select=id,descricao&is_active=eq.true`,
        { headers: headersConfig },
      );
      if (resStatus.ok) {
        const statusData = await resStatus.json();
        let statusHtml = '<option value="todos">Todos os status</option>';
        statusData.forEach((s) => {
          statusHtml += `<option value="${s.descricao.toLowerCase()}">${s.descricao}</option>`;
        });
        selectStatus.innerHTML = statusHtml;
      }

      const resTipos = await fetch(
        `${baseUrl}/tipo_manutencao?select=id,descricao&is_active=eq.true`,
        { headers: headersConfig },
      );
      if (resTipos.ok) {
        const tiposData = await resTipos.json();
        let tiposHtml = '<option value="todos">Todos os tipos</option>';
        tiposData.forEach((t) => {
          tiposHtml += `<option value="${t.descricao.toLowerCase()}">${t.descricao}</option>`;
        });
        selectTipo.innerHTML = tiposHtml;
      }
    } catch (erro) {
      console.error("Falha ao carregar opções de filtro do banco:", erro);
    }
  }

  async function carregarOrdensDeServico() {
    try {
      let query = `select=id,created_at,descricao_problema,prioridade,equipamento(id,asset,descricao,local(setor)),tipo_manutencao(descricao),usuario!fk_ordem_servico_id_usuario_solicitante(nome)&order=id.desc`;

      if (papel === 2) {
        query += `&id_usuario_solicitante=eq.${idUsuario}`;
      }

      const resposta = await fetch(`${baseUrl}/ordem_servico?${query}`, {
        method: "GET",
        headers: headersConfig,
      });

      if (!resposta.ok) throw new Error("Erro ao buscar as Ordens de Serviço.");
      todasAsOrdens = await resposta.json();

      try {
        const urlAbertura = new URL(`${baseUrl}/abertura_ordem_servico`);
        urlAbertura.searchParams.append(
          "select",
          "id,id_ordem_servico,data_abertura,data_fechamento,status_ordem_servico(descricao)",
        );

        const resAbertura = await fetch(urlAbertura, {
          method: "GET",
          headers: headersConfig,
        });

        if (resAbertura.ok) {
          const aberturas = await resAbertura.json();
          todasAsOrdens = todasAsOrdens.map((os) => {
            const abertaMatch = aberturas.filter(
              (a) => a.id_ordem_servico === os.id,
            );
            return { ...os, abertura_ordem_servico: abertaMatch };
          });
        }
      } catch (e) {
        console.warn("Abertura complementar ignorada:", e);
      }

      aplicarFiltrosERenderizar();
    } catch (erro) {
      console.error("Falha ao carregar OS:", erro);
      corpoTabelaOrdens.innerHTML = `<tr><td colspan="9" style="text-align: center; color: #8b9ab1; padding: 25px;">Nenhuma Ordem de Serviço encontrada no momento.</td></tr>`;
    }
  }

  function aplicarFiltrosERenderizar() {
    const termo = inputPesquisa.value.toLowerCase();
    const dataCriacaoFiltro = inputDataCriacao.value;
    const dataFimFiltro = inputDataFim.value;
    const statusFiltro = selectStatus.value.toLowerCase();
    const tipoFiltro = selectTipo.value.toLowerCase();
    const setorFiltro = selectSetor.value.toLowerCase();

    const ordensFiltradas = todasAsOrdens.filter((os) => {
      const numeroOS = String(os.id).padStart(6, "0");
      const asset = os.equipamento?.asset?.toLowerCase() || "";
      const equipDesc = os.equipamento?.descricao?.toLowerCase() || "";
      const nomeSetor = os.equipamento?.local?.setor?.toLowerCase() || "";
      const tipoDesc = os.tipo_manutencao?.descricao?.toLowerCase() || "";
      const solicitante = os.usuario?.nome?.toLowerCase() || "";

      const dadosAbertura =
        os.abertura_ordem_servico && os.abertura_ordem_servico.length > 0
          ? os.abertura_ordem_servico[0]
          : null;

      const dataCriacaoRaw = dadosAbertura?.data_abertura || os.created_at;
      const dataCriacaoISO = dataCriacaoRaw ? dataCriacaoRaw.split("T")[0] : "";

      const dataFimRaw = dadosAbertura?.data_fechamento || "";
      const dataFimISO = dataFimRaw ? dataFimRaw.split("T")[0] : "";

      let statusDesc =
        dadosAbertura?.status_ordem_servico?.descricao?.toLowerCase() ||
        "aberta";
      if (statusDesc.includes("andamento")) statusDesc = "andamento";

      const matchTermo =
        numeroOS.includes(termo) ||
        asset.includes(termo) ||
        equipDesc.includes(termo) ||
        solicitante.includes(termo);

      const matchCriacao =
        dataCriacaoFiltro === "" ? true : dataCriacaoISO === dataCriacaoFiltro;

      const matchFim =
        dataFimFiltro === "" ? true : dataFimISO === dataFimFiltro;

      const matchStatus =
        statusFiltro === "todos" || statusFiltro === ""
          ? true
          : statusDesc.includes(statusFiltro);
      const matchTipo =
        tipoFiltro === "todos" || tipoFiltro === ""
          ? true
          : tipoDesc.includes(tipoFiltro);
      const matchSetor =
        setorFiltro === "todos" || setorFiltro === ""
          ? true
          : nomeSetor.includes(setorFiltro);

      return (
        matchTermo &&
        matchCriacao &&
        matchFim &&
        matchStatus &&
        matchTipo &&
        matchSetor
      );
    });

    renderizarTabela(ordensFiltradas);
  }

  function renderizarTabela(dados) {
    corpoTabelaOrdens.innerHTML = "";
    spanQuantidade.textContent = `${dados.length} registro(s)`;

    if (dados.length === 0) {
      corpoTabelaOrdens.innerHTML = `<tr><td colspan="9" style="text-align: center; color: #8b9ab1; padding: 25px;">Nenhuma Ordem de Serviço encontrada no momento.</td></tr>`;
      return;
    }

    dados.forEach((os) => {
      const numeroFormatado = String(os.id).padStart(6, "0");
      const equipDesc = os.equipamento?.descricao || "Equipamento Geral";
      const asset = os.equipamento?.asset || "S/N";
      const setor = os.equipamento?.local?.setor || "Geral";
      const tipo = os.tipo_manutencao?.descricao || "Corretivo";
      const solicitante = os.usuario?.nome || "Sistema";

      const dadosAbertura =
        os.abertura_ordem_servico && os.abertura_ordem_servico.length > 0
          ? os.abertura_ordem_servico[0]
          : null;

      const dataCriacaoDate = new Date(
        dadosAbertura?.data_abertura || os.created_at,
      );
      const criacaoFormatada = !isNaN(dataCriacaoDate)
        ? dataCriacaoDate.toLocaleDateString("pt-BR", { timeZone: "UTC" })
        : "-";

      const dataFimVal = dadosAbertura?.data_fechamento;
      const fimFormatada = dataFimVal
        ? new Date(dataFimVal).toLocaleDateString("pt-BR", { timeZone: "UTC" })
        : "-";

      const statusLabel =
        dadosAbertura?.status_ordem_servico?.descricao || "Aberta";

      let classeTipo = "";
      if (tipo.toLowerCase().includes("corretivo"))
        classeTipo = "etiqueta-corretivo";
      else if (tipo.toLowerCase().includes("preventivo"))
        classeTipo = "etiqueta-preventivo";
      else if (tipo.toLowerCase().includes("preditivo"))
        classeTipo = "etiqueta-preditivo";

      let classeStatus = "";
      if (statusLabel.toLowerCase().includes("aberta"))
        classeStatus = "status-aberta";
      else if (statusLabel.toLowerCase().includes("andamento"))
        classeStatus = "status-andamento";
      else if (
        statusLabel.toLowerCase().includes("concluid") ||
        statusLabel.toLowerCase().includes("encerrad")
      )
        classeStatus = "status-encerrada";
      else if (statusLabel.toLowerCase().includes("cancelada"))
        classeStatus = "status-cancelada";

      // ==========================================
      // LÓGICA DE BLOQUEIO SE OS ESTIVER CONCLUÍDA
      // ==========================================
      const isConcluida = classeStatus === "status-encerrada";

      // Se concluída, removemos o href e deixamos o número cinza
      const colunaNumero = isConcluida
        ? `<span class="numero-os" style="color: #94a4b8; cursor: default; text-decoration: none;" title="OS Finalizada">#${numeroFormatado}</span>`
        : `<a href="detalhes_os.html?id=${os.id}" class="numero-os">#${numeroFormatado}</a>`;

      // Se concluída, o ícone de visualizar some e vira apenas um traço
      const colunaAcao = isConcluida
        ? `<span style="color: #94a4b8; font-size: 14px; display: inline-flex; width: 32px; justify-content: center;" title="Detalhes indisponíveis para OS Finalizada">-</span>`
        : `<a href="detalhes_os.html?id=${os.id}" class="botao-visualizar" title="Ver detalhes da ordem de serviço">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
              <path d="M2 12s3.5-5 10-5 10 5 10 5-3.5 5-10 5-10-5-10-5Z"></path>
              <circle cx="12" cy="12" r="2.5"></circle>
            </svg>
          </a>`;

      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td>${colunaNumero}</td>
        <td>
          <div class="informacao-equipamento">
            <span>${equipDesc}</span>
            <small>${asset}</small>
          </div>
        </td>
        <td>${setor}</td>
        <td><span class="etiqueta-os ${classeTipo}">${tipo}</span></td>
        <td>${solicitante}</td>
        <td>${criacaoFormatada}</td>
        <td>${fimFormatada}</td>
        <td><span class="status-os ${classeStatus}">${statusLabel}</span></td>
        <td>${colunaAcao}</td>
      `;
      corpoTabelaOrdens.appendChild(tr);
    });
  }

  inputPesquisa.addEventListener("input", aplicarFiltrosERenderizar);
  inputDataCriacao.addEventListener("change", aplicarFiltrosERenderizar);
  inputDataFim.addEventListener("change", aplicarFiltrosERenderizar);
  selectStatus.addEventListener("change", aplicarFiltrosERenderizar);
  selectTipo.addEventListener("change", aplicarFiltrosERenderizar);
  selectSetor.addEventListener("change", aplicarFiltrosERenderizar);

  carregarFiltros().then(() => {
    carregarOrdensDeServico();
  });
});

document.addEventListener("DOMContentLoaded", () => {
  const baseUrl = "https://umvtsquzpugempndwitx.supabase.co/rest/v1";
  const apiKey = "sb_publishable_58JIZcrwwFjp2gnEPPVZeg_tkrJ-LHb";
  const headersConfig = {
    "Content-Type": "application/json",
    apikey: apiKey,
    Authorization: `Bearer ${apiKey}`,
  };

  const listaHistorico = document.getElementById("listaHistorico");
  const inputPesquisa = document.getElementById("pesquisaHistorico");
  const filtroData = document.getElementById("filtroDataHistorico");
  const filtroTipo = document.getElementById("filtroTipoHistorico");
  const filtroStatus = document.getElementById("filtroStatusHistorico");

  const urlParams = new URLSearchParams(window.location.search);
  const idEquipamentoFiltro = urlParams.get("equipamento");

  let dadosHistorico = [];

  async function carregarFiltrosDropdown() {
    try {
      const resStatus = await fetch(
        `${baseUrl}/status_ordem_servico?select=id,descricao&is_active=eq.true`,
        { headers: headersConfig },
      );
      if (resStatus.ok && filtroStatus) {
        const statusData = await resStatus.json();
        filtroStatus.innerHTML =
          '<option value="todos">Todos os status</option>';
        statusData.forEach((s) => {
          filtroStatus.innerHTML += `<option value="${s.descricao.toLowerCase()}">${s.descricao}</option>`;
        });
      }

      const resTipos = await fetch(
        `${baseUrl}/tipo_manutencao?select=id,descricao&is_active=eq.true`,
        { headers: headersConfig },
      );
      if (resTipos.ok && filtroTipo) {
        const tiposData = await resTipos.json();
        filtroTipo.innerHTML = '<option value="todos">Todos os tipos</option>';
        tiposData.forEach((t) => {
          filtroTipo.innerHTML += `<option value="${t.descricao.toLowerCase()}">${t.descricao}</option>`;
        });
      }
    } catch (e) {
      console.warn("Erro ao preencher selects:", e);
    }
  }

  async function carregarHistorico() {
    try {
      let query = `select=id,created_at,equipamento(id,asset,descricao),tipo_manutencao(descricao)&order=id.desc`;

      if (idEquipamentoFiltro) {
        query += `&id_equipamento=eq.${idEquipamentoFiltro}`;
        const subtitulo = document.querySelector(".cabecalho-pagina p");
        if (subtitulo) {
          subtitulo.textContent = `Mostrando histórico apenas do equipamento selecionado.`;
        }
      }

      const resposta = await fetch(`${baseUrl}/ordem_servico?${query}`, {
        method: "GET",
        headers: headersConfig,
      });

      if (!resposta.ok) throw new Error("Erro ao buscar histórico.");
      dadosHistorico = await resposta.json();

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
          dadosHistorico = dadosHistorico.map((os) => {
            const aberturaMatch = aberturas.filter(
              (a) => a.id_ordem_servico === os.id,
            );
            return { ...os, abertura_ordem_servico: aberturaMatch };
          });
        }
      } catch (e) {
        console.warn("Abertura complementar ignorada:", e);
      }

      aplicarFiltrosERenderizar();
    } catch (erro) {
      console.error("Falha ao carregar histórico:", erro);
      listaHistorico.innerHTML = `<tr><td colspan="8" style="text-align: center; color: red; padding: 25px;">Erro ao carregar histórico do banco de dados.</td></tr>`;
    }
  }

  function aplicarFiltrosERenderizar() {
    const termo = inputPesquisa ? inputPesquisa.value.toLowerCase().trim() : "";
    const dataSelecionada = filtroData ? filtroData.value : "todas";
    const tipoSelecionado = filtroTipo
      ? filtroTipo.value.toLowerCase()
      : "todos";
    const statusSelecionado = filtroStatus
      ? filtroStatus.value.toLowerCase()
      : "todos";

    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);

    const filtrados = dadosHistorico.filter((os) => {
      const numeroOS = String(os.id).padStart(6, "0");
      const numeroFormatado = `OS-${new Date(os.created_at).getFullYear()}-${numeroOS}`;
      const equipDesc = os.equipamento?.descricao?.toLowerCase() || "";
      const asset = os.equipamento?.asset?.toLowerCase() || "";
      const tipo = os.tipo_manutencao?.descricao?.toLowerCase() || "";

      const abertura =
        os.abertura_ordem_servico && os.abertura_ordem_servico.length > 0
          ? os.abertura_ordem_servico[0]
          : null;

      const dataAberturaRaw = abertura?.data_abertura || os.created_at;
      const dataOs = dataAberturaRaw ? new Date(dataAberturaRaw) : null;
      if (dataOs) dataOs.setHours(0, 0, 0, 0);

      const statusLabel =
        abertura?.status_ordem_servico?.descricao?.toLowerCase() || "aberta";

      const matchPesquisa =
        numeroOS.includes(termo) ||
        numeroFormatado.toLowerCase().includes(termo) ||
        equipDesc.includes(termo) ||
        asset.includes(termo);

      let matchData = true;
      if (dataSelecionada !== "todas" && dataOs) {
        const diffDias = Math.floor((hoje - dataOs) / (1000 * 60 * 60 * 24));
        if (dataSelecionada === "hoje") matchData = diffDias === 0;
        else if (dataSelecionada === "7dias")
          matchData = diffDias >= 0 && diffDias <= 7;
        else if (dataSelecionada === "30dias")
          matchData = diffDias >= 0 && diffDias <= 30;
        else if (dataSelecionada === "90dias")
          matchData = diffDias >= 0 && diffDias <= 90;
      }

      const matchTipo =
        tipoSelecionado === "todos" ||
        tipoSelecionado === "" ||
        tipo.includes(tipoSelecionado);

      const matchStatus =
        statusSelecionado === "todos" ||
        statusSelecionado === "" ||
        statusLabel.includes(statusSelecionado);

      return matchPesquisa && matchData && matchTipo && matchStatus;
    });

    renderizarTabela(filtrados);
  }

  function renderizarTabela(dados) {
    listaHistorico.innerHTML = "";

    if (dados.length === 0) {
      listaHistorico.innerHTML = `<tr><td colspan="8" style="text-align: center; color: #8b9ab1; padding: 25px;">Nenhum registro de manutenção encontrado.</td></tr>`;
      return;
    }

    dados.forEach((os) => {
      const anoOS = os.created_at
        ? new Date(os.created_at).getFullYear()
        : new Date().getFullYear();
      const numeroFormatado = `OS-${anoOS}-${String(os.id).padStart(4, "0")}`;
      const equipDesc = os.equipamento?.descricao || "Equipamento Geral";
      const tipo = os.tipo_manutencao?.descricao || "Corretivo";
      const tecnico = "Sistema / Admin";

      const abertura =
        os.abertura_ordem_servico && os.abertura_ordem_servico.length > 0
          ? os.abertura_ordem_servico[0]
          : null;

      const dataAberturaDate = abertura?.data_abertura
        ? new Date(abertura.data_abertura)
        : new Date(os.created_at);
      const dataFormatada = !isNaN(dataAberturaDate)
        ? dataAberturaDate.toLocaleDateString("pt-BR", { timeZone: "UTC" })
        : "-";

      const statusLabel = abertura?.status_ordem_servico?.descricao || "Aberta";

      let classeStatus = "";
      if (
        statusLabel.toLowerCase().includes("concluid") ||
        statusLabel.toLowerCase().includes("encerrad")
      )
        classeStatus = "status-concluida";
      else if (statusLabel.toLowerCase().includes("andamento"))
        classeStatus = "status-andamento";
      else if (statusLabel.toLowerCase().includes("cancelada"))
        classeStatus = "status-cancelada";

      let classeTipo = "";
      if (tipo.toLowerCase().includes("preventiv"))
        classeTipo = "tipo-preventiva";
      else if (tipo.toLowerCase().includes("corretiv"))
        classeTipo = "tipo-corretiva";
      else if (tipo.toLowerCase().includes("preditiv"))
        classeTipo = "tipo-preditiva";

      let duracao = "-";
      if (abertura?.data_fechamento && abertura?.data_abertura) {
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

  if (inputPesquisa)
    inputPesquisa.addEventListener("input", aplicarFiltrosERenderizar);
  if (filtroData)
    filtroData.addEventListener("change", aplicarFiltrosERenderizar);
  if (filtroTipo)
    filtroTipo.addEventListener("change", aplicarFiltrosERenderizar);
  if (filtroStatus)
    filtroStatus.addEventListener("change", aplicarFiltrosERenderizar);

  carregarFiltrosDropdown().then(() => {
    carregarHistorico();
  });
});

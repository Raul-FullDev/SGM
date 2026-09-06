document.addEventListener("DOMContentLoaded", () => {
  const baseUrl = "https://umvtsquzpugempndwitx.supabase.co/rest/v1";
  const apiKey = "sb_publishable_58JIZcrwwFjp2gnEPPVZeg_tkrJ-LHb";

  const headersConfig = {
    "Content-Type": "application/json",
    apikey: apiKey,
    Authorization: `Bearer ${apiKey}`,
    Prefer: "return=representation",
  };

  const corpoTabela = document.getElementById("corpoTabelaEquipamentos");
  const inputPesquisa = document.getElementById("pesquisaEquipamento");
  const filtroFabricante = document.getElementById("filtroFabricante");
  const filtroSetor = document.getElementById("filtroSetor");
  const filtroStatus = document.getElementById("filtroStatus");
  const estadoVazio = document.getElementById("estadoVazio");
  const tabelaContainer = document.querySelector(".tabela-equipamentos");

  // Elementos do Modal de Histórico que criamos no HTML
  const modalHistorico = document.getElementById("modalHistoricoEquipamento");
  const corpoTabelaHistorico = document.getElementById(
    "corpoTabelaHistoricoModal",
  );
  const tituloModal = document.getElementById("modalHistoricoTitulo");
  const descAssetModal = document.getElementById("modalHistoricoAsset");

  // ==========================================
  // 1. CARREGAR SELECTS INICIAIS (SETOR E FABRICANTE)
  // ==========================================
  async function carregarFiltrosIniciais() {
    try {
      const resSetores = await fetch(
        `${baseUrl}/local?select=id,setor&order=setor.asc`,
        { headers: headersConfig },
      );
      if (resSetores.ok) {
        const setores = await resSetores.json();
        if (filtroSetor) {
          filtroSetor.innerHTML = `<option value="">Todos os setores</option>`;
          setores.forEach((s) => {
            filtroSetor.innerHTML += `<option value="${s.id}">${s.setor}</option>`;
          });
        }
      }

      const resEquip = await fetch(
        `${baseUrl}/equipamento?select=manufaturado`,
        { headers: headersConfig },
      );
      if (resEquip.ok) {
        const dados = await resEquip.json();
        const fabricantesUnicos = [
          ...new Set(dados.map((e) => e.manufaturado).filter(Boolean)),
        ];
        if (filtroFabricante) {
          filtroFabricante.innerHTML = `<option value="">Todos os fabricantes</option>`;
          fabricantesUnicos.forEach((fab) => {
            filtroFabricante.innerHTML += `<option value="${fab}">${fab}</option>`;
          });
        }
      }
    } catch (erro) {
      console.error("Erro ao carregar filtros:", erro);
    }
  }

  // ==========================================
  // 2. FETCH COM FILTROS NA QUERY URL SUPABASE
  // ==========================================
  async function carregarEquipamentosFiltrados() {
    try {
      let urlQuery = `${baseUrl}/equipamento?select=*,local(id,setor)&order=id.asc`;

      const idLocal = filtroSetor ? filtroSetor.value : "";
      if (idLocal && !idLocal.toLowerCase().includes("todos"))
        urlQuery += `&id_local=eq.${idLocal}`;

      const fabricante = filtroFabricante ? filtroFabricante.value : "";
      if (fabricante && !fabricante.toLowerCase().includes("todos"))
        urlQuery += `&manufaturado=eq.${encodeURIComponent(fabricante)}`;

      const status = filtroStatus ? filtroStatus.value : "";
      if (status && !status.toLowerCase().includes("todos"))
        urlQuery += `&status=ilike.${encodeURIComponent(status)}`;

      const termo = inputPesquisa ? inputPesquisa.value.trim() : "";
      if (termo) urlQuery += `&descricao=ilike.*${encodeURIComponent(termo)}*`;

      const resposta = await fetch(urlQuery, {
        method: "GET",
        headers: headersConfig,
      });
      if (!resposta.ok) throw new Error("Erro ao consultar o Supabase");

      const dados = await resposta.json();
      renderizarTabela(dados);
    } catch (erro) {
      console.error("Falha ao buscar dados:", erro);
    }
  }

  // ==========================================
  // 3. RENDERIZAR TABELA PRINCIPAL
  // ==========================================
  function renderizarTabela(dados) {
    if (!corpoTabela) return;
    corpoTabela.innerHTML = "";

    if (dados.length === 0) {
      if (tabelaContainer) tabelaContainer.style.display = "none";
      if (estadoVazio) estadoVazio.style.display = "flex";
      return;
    }

    if (tabelaContainer) tabelaContainer.style.display = "block";
    if (estadoVazio) estadoVazio.style.display = "none";

    dados.forEach((eqp) => {
      let classeStatus = "status-inativo";
      let textoStatus = eqp.status || "Ativo";
      const statusLower = textoStatus.toLowerCase();
      if (statusLower === "ativo") classeStatus = "status-ativo";
      else if (
        statusLower.includes("manutencao") ||
        statusLower.includes("manutenção")
      )
        classeStatus = "status-manutencao";

      const nomeSetor = eqp.local ? eqp.local.setor : "Sem Setor";

      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td>${eqp.asset || "-"}</td>
        <td>${eqp.descricao || "-"}</td>
        <td>${eqp.manufaturado || "-"} · ${eqp.modelo || "-"}</td>
        <td>${nomeSetor}</td>
        <td>${eqp.numero_serie || "-"}</td>
        <td>${eqp.data_aquisicao || "-"}</td>
        <td><span class="status ${classeStatus}">${textoStatus}</span></td>
        <td>
          <!-- AQUI ESTÁ A CORREÇÃO: Usando button em vez de <a> href -->
          <button class="btn-ver-historico" data-id="${eqp.id}" data-desc="${eqp.descricao}" data-asset="${eqp.asset}" title="Ver Histórico deste equipamento">
            <i class="bi bi-clock-history"></i>
          </button>
        </td>
      `;
      corpoTabela.appendChild(tr);
    });
  }

  // ==========================================
  // 4. LÓGICA DO MODAL DE HISTÓRICO (JIRA SGM-222)
  // ==========================================
  corpoTabela.addEventListener("click", async (e) => {
    // Verifica se clicou no botão do relógio
    const btn = e.target.closest(".btn-ver-historico");
    if (!btn) return;

    const idEqp = btn.getAttribute("data-id");
    if (tituloModal)
      tituloModal.textContent = `Histórico: ${btn.getAttribute("data-desc")}`;
    if (descAssetModal)
      descAssetModal.textContent = `Asset: ${btn.getAttribute("data-asset")}`;

    if (corpoTabelaHistorico)
      corpoTabelaHistorico.innerHTML = `<tr><td colspan="4" style="text-align: center;">Carregando histórico do banco de dados...</td></tr>`;
    if (modalHistorico) modalHistorico.style.display = "flex"; // Abre a janelinha modal

    try {
      // Faz o GET no supabase filtrando só as OS deste equipamento selecionado
      const query = `select=id,tipo_manutencao(descricao),abertura_ordem_servico(data_abertura,status_ordem_servico(descricao))&id_equipamento=eq.${idEqp}&order=id.desc`;
      const resposta = await fetch(`${baseUrl}/ordem_servico?${query}`, {
        headers: headersConfig,
      });

      const historico = await resposta.json();
      if (corpoTabelaHistorico) corpoTabelaHistorico.innerHTML = "";

      if (historico.length === 0) {
        if (corpoTabelaHistorico)
          corpoTabelaHistorico.innerHTML = `<tr><td colspan="4" style="text-align: center;">Este equipamento ainda não possui Ordens de Serviço.</td></tr>`;
        return;
      }

      historico.forEach((os) => {
        const data = os.abertura_ordem_servico[0]?.data_abertura
          ? new Date(
              os.abertura_ordem_servico[0].data_abertura,
            ).toLocaleDateString("pt-BR")
          : "Sem data";
        const status =
          os.abertura_ordem_servico[0]?.status_ordem_servico?.descricao ||
          "Aberta";
        const tipo = os.tipo_manutencao?.descricao || "-";

        if (corpoTabelaHistorico) {
          corpoTabelaHistorico.innerHTML += `
                <tr>
                  <td style="color: #145bea; font-weight: 500;">OS-${String(os.id).padStart(4, "0")}</td>
                  <td>${data}</td>
                  <td>${tipo}</td>
                  <td>${status}</td>
                </tr>
             `;
        }
      });
    } catch (erro) {
      console.error(erro);
      if (corpoTabelaHistorico)
        corpoTabelaHistorico.innerHTML = `<tr><td colspan="4" style="text-align: center; color: red;">Erro ao carregar o histórico.</td></tr>`;
    }
  });

  // Fechar o Modal
  const btnFecharModalX = document.getElementById("fecharModalHistorico");
  const btnFecharModalBtn = document.getElementById("fecharModalHistoricoBtn");

  if (btnFecharModalX)
    btnFecharModalX.addEventListener(
      "click",
      () => (modalHistorico.style.display = "none"),
    );
  if (btnFecharModalBtn)
    btnFecharModalBtn.addEventListener(
      "click",
      () => (modalHistorico.style.display = "none"),
    );

  // ==========================================
  // 5. EVENT LISTENERS PARA OS FILTROS DA TELA
  // ==========================================
  if (inputPesquisa)
    inputPesquisa.addEventListener("input", carregarEquipamentosFiltrados);
  if (filtroFabricante)
    filtroFabricante.addEventListener("change", carregarEquipamentosFiltrados);
  if (filtroSetor)
    filtroSetor.addEventListener("change", carregarEquipamentosFiltrados);
  if (filtroStatus)
    filtroStatus.addEventListener("change", carregarEquipamentosFiltrados);

  carregarFiltrosIniciais();
  carregarEquipamentosFiltrados();
});

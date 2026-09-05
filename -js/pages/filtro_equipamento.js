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

  // ==========================================
  // 1. CARREGAR SELECTS INICIAIS (SETOR E FABRICANTE)
  // ==========================================
  async function carregarFiltrosIniciais() {
    try {
      // Busca a lista de setores cadastrados na tabela 'local'
      const resSetores = await fetch(
        `${baseUrl}/local?select=id,setor&order=setor.asc`,
        {
          headers: headersConfig,
        },
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

      // Busca fabricantes únicos cadastrados na tabela 'equipamento'
      const resEquip = await fetch(
        `${baseUrl}/equipamento?select=manufaturado`,
        {
          headers: headersConfig,
        },
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
      console.error("Erro ao carregar opções dos filtros:", erro);
    }
  }

  // ==========================================
  // 2. FETCH COM FILTROS NA QUERY URL SUPABASE
  // ==========================================
  async function carregarEquipamentosFiltrados() {
    try {
      // Começa com a Query Base
      let urlQuery = `${baseUrl}/equipamento?select=*,local(id,setor)&order=id.asc`;

      // 1. Filtro de Setor
      const idLocal = filtroSetor ? filtroSetor.value : "";
      // Só aplica se existir e não contiver a palavra "todos"
      if (idLocal && !idLocal.toLowerCase().includes("todos")) {
        urlQuery += `&id_local=eq.${idLocal}`;
      }

      // 2. Filtro de Fabricante
      const fabricante = filtroFabricante ? filtroFabricante.value : "";
      if (fabricante && !fabricante.toLowerCase().includes("todos")) {
        urlQuery += `&manufaturado=eq.${encodeURIComponent(fabricante)}`;
      }

      // 3. Filtro de Status
      const status = filtroStatus ? filtroStatus.value : "";
      if (status && !status.toLowerCase().includes("todos")) {
        urlQuery += `&status=ilike.${encodeURIComponent(status)}`;
      }

      // 4. Filtro de Pesquisa por Texto (Busca na descrição)
      const termo = inputPesquisa ? inputPesquisa.value.trim() : "";
      if (termo) {
        urlQuery += `&descricao=ilike.*${encodeURIComponent(termo)}*`;
      }

      // Faz a requisição montada dinamicamente
      const resposta = await fetch(urlQuery, {
        method: "GET",
        headers: headersConfig,
      });

      if (!resposta.ok) throw new Error("Erro ao consultar o Supabase");

      const dados = await resposta.json();
      renderizarTabela(dados);
    } catch (erro) {
      console.error("Falha ao buscar dados filtrados:", erro);
    }
  }

  // ==========================================
  // 3. RENDERIZAR TABELA NO DOM
  // ==========================================
  function renderizarTabela(dados) {
    if (!corpoTabela) return;
    corpoTabela.innerHTML = "";

    if (dados.length === 0) {
      corpoTabela.innerHTML = `<tr><td colspan="7" style="text-align: center;">Nenhum equipamento encontrado com estes filtros.</td></tr>`;
      return;
    }

    dados.forEach((eqp) => {
      let classeStatus = "status-inativo";
      let textoStatus = eqp.status || "Ativo";

      const statusLower = textoStatus.toLowerCase();
      if (statusLower === "ativo") {
        classeStatus = "status-ativo";
      } else if (
        statusLower.includes("manutencao") ||
        statusLower.includes("manutenção")
      ) {
        classeStatus = "status-manutencao";
      }

      const nomeSetor = eqp.local ? eqp.local.setor : "Sem Setor";

      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td>${eqp.asset || "-"}</td>
        <td>${eqp.descricao || "-"}</td>
        <td>${eqp.manufaturado || "-"} · ${eqp.modelo || "-"}</td>
        <td>${nomeSetor}</td>
        <td>${eqp.numero_serie || "-"}</td>
        <td>${eqp.data_aquisicao || "-"}</td>
        <td>
          <span class="status ${classeStatus}">${textoStatus}</span>
        </td>
      `;
      corpoTabela.appendChild(tr);
    });
  }

  // ==========================================
  // 4. EVENT LISTENERS PARA REQUISITAR A API
  // ==========================================
  if (inputPesquisa)
    inputPesquisa.addEventListener("input", carregarEquipamentosFiltrados);
  if (filtroFabricante)
    filtroFabricante.addEventListener("change", carregarEquipamentosFiltrados);
  if (filtroSetor)
    filtroSetor.addEventListener("change", carregarEquipamentosFiltrados);
  if (filtroStatus)
    filtroStatus.addEventListener("change", carregarEquipamentosFiltrados);

  // Inicializa os selects e traz a primeira busca sem filtros
  carregarFiltrosIniciais();
  carregarEquipamentosFiltrados();
});

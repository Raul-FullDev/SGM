document.addEventListener("DOMContentLoaded", () => {
  // ==========================================
  // CONFIGURAÇÕES DA API SUPABASE
  // ==========================================
  const baseUrl = "https://akbqnlvyfravlglouoqs.supabase.co/rest/v1";
  const apikey = "sb_publishable_1c5c9HTR_Hcf3KF5SX22NQ_wNXFADKK";

  const headersConfig = {
    "Content-Type": "application/json",
    apikey: apikey,
    Authorization: `Bearer ${apikey}`,
    Prefer: "return=representation",
  };

  // ==========================================
  // ELEMENTOS DO DOM
  // ==========================================
  const corpoTabela = document.getElementById("usersTableBody");
  const inputPesquisa = document.getElementById("userSearch");
  const filtroNivel = document.getElementById("levelFilter");
  const tabelaContainer = document.querySelector(".table-container");
  const estadoVazio = document.getElementById("estadoVazioUsuarios");

  let todosUsuarios = [];

  // ==========================================
  // FUNÇÃO DE BUSCA NA API (COM FILTROS)
  // ==========================================

    async function carregarFiltroNiveis() {
        if (!filtroNivel) return;

        try {
        const resposta = await fetch(`${baseUrl}/nivel?select=id,funcao&order=id.asc`, {
            method: "GET",
            headers: headersConfig,
        });

        if (resposta.ok) {
            const niveis = await resposta.json();
            filtroNivel.innerHTML = `<option value="all">Todos os níveis</option>`;
            niveis.forEach((n) => {
            filtroNivel.innerHTML += `<option value="${n.id}">${n.funcao}</option>`;
            });
        }
        } catch (erro) {
        console.error("Erro ao carregar opções do filtro de nível: ", erro);
        }
    }

  async function carregarUsuario() {
    try {
      let urlQuery = `${baseUrl}/usuario?select=*,nivel(funcao)&order=id.asc`;

      // Filtro por Nível (id_papel)
      const idNivel = filtroNivel ? filtroNivel.value : "";
      if (idNivel && idNivel !== "all" && !idNivel.toLowerCase().includes("todos")) {
        urlQuery += `&id_papel=eq.${idNivel}`;
      }

      // Filtro por Texto (Nome ou Matrícula)
      const termo = inputPesquisa ? inputPesquisa.value.trim() : "";
      if (termo) {
        urlQuery += `&or=(nome.ilike.*${encodeURIComponent(termo)}*,matricula.ilike.*${encodeURIComponent(termo)}*,funcao.ilike.*${encodeURIComponent(termo)}*,contato.ilike.*${encodeURIComponent(termo)}*)`;
      }

      const resposta = await fetch(urlQuery, {
        method: "GET",
        headers: headersConfig,
      });

      if (!resposta.ok) throw new Error("Erro ao buscar usuarios");

      todosUsuarios = await resposta.json();

      renderizarTabela(todosUsuarios);
    } catch (erro) {
      console.error("Falha ao carregar usuarios: ", erro);
    }
  }

  // ==========================================
  // FUNÇÕES AUXILIARES
  // ==========================================
  function obterIniciais(nome) {
    if (!nome) return "US";
    const separar = nome.trim().split(" ");
    if (separar.length === 1) return separar[0].substring(0, 2).toUpperCase();
    return (separar[0][0] + separar[separar.length - 1][0]).toUpperCase();
  }

  // ==========================================
  // RENDERIZAÇÃO DA TABELA
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

    dados.forEach((user) => {
      // Pega o nível vindo do JOIN do Supabase
      const nomeNivel = user.nivel ? user.nivel.funcao : "Usuário";

      // Define a classe CSS baseada no nome do nível
      let classe = "badge-usuario";
      if (nomeNivel === "Administrador" || nomeNivel === "ADM") classe = "badge-administrador";
      if (nomeNivel === "Técnico" || nomeNivel === "Tecnico") classe = "badge-tecnico";
      if (nomeNivel === "Gerência" || nomeNivel === "Gerencia") classe = "badge-gerencia";

      // Checagem de status simplificada no seu padrão
      const isAtivo = user.is_active === true || user.is_active === 1 || String(user.is_active).toLowerCase() === "ativo";
      const iniciais = obterIniciais(user.nome);

      const tr = document.createElement("tr");
      tr.setAttribute("data-user-id", user.id || "");

      tr.innerHTML = `
        <td>
          <div class="user-cell">
            <div class="table-avatar">${iniciais}</div>
            <span>${user.nome || "-"}</span>
          </div>
        </td>
        <td>${user.matricula || "-"}</td>
        <td>${user.funcao || "-"}</td>
        <td>
          <span class="badge ${classe}">${nomeNivel}</span>
        </td>
        <td>${user.contato || "-"}</td>
        <td>
          <span class="status ${isAtivo ? "status-active" : "status-inactive"}">
            ${isAtivo ? "Ativo" : "Inativo"}
          </span>
        </td>
      `;

      corpoTabela.appendChild(tr);
    });
  }

  // ==========================================
  // LISTENERS DOS FILTROS DA TELA
  // ==========================================
  if (inputPesquisa) {
    inputPesquisa.addEventListener("input", carregarUsuario);
  }
  if (filtroNivel) {
    filtroNivel.addEventListener("change", carregarUsuario);
  }

  carregarFiltroNiveis()
  carregarUsuario();
});
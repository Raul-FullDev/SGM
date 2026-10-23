document.addEventListener("DOMContentLoaded", () => {
  const baseUrl = "https://umvtsquzpugempndwitx.supabase.co/rest/v1";
  const apiKey = "sb_publishable_58JIZcrwwFjp2gnEPPVZeg_tkrJ-LHb";
  const headersConfig = {
    "Content-Type": "application/json",
    apikey: apiKey,
  };

  const corpoTabela = document.getElementById("usersTableBody");
  const inputPesquisa = document.getElementById("userSearch");
  const filtroNivel = document.getElementById("levelFilter");
  const tabelaContainer = document.querySelector(".table-container");

  function normalizarTexto(valor) {
    return String(valor || "")
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase();
  }

  function escaparHTML(valor) {
    return String(valor ?? "").replace(/[&<>"']/g, (caractere) => ({
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;",
    })[caractere]);
  }

  function mostrarMensagemTabela(mensagem) {
    if (!corpoTabela) return;
    corpoTabela.innerHTML = `<tr><td colspan="6" class="estado-tabela-usuarios">${escaparHTML(mensagem)}</td></tr>`;
  }

  function removerNiveisDuplicados(niveis) {
    const vistos = new Set();
    return niveis.filter((nivel) => {
      const chave = normalizarTexto(nivel.funcao).replace(/\s+/g, " ").trim();
      if (!chave || vistos.has(chave)) return false;
      vistos.add(chave);
      return true;
    });
  }

  async function consultarNiveis() {
    let ultimoErro = null;
    let consultaValidaSemResultados = false;

    for (const tabela of ["papel", "nivel"]) {
      const urlAtivos = `${baseUrl}/${tabela}?select=id,funcao&is_active=eq.true&order=id.asc`;

      try {
        let resposta = await fetch(urlAtivos, { headers: headersConfig });
        if (!resposta.ok) {
          ultimoErro = new Error(`${tabela}: ${await resposta.text()}`);
          resposta = await fetch(`${baseUrl}/${tabela}?select=id,funcao&order=id.asc`, {
            headers: headersConfig,
          });
        }

        if (!resposta.ok) {
          ultimoErro = new Error(`${tabela}: ${await resposta.text()}`);
          continue;
        }

        const niveis = await resposta.json();
        if (niveis.length > 0) return removerNiveisDuplicados(niveis);
        consultaValidaSemResultados = true;
      } catch (erro) {
        ultimoErro = erro;
      }
    }

    if (consultaValidaSemResultados) return [];
    throw ultimoErro || new Error("Não foi possível consultar os níveis de acesso.");
  }

  async function carregarFiltroNiveis() {
    if (!filtroNivel) return;

    filtroNivel.innerHTML = '<option value="all">Todos os níveis</option>';
    try {
      const niveis = await consultarNiveis();
      niveis.forEach((nivel) => {
        const option = document.createElement("option");
        option.value = String(nivel.id);
        option.textContent = nivel.funcao;
        filtroNivel.appendChild(option);
      });
    } catch (erro) {
      console.error("Erro ao carregar níveis de acesso:", erro);
      filtroNivel.innerHTML = '<option value="all">Todos os níveis (indisponíveis)</option>';
    }
  }

  async function consultarUsuarios(parametros) {
    let ultimoErro = null;
    let consultaValidaSemResultados = false;
    let usuariosSemNivelRelacionado = [];

    for (const relacionamento of ["papel(funcao)", "nivel(funcao)", null]) {
      const params = new URLSearchParams(parametros);
      params.set("select", relacionamento ? `*,${relacionamento}` : "*");

      try {
        const resposta = await fetch(`${baseUrl}/usuario?${params.toString()}`, {
          headers: headersConfig,
        });
        if (!resposta.ok) {
          ultimoErro = new Error(await resposta.text());
          continue;
        }

        const usuarios = await resposta.json();
        if (usuarios.length > 0) {
          const possuiNivelRelacionado = usuarios.some((usuario) =>
            usuario.papel?.funcao || usuario.nivel?.funcao,
          );
          if (!relacionamento || possuiNivelRelacionado) return usuarios;
          usuariosSemNivelRelacionado = usuarios;
          continue;
        }
        consultaValidaSemResultados = true;
      } catch (erro) {
        ultimoErro = erro;
      }
    }

    if (usuariosSemNivelRelacionado.length > 0) return usuariosSemNivelRelacionado;
    if (consultaValidaSemResultados) return [];
    throw ultimoErro || new Error("Não foi possível consultar os usuários.");
  }

  async function carregarUsuarios() {
    if (!corpoTabela) return;
    mostrarMensagemTabela("Carregando usuários...");
    if (tabelaContainer) tabelaContainer.style.display = "block";

    try {
      const parametros = new URLSearchParams({
        order: "id.asc",
      });

      const idPapel = filtroNivel ? filtroNivel.value : "all";
      if (idPapel && idPapel !== "all") {
        parametros.set("id_papel", `eq.${idPapel}`);
      }

      const termo = inputPesquisa ? inputPesquisa.value.trim() : "";
      if (termo) {
        const termoSeguro = termo.replace(/[(),]/g, " ").trim();
        const termoCodificado = `*${termoSeguro}*`;
        parametros.set(
          "or",
          `(nome.ilike.${termoCodificado},matricula.ilike.${termoCodificado},funcao.ilike.${termoCodificado},contato.ilike.${termoCodificado})`,
        );
      }

      const usuarios = await consultarUsuarios(parametros);
      renderizarTabela(usuarios);
    } catch (erro) {
      console.error("Falha ao carregar usuários:", erro);
      mostrarMensagemTabela("Não foi possível carregar os usuários do banco. Verifique a conexão e tente novamente.");
    }
  }

  function obterIniciais(nome) {
    const palavras = String(nome || "Usuário").trim().split(/\s+/).filter(Boolean);
    if (palavras.length === 0) return "US";
    if (palavras.length === 1) return palavras[0].slice(0, 2).toUpperCase();
    return `${palavras[0][0]}${palavras[palavras.length - 1][0]}`.toUpperCase();
  }

  function renderizarTabela(usuarios) {
    if (!corpoTabela) return;
    corpoTabela.innerHTML = "";

    if (usuarios.length === 0) {
      mostrarMensagemTabela("Nenhum usuário encontrado.");
      return;
    }

    usuarios.forEach((usuario) => {
      const nomeNivel = usuario.papel?.funcao || usuario.nivel?.funcao || "Nível não identificado";
      const nomeNivelNormalizado = normalizarTexto(nomeNivel);
      let classeNivel = "badge-usuario";
      if (nomeNivelNormalizado.includes("admin")) classeNivel = "badge-administrador";
      else if (nomeNivelNormalizado.includes("tecnic")) classeNivel = "badge-tecnico";
      else if (nomeNivelNormalizado.includes("geren")) classeNivel = "badge-gerencia";

      const statusAtivo = String(usuario.is_active).toLowerCase();
      const ativo = usuario.is_active === true || usuario.is_active === 1 || statusAtivo === "ativo" || statusAtivo === "true";
      const tr = document.createElement("tr");
      tr.dataset.userId = usuario.id || "";
      tr.innerHTML = `
        <td>
          <div class="user-cell">
            <div class="table-avatar">${escaparHTML(obterIniciais(usuario.nome))}</div>
            <span>${escaparHTML(usuario.nome || "-")}</span>
          </div>
        </td>
        <td>${escaparHTML(usuario.matricula || "-")}</td>
        <td>${escaparHTML(usuario.funcao || "-")}</td>
        <td><span class="badge ${classeNivel}">${escaparHTML(nomeNivel)}</span></td>
        <td>${escaparHTML(usuario.contato || "-")}</td>
        <td><span class="status ${ativo ? "status-active" : "status-inactive"}">${ativo ? "Ativo" : "Inativo"}</span></td>
      `;
      corpoTabela.appendChild(tr);
    });
  }

  if (inputPesquisa) inputPesquisa.addEventListener("input", carregarUsuarios);
  if (filtroNivel) filtroNivel.addEventListener("change", carregarUsuarios);

  async function inicializar() {
    mostrarMensagemTabela("Carregando usuários...");
    await carregarFiltroNiveis();
    await carregarUsuarios();
  }

  inicializar();
});

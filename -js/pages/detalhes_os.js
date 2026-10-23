document.addEventListener("DOMContentLoaded", () => {
  const baseUrl = "https://umvtsquzpugempndwitx.supabase.co/rest/v1";
  const apiKey = "sb_publishable_58JIZcrwwFjp2gnEPPVZeg_tkrJ-LHb";
  const headersConfig = {
    "Content-Type": "application/json",
    apikey: apiKey,
    Prefer: "return=representation",
  };

  const sessaoStr = localStorage.getItem("sgm_sessao");
  if (!sessaoStr) return;
  const sessao = JSON.parse(sessaoStr);
  const idUsuarioLogado = sessao.id;

  const urlParams = new URLSearchParams(window.location.search);
  const idOsUrl = urlParams.get("id");

  const botoesStatus = document.querySelectorAll(".opcao-status");
  const btnCancelarOS = document.getElementById("cancelarOS");
  const btnFinalizarOS = document.getElementById("finalizarOS");
  const modalEncerrar = document.getElementById("modalEncerrarOS");
  const formFinalizarOS = document.getElementById("formFinalizarOS");

  const btnAdicionarAtividade = document.getElementById("adicionarAtividade");
  const modalNovaAtividade = document.getElementById("modalNovaAtividade");
  const formNovaAtividade = document.getElementById("formNovaAtividade");
  const selectTipoServico = document.getElementById("atividadeTipoServico");
  const selectStatusAtividade = document.getElementById("atividadeStatus");

  const modalEditarAtividade = document.getElementById("modalEditarAtividade");
  const formEditarAtividade = document.getElementById("formEditarAtividade");
  const btnExcluirAtividade = document.getElementById("btnExcluirAtividade");
  const editTipoServico = document.getElementById("editAtividadeTipoServico");
  const editStatusAtividade = document.getElementById("editAtividadeStatus");
  const containerListaAtividades = document.getElementById(
    "containerListaAtividades",
  );
  let arrayAtividadesGlobal = [];

  const btnAdicionarPeca = document.getElementById("adicionarPeca");
  const modalNovaPeca = document.getElementById("modalNovaPeca");
  const formNovaPeca = document.getElementById("formNovaPeca");
  const selectPeca = document.getElementById("pecaSelecionada");
  const inputPesquisaPeca = document.getElementById("pesquisaPeca");
  const sugestoesPeca = document.getElementById("sugestoesPeca");
  const infoPecaSelecionada = document.getElementById("pecaSelecionadaInfo");

  const modalEditarPeca = document.getElementById("modalEditarPeca");
  const formEditarPeca = document.getElementById("formEditarPeca");
  const btnRemoverPecaOS = document.getElementById("btnRemoverPecaOS");

  let idAberturaAtual = null;
  let idStatusAtual = null;
  let isOsConcluida = false; 
  const mapStatusIds = {};

  let indiceSugestaoAtiva = -1;

  function normalizarTextoPeca(texto) {
    return String(texto ?? "")
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLocaleLowerCase("pt-BR");
  }

  function formatarCustoPeca(valor) {
    return Number(valor || 0).toLocaleString("pt-BR", {
      style: "currency",
      currency: "BRL",
    });
  }

  function fecharSugestoesPeca() {
    if (!sugestoesPeca || !inputPesquisaPeca) return;
    sugestoesPeca.hidden = true;
    inputPesquisaPeca.setAttribute("aria-expanded", "false");
    inputPesquisaPeca.removeAttribute("aria-activedescendant");
    indiceSugestaoAtiva = -1;
  }

  function selecionarPecaAutocomplete(idPeca) {
    const peca = (window.pecasGlobal || []).find(
      (item) => String(item.id) === String(idPeca),
    );
    if (!peca) return;

    selectPeca.value = String(peca.id);
    inputPesquisaPeca.value = peca.descricao || "";
    infoPecaSelecionada.textContent =
      `Estoque disponível: ${peca.qtde} | Custo unitário: ${formatarCustoPeca(peca.custo_unitario)}`;
    fecharSugestoesPeca();
  }

  function renderizarSugestoesPeca(termo) {
    if (!sugestoesPeca || !inputPesquisaPeca) return;

    const termoNormalizado = normalizarTextoPeca(termo.trim());
    sugestoesPeca.innerHTML = "";
    indiceSugestaoAtiva = -1;

    if (!termoNormalizado) {
      fecharSugestoesPeca();
      return;
    }

    const pecasEncontradas = (window.pecasGlobal || [])
      .filter((peca) => normalizarTextoPeca(peca.descricao).includes(termoNormalizado))
      .slice(0, 8);

    if (pecasEncontradas.length === 0) {
      const mensagem = document.createElement("div");
      mensagem.className = "sugestao-peca-vazia";
      mensagem.textContent = "Nenhuma peça encontrada.";
      sugestoesPeca.appendChild(mensagem);
    } else {
      pecasEncontradas.forEach((peca) => {
        const opcao = document.createElement("div");
        opcao.className = "sugestao-peca";
        opcao.id = `sugestaoPeca-${peca.id}`;
        opcao.dataset.id = String(peca.id);
        opcao.setAttribute("role", "option");
        opcao.setAttribute("aria-selected", "false");
        opcao.tabIndex = -1;

        const nome = document.createElement("span");
        nome.className = "sugestao-peca-nome";
        nome.textContent = peca.descricao || "Peça sem descrição";

        const detalhes = document.createElement("span");
        detalhes.className = "sugestao-peca-detalhes";
        detalhes.textContent = `Estoque: ${peca.qtde} · Custo unitário: ${formatarCustoPeca(peca.custo_unitario)}`;

        opcao.append(nome, detalhes);
        sugestoesPeca.appendChild(opcao);
      });
    }

    sugestoesPeca.hidden = false;
    inputPesquisaPeca.setAttribute("aria-expanded", "true");
  }

  inputPesquisaPeca?.addEventListener("input", () => {
    selectPeca.value = "";
    if (infoPecaSelecionada) infoPecaSelecionada.textContent = "";
    renderizarSugestoesPeca(inputPesquisaPeca.value);
  });

  inputPesquisaPeca?.addEventListener("keydown", (evento) => {
    if (evento.key === "Escape") {
      fecharSugestoesPeca();
      return;
    }

    if (sugestoesPeca.hidden) return;
    const opcoes = Array.from(
      sugestoesPeca.querySelectorAll(".sugestao-peca[data-id]"),
    );
    if (opcoes.length === 0) return;

    if (evento.key === "ArrowDown" || evento.key === "ArrowUp") {
      evento.preventDefault();
      const incremento = evento.key === "ArrowDown" ? 1 : -1;
      if (indiceSugestaoAtiva === -1) {
        indiceSugestaoAtiva = incremento === 1 ? 0 : opcoes.length - 1;
      } else {
        indiceSugestaoAtiva =
          (indiceSugestaoAtiva + incremento + opcoes.length) % opcoes.length;
      }

      opcoes.forEach((opcao, indice) => {
        const ativa = indice === indiceSugestaoAtiva;
        opcao.classList.toggle("ativa", ativa);
        opcao.setAttribute("aria-selected", String(ativa));
      });
      const opcaoAtiva = opcoes[indiceSugestaoAtiva];
      inputPesquisaPeca.setAttribute("aria-activedescendant", opcaoAtiva.id);
      opcaoAtiva.scrollIntoView({ block: "nearest" });
    } else if (evento.key === "Enter" && indiceSugestaoAtiva >= 0) {
      evento.preventDefault();
      selecionarPecaAutocomplete(opcoes[indiceSugestaoAtiva].dataset.id);
    }
  });

  sugestoesPeca?.addEventListener("mousedown", (evento) => {
    if (evento.target.closest(".sugestao-peca[data-id]")) {
      evento.preventDefault();
    }
  });

  sugestoesPeca?.addEventListener("click", (evento) => {
    const opcao = evento.target.closest(".sugestao-peca[data-id]");
    if (opcao) selecionarPecaAutocomplete(opcao.dataset.id);
  });

  document.addEventListener("click", (evento) => {
    if (
      sugestoesPeca &&
      inputPesquisaPeca &&
      !sugestoesPeca.contains(evento.target) &&
      evento.target !== inputPesquisaPeca
    ) {
      fecharSugestoesPeca();
    }
  });


  async function inicializarDados() {
    try {
      const resStatusOS = await fetch(
        `${baseUrl}/status_ordem_servico?select=id,descricao`,
        { headers: headersConfig },
      );
      const dadosStatus = await resStatusOS.json();
      dadosStatus.forEach((s) => {
        const desc = s.descricao.toLowerCase();
        if (desc.includes("aberta")) mapStatusIds["aberta"] = s.id;
        else if (desc.includes("andamento")) mapStatusIds["andamento"] = s.id;
        else if (desc.includes("concluid")) mapStatusIds["concluida"] = s.id;
        else if (desc.includes("cancelada")) mapStatusIds["cancelada"] = s.id;
      });

      let queryAbertura = `${baseUrl}/abertura_ordem_servico?select=id,id_ordem_servico,id_status,data_abertura,data_fechamento,status_ordem_servico(descricao),ordem_servico(id,descricao_problema,equipamento(id,asset,descricao,local(setor)),tipo_manutencao(descricao),usuario!fk_ordem_servico_id_usuario_solicitante(nome))&order=id.desc&limit=1`;
      if (idOsUrl) {
        queryAbertura = `${baseUrl}/abertura_ordem_servico?select=id,id_ordem_servico,id_status,data_abertura,data_fechamento,status_ordem_servico(descricao),ordem_servico(id,descricao_problema,equipamento(id,asset,descricao,local(setor)),tipo_manutencao(descricao),usuario!fk_ordem_servico_id_usuario_solicitante(nome))&id_ordem_servico=eq.${idOsUrl}`;
      }

      const resOs = await fetch(queryAbertura, { headers: headersConfig });
      const dadosOs = await resOs.json();

      if (dadosOs.length > 0) {
        const abertura = dadosOs[0];
        idAberturaAtual = abertura.id;
        idStatusAtual = abertura.id_status;
        const os = abertura.ordem_servico;

        isOsConcluida = idStatusAtual === mapStatusIds["concluida"];

        if (os) {
          document.querySelector(".numero-os").textContent =
            `OS #${String(os.id).padStart(4, "0")}`;
          document.getElementById("dataAberturaOS").textContent =
            abertura.data_abertura
              ? new Date(abertura.data_abertura).toLocaleDateString("pt-BR")
              : "-";
          document.getElementById("dataFechamentoOS").textContent =
            abertura.data_fechamento
              ? new Date(abertura.data_fechamento).toLocaleDateString("pt-BR")
              : "—";

          document.querySelector(".informacoes-grid").innerHTML = `
            <div class="informacao"><span class="informacao-label">EQUIPAMENTO</span><strong>${os.equipamento?.descricao || "-"}</strong></div>
            <div class="informacao"><span class="informacao-label">ASSET</span><strong>${os.equipamento?.asset || "-"}</strong></div>
            <div class="informacao"><span class="informacao-label">SETOR</span><strong>${os.equipamento?.local?.setor || "-"}</strong></div>
            <div class="informacao"><span class="informacao-label">TIPO</span><strong>${os.tipo_manutencao?.descricao || "-"}</strong></div>
            <div class="informacao"><span class="informacao-label">SOLICITANTE</span><strong>${os.usuario?.nome || "-"}</strong></div>
            <div class="informacao"><span class="informacao-label">TÉCNICO</span><strong>Admin</strong></div>
            <div class="informacao"><span class="informacao-label">ABERTURA</span><strong>${abertura.data_abertura ? new Date(abertura.data_abertura).toLocaleDateString("pt-BR") : "-"}</strong></div>
            <div class="informacao"><span class="informacao-label">FECHAMENTO</span><strong id="dataFechamentoOS">${abertura.data_fechamento ? new Date(abertura.data_fechamento).toLocaleDateString("pt-BR") : "—"}</strong></div>
          `;
          document.querySelector(".descricao-problema p").textContent =
            os.descricao_problema || "Sem descrição";

          if (abertura.data_abertura)
            document.getElementById("encerraDataInicio").value =
              abertura.data_abertura.slice(0, 16);
          document.getElementById("encerraDataFim").value = new Date()
            .toISOString()
            .slice(0, 16);
        }

        const statusDesc =
          abertura.status_ordem_servico?.descricao || "Em Andamento";
        const badge = document.querySelector(".status-badge");
        badge.textContent = statusDesc;
        badge.className = `status-badge status-${statusDesc.toLowerCase().replace(/\s+/g, "-")}`;

        botoesStatus.forEach((btn) => {
          btn.classList.remove("selecionado");
          if (
            btn.textContent.trim().toLowerCase() === statusDesc.toLowerCase()
          ) {
            btn.classList.add("selecionado");
          }
        });
      }

      const resTipos = await fetch(`${baseUrl}/tipo_servico?select=id,tipo`, {
        headers: headersConfig,
      });
      const tipos = await resTipos.json();
      selectTipoServico.innerHTML =
        '<option value="">Selecione o tipo</option>';
      editTipoServico.innerHTML = '<option value="">Selecione o tipo</option>';
      tipos.forEach((t) => {
        selectTipoServico.innerHTML += `<option value="${t.id}">${t.tipo}</option>`;
        editTipoServico.innerHTML += `<option value="${t.id}">${t.tipo}</option>`;
      });

      const resStatusAtv = await fetch(
        `${baseUrl}/status_atividade?select=id,descricao`,
        { headers: headersConfig },
      );
      const statusAtv = await resStatusAtv.json();
      selectStatusAtividade.innerHTML =
        '<option value="">Selecione o status</option>';
      editStatusAtividade.innerHTML =
        '<option value="">Selecione o status</option>';
      statusAtv.forEach((s) => {
        selectStatusAtividade.innerHTML += `<option value="${s.id}">${s.descricao}</option>`;
        editStatusAtividade.innerHTML += `<option value="${s.id}">${s.descricao}</option>`;
      });

      if (selectPeca && inputPesquisaPeca && sugestoesPeca) {
        const resPecas = await fetch(
          `${baseUrl}/peca?select=id,descricao,custo_unitario,qtde&is_active=eq.true&order=descricao.asc`,
          { headers: headersConfig },
        );
        if (!resPecas.ok) throw new Error("Erro ao carregar peças do estoque.");
        window.pecasGlobal = await resPecas.json();
        selectPeca.value = "";
        sugestoesPeca.innerHTML = "";
      }

      if (idAberturaAtual) {
        await carregarAtividadesDaOS();
        await carregarPecasDaOS();
      }
    } catch (e) {
      console.error("Erro ao inicializar dados:", e);
    }
  }

  async function carregarAtividadesDaOS() {
    try {
      const query = `select=id,servico,data_inicio,data_fechamento,tipo_servico(id,tipo),status_atividade(id,descricao)&id_abertura_ordem_servico=eq.${idAberturaAtual}&is_active=eq.true&order=id.asc`;
      const resposta = await fetch(`${baseUrl}/atividade?${query}`, {
        headers: headersConfig,
      });
      if (!resposta.ok) throw new Error("Erro ao buscar atividades");

      arrayAtividadesGlobal = await resposta.json();
      renderizarAtividades(arrayAtividadesGlobal);
    } catch (erro) {
      if (containerListaAtividades)
        containerListaAtividades.innerHTML =
          '<p style="text-align: center; color: red;">Erro ao carregar lista.</p>';
    }
  }

  function renderizarAtividades(listaAtividades) {
    if (!containerListaAtividades) return;
    containerListaAtividades.innerHTML = "";

    if (listaAtividades.length === 0) {
      containerListaAtividades.innerHTML =
        '<p style="text-align: center; color: #6c809b; font-size: 11px; padding: 20px;">Nenhuma atividade registrada.</p>';
      return;
    }

    listaAtividades.forEach((ativ, index) => {
      const descricao = ativ.servico || "Sem descrição";
      const tipo = ativ.tipo_servico?.tipo || "Outro";
      const status = ativ.status_atividade?.descricao || "Pendente";
      let classeConcluida = "";
      let iconeNumero = index + 1;

      const isAtivConcluida =
        status.toLowerCase().includes("conclu") ||
        status.toLowerCase().includes("concluída");
      if (isAtivConcluida) {
        classeConcluida = "concluida";
        iconeNumero = '<i class="bi bi-check"></i>';
      }

      const botaoLapisHTML =
        isAtivConcluida || isOsConcluida
          ? ""
          : `<button type="button" class="botao-editar-atividade" data-id="${ativ.id}" aria-label="Editar atividade"><i class="bi bi-pencil"></i></button>`;

      containerListaAtividades.innerHTML += `
        <div class="atividade ${classeConcluida}">
            <span class="atividade-numero">${iconeNumero}</span>
            <div class="atividade-info">
                <div class="atividade-conteudo">
                  <span class="atividade-texto">${descricao}</span>
                  <span class="atividade-tipo">Tipo: ${tipo}</span>
                </div>
                <span class="atividade-status">${status}</span>
                ${botaoLapisHTML}
            </div>
        </div>
      `;
    });
  }

  containerListaAtividades?.addEventListener("click", (e) => {
    const btnEditar = e.target.closest(".botao-editar-atividade");
    if (!btnEditar) return;
    const idAtividade = Number(btnEditar.getAttribute("data-id"));
    const ativ = arrayAtividadesGlobal.find((a) => a.id === idAtividade);
    if (!ativ) return;

    document.getElementById("editAtividadeId").value = ativ.id;
    document.getElementById("editAtividadeStatusAnterior").value =
      ativ.status_atividade?.id || "";
    document.getElementById("editAtividadeDescricao").value = ativ.servico;
    editTipoServico.value = ativ.tipo_servico?.id || "";
    editStatusAtividade.value = ativ.status_atividade?.id || "";
    if (btnExcluirAtividade) {
      const statusAtividade = ativ.status_atividade?.descricao?.toLowerCase() || "";
      const atividadeConcluida = statusAtividade.includes("conclu");
      btnExcluirAtividade.style.display =
        atividadeConcluida || isOsConcluida ? "none" : "inline-flex";
    }

    if (ativ.data_fechamento) {
      document.getElementById("editAtividadeDataFim").value =
        ativ.data_fechamento.slice(0, 16);
    } else {
      document.getElementById("editAtividadeDataFim").value = new Date()
        .toISOString()
        .slice(0, 16);
    }
    modalEditarAtividade.style.display = "flex";
  });

  formEditarAtividade?.addEventListener("submit", async (e) => {
    e.preventDefault();
    const idAtiv = document.getElementById("editAtividadeId").value;
    const statusAntigo = document.getElementById(
      "editAtividadeStatusAnterior",
    ).value;
    const statusNovo = editStatusAtividade.value;
    const tipoNovo = editTipoServico.value;
    const descNova = document.getElementById("editAtividadeDescricao").value;
    const dataFimEdit = document.getElementById("editAtividadeDataFim").value;

    try {
      const payload = {
        servico: descNova,
        id_tipo_servico: Number(tipoNovo),
        id_status: Number(statusNovo),
        id_usuario_ultima_atualizacao: idUsuarioLogado,
      };

      if (dataFimEdit) {
        payload.data_fechamento = new Date(dataFimEdit).toISOString();
        payload.id_usuario_conclusao = idUsuarioLogado;
      }

      const resPatch = await fetch(`${baseUrl}/atividade?id=eq.${idAtiv}`, {
        method: "PATCH",
        headers: headersConfig,
        body: JSON.stringify(payload),
      });
      if (!resPatch.ok) throw new Error("Erro ao atualizar a atividade.");

      if (statusAntigo !== statusNovo) {
        await fetch(`${baseUrl}/historico_status_atividade`, {
          method: "POST",
          headers: headersConfig,
          body: JSON.stringify({
            id_atividade: Number(idAtiv),
            id_status_anterior: Number(statusAntigo),
            id_status_novo: Number(statusNovo),
            id_usuario_responsavel: idUsuarioLogado,
            observacao: "Status e data de encerramento atualizados.",
          }),
        });
      }
      alert("Atividade atualizada com sucesso!");
      modalEditarAtividade.style.display = "none";
      carregarAtividadesDaOS();
    } catch (erro) {
      alert(erro.message);
    }
  });

  btnExcluirAtividade?.addEventListener("click", async () => {
    const idAtiv = Number(document.getElementById("editAtividadeId").value);
    if (!idAtiv) return;
    if (isOsConcluida) {
      alert("Não é possível excluir atividades de uma OS concluída.");
      return;
    }

    try {
      // Não ocultar uma atividade enquanto existirem peças ativas vinculadas:
      // elas precisam ser removidas individualmente para devolver o estoque.
      const resPecasVinculadas = await fetch(
        `${baseUrl}/troca_peca?select=id&id_atividade=eq.${idAtiv}&is_active=eq.true`,
        { headers: headersConfig },
      );
      if (!resPecasVinculadas.ok)
        throw new Error("Não foi possível verificar as peças vinculadas à atividade.");
      const pecasVinculadas = await resPecasVinculadas.json();
      if (pecasVinculadas.length > 0) {
        alert(
          "Esta atividade possui peças utilizadas vinculadas. Remova primeiro essas peças pela seção Peças Utilizadas; a quantidade será devolvida ao estoque.",
        );
        return;
      }

      const resSessoesAbertas = await fetch(
        `${baseUrl}/sessao_atividade?select=id&id_atividade=eq.${idAtiv}&is_active=eq.true&data_fim_sessao=is.null`,
        { headers: headersConfig },
      );
      if (!resSessoesAbertas.ok)
        throw new Error("Não foi possível verificar as sessões de trabalho da atividade.");
      const sessoesAbertas = await resSessoesAbertas.json();
      if (sessoesAbertas.length > 0) {
        alert(
          "Esta atividade possui uma sessão de trabalho aberta. Encerre a sessão antes de desativar a atividade.",
        );
        return;
      }

      // Preservar sessões e histórico de status: a atividade é desativada, não apagada.
      const confirmar = confirm(
        "Excluir esta atividade da visualização da OS? Ela será desativada e seu histórico será preservado.",
      );
      if (!confirmar) return;

      btnExcluirAtividade.disabled = true;
      const resDesativar = await fetch(
        `${baseUrl}/atividade?id=eq.${idAtiv}&is_active=eq.true`,
        {
          method: "PATCH",
          headers: headersConfig,
          body: JSON.stringify({
            is_active: false,
            id_usuario_ultima_atualizacao: idUsuarioLogado,
          }),
        },
      );
      if (!resDesativar.ok) throw new Error("Não foi possível desativar a atividade.");
      const atividadesDesativadas = await resDesativar.json().catch(() => []);
      if (!Array.isArray(atividadesDesativadas) || atividadesDesativadas.length === 0)
        throw new Error("A atividade já foi alterada; atualize a tela e tente novamente.");

      alert("Atividade removida da OS. O histórico foi preservado.");
      modalEditarAtividade.style.display = "none";
      await inicializarDados();
    } catch (erro) {
      alert(erro.message || "Erro ao desativar a atividade.");
    } finally {
      if (btnExcluirAtividade) btnExcluirAtividade.disabled = false;
    }
  });

  formNovaAtividade?.addEventListener("submit", async (e) => {
    e.preventDefault();
    const dataInicioVal = document.getElementById("atividadeDataInicio").value;
    const dataFimVal = document.getElementById("atividadeDataFim").value;

    try {
      const payloadAtividade = {
        servico: document.getElementById("atividadeDescricao").value,
        id_tipo_servico: Number(selectTipoServico.value),
        id_abertura_ordem_servico: idAberturaAtual,
        id_usuario_tecnico: idUsuarioLogado,
        id_usuario_ultima_atualizacao: idUsuarioLogado,
        id_status: Number(selectStatusAtividade.value),
        data_inicio: new Date(dataInicioVal).toISOString(),
      };
      if (dataFimVal) {
        payloadAtividade.data_fechamento = new Date(dataFimVal).toISOString();
        payloadAtividade.id_usuario_conclusao = idUsuarioLogado;
      }

      const resAtiv = await fetch(`${baseUrl}/atividade`, {
        method: "POST",
        headers: headersConfig,
        body: JSON.stringify(payloadAtividade),
      });
      if (!resAtiv.ok) throw new Error("Erro ao salvar Atividade.");

      alert("Atividade registrada com sucesso!");
      modalNovaAtividade.style.display = "none";
      formNovaAtividade.reset();
      carregarAtividadesDaOS();
    } catch (erro) {
      alert(erro.message);
    }
  });

  document
    .getElementById("fecharModalEditar")
    ?.addEventListener(
      "click",
      () => (modalEditarAtividade.style.display = "none"),
    );
  document
    .getElementById("cancelarModalEditar")
    ?.addEventListener(
      "click",
      () => (modalEditarAtividade.style.display = "none"),
    );
  document
    .getElementById("fecharModalAtividade")
    ?.addEventListener(
      "click",
      () => (modalNovaAtividade.style.display = "none"),
    );
  document
    .getElementById("cancelarModalAtividade")
    ?.addEventListener(
      "click",
      () => (modalNovaAtividade.style.display = "none"),
    );
  if (btnAdicionarAtividade)
    btnAdicionarAtividade.addEventListener(
      "click",
      () => (modalNovaAtividade.style.display = "flex"),
    );

  async function carregarPecasDaOS() {
    try {
  
      const resAtiv = await fetch(
        `${baseUrl}/atividade?select=id&id_abertura_ordem_servico=eq.${idAberturaAtual}&is_active=eq.true`,
        { headers: headersConfig },
      );
      if (!resAtiv.ok) throw new Error("Erro ao buscar atividades para peças");
      const ativs = await resAtiv.json();

      const tbody = document.querySelector(".tabela-pecas tbody");
      const tfootTotal = document.querySelector(
        ".tabela-pecas tfoot td:last-child strong",
      );
      if (!tbody) return;

      if (ativs.length === 0) {
        tbody.innerHTML =
          '<tr><td colspan="5" style="text-align: center; color: #6c809b; font-size: 11px;">Nenhuma peça utilizada nesta OS.</td></tr>';
        if (tfootTotal) tfootTotal.textContent = "R$ 0.00";
        return;
      }

      const idsAtividades = ativs.map((a) => a.id);
      const queryPecas = `${baseUrl}/troca_peca?select=id,id_peca,quantidade,custo_unitario_na_troca,peca(descricao),id_atividade&id_atividade=in.(${idsAtividades.join(",")})&is_active=eq.true`;
      const resTrocas = await fetch(queryPecas, { headers: headersConfig });
      if (!resTrocas.ok) throw new Error("Erro ao buscar peças utilizadas");

      const trocas = await resTrocas.json();
      tbody.innerHTML = "";

      if (trocas.length === 0) {
        tbody.innerHTML =
          '<tr><td colspan="5" style="text-align: center; color: #6c809b; font-size: 11px;">Nenhuma peça utilizada nesta OS.</td></tr>';
        if (tfootTotal) tfootTotal.textContent = "R$ 0.00";
        return;
      }

      let totalOS = 0;
      trocas.forEach((t) => {
        const totalItem = t.quantidade * t.custo_unitario_na_troca;
        totalOS += totalItem;

        const btnAcaoHtml = isOsConcluida
          ? ""
          : `<button type="button" class="botao-editar-peca" data-id="${t.id}" data-idpeca="${t.id_peca}" data-qtd="${t.quantidade}" data-desc="${t.peca?.descricao}" title="Editar peça">
               <i class="bi bi-pencil"></i>
             </button>`;

        tbody.innerHTML += `
          <tr>
              <td>${t.peca?.descricao || "-"}</td>
              <td>${t.quantidade}</td>
              <td>R$ ${t.custo_unitario_na_troca.toFixed(2)}</td>
              <td><strong>R$ ${totalItem.toFixed(2)}</strong></td>
              <td class="acao-peca">${btnAcaoHtml}</td>
          </tr>
        `;
      });
      if (tfootTotal) tfootTotal.textContent = `R$ ${totalOS.toFixed(2)}`;
    } catch (erro) {
      console.error("Falha ao carregar peças:", erro);
    }
  }

  formNovaPeca?.addEventListener("submit", async (e) => {
    e.preventDefault();
    const idPeca = Number(document.getElementById("pecaSelecionada").value);
    const qtdUsada = Number(document.getElementById("pecaQuantidade").value);
    if (!idPeca) return alert("Pesquise e selecione uma peça na lista de sugestões.");
    const idAtiv = Number(
      document.getElementById("pecaAtividadeVinculada").value,
    );
    if (!idAtiv || !arrayAtividadesGlobal.some((atividade) => atividade.id === idAtiv))
      return alert("Selecione uma atividade ativa para vincular a peça.");

    const pecaSelecionada = window.pecasGlobal.find((p) => p.id === idPeca);
    if (!pecaSelecionada) return alert("Peça não encontrada no sistema.");
    if (!Number.isFinite(qtdUsada) || qtdUsada <= 0)
      return alert("Informe uma quantidade válida maior que zero.");

    let estoqueAnterior = null;
    let estoqueAtualizado = false;
    try {
      const resPecaAtual = await fetch(
        `${baseUrl}/peca?select=id,descricao,custo_unitario,qtde,is_active&id=eq.${idPeca}`,
        { headers: headersConfig },
      );
      if (!resPecaAtual.ok) throw new Error("Não foi possível consultar o estoque atual.");
      const pecasAtuais = await resPecaAtual.json();
      if (!pecasAtuais.length || pecasAtuais[0].is_active !== true)
        throw new Error("Esta peça não está mais ativa para utilização.");

      const peca = pecasAtuais[0];
      estoqueAnterior = Number(peca.qtde);
      if (!Number.isFinite(estoqueAnterior) || estoqueAnterior < qtdUsada) {
        throw new Error(
          `Estoque insuficiente: solicitado ${qtdUsada}, disponível ${Number.isFinite(estoqueAnterior) ? estoqueAnterior : 0}.`,
        );
      }

      const resEstoque = await fetch(`${baseUrl}/peca?id=eq.${idPeca}`, {
        method: "PATCH",
        headers: headersConfig,
        body: JSON.stringify({ qtde: estoqueAnterior - qtdUsada }),
      });
      if (!resEstoque.ok) throw new Error("Não foi possível baixar a quantidade do estoque.");
      estoqueAtualizado = true;

      const resTroca = await fetch(`${baseUrl}/troca_peca`, {
        method: "POST",
        headers: headersConfig,
        body: JSON.stringify({
          id_atividade: idAtiv,
          id_peca: idPeca,
          quantidade: qtdUsada,
          custo_unitario_na_troca: peca.custo_unitario,
        }),
      });
      if (!resTroca.ok) throw new Error("Erro ao vincular a peça à OS.");

      alert("Peça adicionada e estoque atualizado com sucesso!");
      modalNovaPeca.style.display = "none";
      formNovaPeca.reset();
      if (infoPecaSelecionada) infoPecaSelecionada.textContent = "";
      fecharSugestoesPeca();
      await inicializarDados();
    } catch (erro) {
      if (estoqueAtualizado && estoqueAnterior !== null) {
        try {
          await fetch(`${baseUrl}/peca?id=eq.${idPeca}`, {
            method: "PATCH",
            headers: headersConfig,
            body: JSON.stringify({ qtde: estoqueAnterior }),
          });
        } catch (erroCompensacao) {
          console.error("Falha ao reverter baixa de estoque:", erroCompensacao);
        }
      }
      alert(erro.message);
    }
  });

  if (btnAdicionarPeca) {
    btnAdicionarPeca.addEventListener("click", () => {
      if (arrayAtividadesGlobal.length === 0)
        return alert(
          "Cadastre ao menos uma Atividade antes de registrar uma Peça!",
        );
      const selectAtiv = document.getElementById("pecaAtividadeVinculada");
      selectAtiv.innerHTML =
        '<option value="">Selecione a atividade...</option>';
      arrayAtividadesGlobal.forEach((a) => {
        selectAtiv.innerHTML += `<option value="${a.id}">${a.servico}</option>`;
      });
      inputPesquisaPeca.value = "";
      selectPeca.value = "";
      if (infoPecaSelecionada) infoPecaSelecionada.textContent = "";
      fecharSugestoesPeca();
      modalNovaPeca.style.display = "flex";
    });
  }
  document
    .getElementById("fecharModalPeca")
    ?.addEventListener("click", () => (modalNovaPeca.style.display = "none"));
  document
    .getElementById("cancelarModalPeca")
    ?.addEventListener("click", () => (modalNovaPeca.style.display = "none"));

  document.querySelector(".tabela-pecas")?.addEventListener("click", (e) => {
    const btnPeca = e.target.closest(".botao-editar-peca");
    if (!btnPeca) return;

    document.getElementById("editPecaIdTroca").value =
      btnPeca.getAttribute("data-id");
    document.getElementById("editPecaIdOriginal").value =
      btnPeca.getAttribute("data-idpeca");
    document.getElementById("editPecaQtdAntiga").value =
      btnPeca.getAttribute("data-qtd");
    document.getElementById("editPecaDescricaoItem").value =
      btnPeca.getAttribute("data-desc");
    document.getElementById("editPecaQuantidade").value =
      btnPeca.getAttribute("data-qtd");

    modalEditarPeca.style.display = "flex";
  });

  btnRemoverPecaOS?.addEventListener("click", async () => {
    const idTroca = Number(document.getElementById("editPecaIdTroca").value);
    const idPeca = Number(document.getElementById("editPecaIdOriginal").value);
    const qtdUsada = Number(document.getElementById("editPecaQtdAntiga").value);
    if (!idTroca || !idPeca || !Number.isFinite(qtdUsada) || qtdUsada <= 0) {
      alert("Não foi possível identificar a peça utilizada.");
      return;
    }
    if (isOsConcluida) {
      alert("Não é possível remover peças de uma OS concluída.");
      return;
    }

    const confirmar = confirm(
      `Remover esta utilização da OS? ${qtdUsada} unidade(s) serão devolvidas ao estoque. O registro será preservado como inativo.`,
    );
    if (!confirmar) return;

    if (btnRemoverPecaOS) btnRemoverPecaOS.disabled = true;
    let estoqueAnterior = null;
    let estoqueAtualizado = false;
    let trocaDesativada = false;

    try {
      const resUsoAtual = await fetch(
        `${baseUrl}/troca_peca?select=id,id_peca,quantidade&id=eq.${idTroca}&is_active=eq.true`,
        { headers: headersConfig },
      );
      if (!resUsoAtual.ok) throw new Error("Não foi possível confirmar a utilização da peça.");
      const usosAtuais = await resUsoAtual.json();
      if (
        !usosAtuais.length ||
        Number(usosAtuais[0].id_peca) !== idPeca ||
        Number(usosAtuais[0].quantidade) !== qtdUsada
      ) {
        throw new Error("A utilização foi alterada por outro usuário. Atualize a tela e tente novamente.");
      }

      // Ler o saldo atual (inclusive se a peça do catálogo já tiver sido desativada).
      const resPeca = await fetch(
        `${baseUrl}/peca?select=id,qtde&id=eq.${idPeca}`,
        { headers: headersConfig },
      );
      if (!resPeca.ok) throw new Error("Não foi possível consultar o estoque atual.");
      const dadosPeca = await resPeca.json();
      if (!dadosPeca.length) throw new Error("A peça não foi encontrada no estoque.");
      estoqueAnterior = Number(dadosPeca[0].qtde);
      if (!Number.isFinite(estoqueAnterior))
        throw new Error("O saldo atual da peça é inválido.");

      const resAtualizarEstoque = await fetch(`${baseUrl}/peca?id=eq.${idPeca}`, {
        method: "PATCH",
        headers: headersConfig,
        body: JSON.stringify({ qtde: estoqueAnterior + qtdUsada }),
      });
      if (!resAtualizarEstoque.ok)
        throw new Error("Não foi possível devolver a quantidade ao estoque.");
      estoqueAtualizado = true;
      const pecasAtualizadas = await resAtualizarEstoque.json().catch(() => []);
      if (!Array.isArray(pecasAtualizadas) || pecasAtualizadas.length === 0)
        throw new Error("O estoque não retornou confirmação da atualização.");

      const resDesativarTroca = await fetch(
        `${baseUrl}/troca_peca?id=eq.${idTroca}&is_active=eq.true`,
        {
          method: "PATCH",
          headers: headersConfig,
          body: JSON.stringify({ is_active: false }),
        },
      );
      if (!resDesativarTroca.ok)
        throw new Error("Não foi possível remover o vínculo da peça com a OS.");
      const trocasDesativadas = await resDesativarTroca.json().catch(() => []);
      if (!Array.isArray(trocasDesativadas) || trocasDesativadas.length === 0)
        throw new Error("A utilização já foi alterada; a operação foi revertida quando possível.");
      trocaDesativada = true;

      alert("Peça removida da OS e quantidade devolvida ao estoque.");
      modalEditarPeca.style.display = "none";
      await inicializarDados();
    } catch (erro) {
      // Tentativa de compensação caso a atualização do estoque tenha ocorrido,
      // mas a remoção lógica do vínculo tenha falhado.
      if (estoqueAtualizado && !trocaDesativada && estoqueAnterior !== null) {
        try {
          await fetch(`${baseUrl}/peca?id=eq.${idPeca}`, {
            method: "PATCH",
            headers: headersConfig,
            body: JSON.stringify({ qtde: estoqueAnterior }),
          });
        } catch (erroCompensacao) {
          console.error("Falha ao reverter saldo de estoque:", erroCompensacao);
        }
      }
      alert(erro.message || "Erro ao remover a peça da OS.");
    } finally {
      if (btnRemoverPecaOS) btnRemoverPecaOS.disabled = false;
    }
  });

  formEditarPeca?.addEventListener("submit", async (e) => {
    e.preventDefault();
    const idTroca = document.getElementById("editPecaIdTroca").value;
    const idPecaOrig = document.getElementById("editPecaIdOriginal").value;
    const qtdAntiga = Number(
      document.getElementById("editPecaQtdAntiga").value,
    );
    const qtdNova = Number(document.getElementById("editPecaQuantidade").value);

    let estoqueAnterior = null;
    let estoqueAtualizado = false;
    try {
      if (!Number.isFinite(qtdNova) || qtdNova <= 0)
        throw new Error("Informe uma quantidade válida maior que zero.");

      const diferenca = qtdNova - qtdAntiga;
      if (diferenca !== 0) {
        const resPecaAtual = await fetch(
          `${baseUrl}/peca?select=id,qtde&id=eq.${idPecaOrig}`,
          { headers: headersConfig },
        );
        if (!resPecaAtual.ok) throw new Error("Não foi possível consultar o estoque atual.");
        const pecasAtuais = await resPecaAtual.json();
        if (!pecasAtuais.length) throw new Error("A peça não foi encontrada no estoque.");
        estoqueAnterior = Number(pecasAtuais[0].qtde);
        if (!Number.isFinite(estoqueAnterior)) throw new Error("O saldo de estoque é inválido.");
        const novoEstoque = estoqueAnterior - diferenca;
        if (novoEstoque < 0)
          throw new Error("Estoque insuficiente para aumentar a quantidade utilizada.");

        const resEstoque = await fetch(`${baseUrl}/peca?id=eq.${idPecaOrig}`, {
          method: "PATCH",
          headers: headersConfig,
          body: JSON.stringify({ qtde: novoEstoque }),
        });
        if (!resEstoque.ok) throw new Error("Não foi possível atualizar o estoque.");
        estoqueAtualizado = true;
      }

      const res = await fetch(
        `${baseUrl}/troca_peca?id=eq.${idTroca}&is_active=eq.true`,
        {
          method: "PATCH",
          headers: headersConfig,
          body: JSON.stringify({ quantidade: qtdNova }),
        },
      );
      if (!res.ok) throw new Error("Erro ao atualizar a quantidade utilizada.");

      alert("Quantidade atualizada com sucesso!");
      modalEditarPeca.style.display = "none";
      await inicializarDados();
    } catch (err) {
      if (estoqueAtualizado && estoqueAnterior !== null) {
        try {
          await fetch(`${baseUrl}/peca?id=eq.${idPecaOrig}`, {
            method: "PATCH",
            headers: headersConfig,
            body: JSON.stringify({ qtde: estoqueAnterior }),
          });
        } catch (erroCompensacao) {
          console.error("Falha ao reverter ajuste de estoque:", erroCompensacao);
        }
      }
      alert(err.message);
    }
  });

  document
    .getElementById("fecharModalEditarPeca")
    ?.addEventListener("click", () => (modalEditarPeca.style.display = "none"));
  document
    .getElementById("cancelarModalEditarPeca")
    ?.addEventListener("click", () => (modalEditarPeca.style.display = "none"));


  async function executarTrocaDeStatus(chaveStatus, dataInicio, dataFim) {
    const novoStatusId = mapStatusIds[chaveStatus];
    if (!idAberturaAtual || !novoStatusId) return alert("Carregando dados...");

    try {
      const payloadAbertura = {
        id_status: novoStatusId,
        id_usuario_ultima_atualizacao: idUsuarioLogado,
      };

      if (chaveStatus === "concluida") {
        if (dataInicio)
          payloadAbertura.data_abertura = new Date(dataInicio).toISOString();
        if (dataFim)
          payloadAbertura.data_fechamento = new Date(dataFim).toISOString();
        payloadAbertura.id_usuario_conclusao = idUsuarioLogado;
      } else {
        payloadAbertura.data_fechamento = null;
        payloadAbertura.id_usuario_conclusao = null;
      }

      const resPatch = await fetch(
        `${baseUrl}/abertura_ordem_servico?id=eq.${idAberturaAtual}`,
        {
          method: "PATCH",
          headers: headersConfig,
          body: JSON.stringify(payloadAbertura),
        },
      );
      if (!resPatch.ok) throw new Error("Erro ao atualizar status da OS.");

      await fetch(`${baseUrl}/historico_status_ordem_servico`, {
        method: "POST",
        headers: headersConfig,
        body: JSON.stringify({
          id_abertura_ordem_servico: idAberturaAtual,
          id_status_anterior: idStatusAtual,
          id_status_novo: novoStatusId,
          id_usuario_responsavel: idUsuarioLogado,
          observacao: "Status atualizado.",
        }),
      });

      alert("Status atualizado com sucesso!");
      window.location.reload();
    } catch (erro) {
      alert(erro.message);
    }
  }

  botoesStatus.forEach((btn) =>
    btn.addEventListener("click", (e) =>
      executarTrocaDeStatus(e.target.getAttribute("data-status")),
    ),
  );

  if (btnCancelarOS)
    btnCancelarOS.addEventListener(
      "click",
      () =>
        confirm("Deseja cancelar esta OS?") &&
        executarTrocaDeStatus("cancelada"),
    );

  if (btnFinalizarOS && modalEncerrar) {
    btnFinalizarOS.addEventListener("click", () => {
      if (arrayAtividadesGlobal.length === 0) {
        return alert(
          "Não é possível finalizar a OS: Nenhuma atividade cadastrada.",
        );
      }
      const todasConcluidas = arrayAtividadesGlobal.every((a) => {
        const descStatus = a.status_atividade?.descricao?.toLowerCase() || "";
        return (
          descStatus.includes("conclu") || descStatus.includes("concluída")
        );
      });
      if (!todasConcluidas) {
        return alert(
          "Não é possível finalizar a OS: Todas as atividades devem estar marcadas como Concluídas.",
        );
      }
      modalEncerrar.style.display = "flex";
    });

    document
      .getElementById("cancelarModal")
      .addEventListener("click", () => (modalEncerrar.style.display = "none"));

    formFinalizarOS.addEventListener("submit", (e) => {
      e.preventDefault();
      const dInicio = document.getElementById("encerraDataInicio").value;
      const dFim = document.getElementById("encerraDataFim").value;
      modalEncerrar.style.display = "none";
      executarTrocaDeStatus("concluida", dInicio, dFim);
    });
  }

  inicializarDados();
});

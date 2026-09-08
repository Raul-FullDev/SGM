document.addEventListener("DOMContentLoaded", () => {
  const baseUrl = "https://umvtsquzpugempndwitx.supabase.co/rest/v1";
  const apiKey = "sb_publishable_58JIZcrwwFjp2gnEPPVZeg_tkrJ-LHb";
  const headersConfig = {
    "Content-Type": "application/json",
    apikey: apiKey,
    Authorization: `Bearer ${apiKey}`,
    Prefer: "return=representation",
  };

  const sessaoStr = localStorage.getItem("sgm_sessao");
  if (!sessaoStr) return;

  const sessao = JSON.parse(sessaoStr);
  const papel = sessao.id_papel;
  const idUsuarioLogado = sessao.id;

  const urlParams = new URLSearchParams(window.location.search);
  const idOsUrl = urlParams.get("id");

  const botoesStatus = document.querySelectorAll(".opcao-status");
  const btnCancelarOS = document.getElementById("cancelarOS");
  const btnFinalizarOS = document.getElementById("finalizarOS");
  const modalEncerrar = document.getElementById("modalEncerrarOS");

  const btnAdicionarAtividade = document.getElementById("adicionarAtividade");
  const modalNovaAtividade = document.getElementById("modalNovaAtividade");
  const formNovaAtividade = document.getElementById("formNovaAtividade");
  const selectTipoServico = document.getElementById("atividadeTipoServico");
  const selectStatusAtividade = document.getElementById("atividadeStatus");

  const modalEditarAtividade = document.getElementById("modalEditarAtividade");
  const formEditarAtividade = document.getElementById("formEditarAtividade");
  const editTipoServico = document.getElementById("editAtividadeTipoServico");
  const editStatusAtividade = document.getElementById("editAtividadeStatus");
  const filtroTipoAtividade = document.getElementById("filtroTipoAtividade");
  const containerListaAtividades = document.getElementById(
    "containerListaAtividades",
  );
  let arrayAtividadesGlobal = [];

  const btnAdicionarPeca = document.getElementById("adicionarPeca");
  const modalNovaPeca = document.getElementById("modalNovaPeca");
  const formNovaPeca = document.getElementById("formNovaPeca");
  const selectPeca = document.getElementById("pecaSelecionada");

  let idAberturaAtual = null;
  let idStatusAtual = null;
  const mapStatusIds = {};

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

        if (os) {
          document.querySelector(".numero-os").textContent =
            `OS #${String(os.id).padStart(4, "0")}`;
          document.querySelector(".informacoes-grid").innerHTML = `
            <div class="informacao"><span class="informacao-label">EQUIPAMENTO</span><strong>${os.equipamento?.descricao || "-"}</strong></div>
            <div class="informacao"><span class="informacao-label">ASSET</span><strong>${os.equipamento?.asset || "-"}</strong></div>
            <div class="informacao"><span class="informacao-label">SETOR</span><strong>${os.equipamento?.local?.setor || "-"}</strong></div>
            <div class="informacao"><span class="informacao-label">TIPO</span><strong>${os.tipo_manutencao?.descricao || "-"}</strong></div>
            <div class="informacao"><span class="informacao-label">SOLICITANTE</span><strong>${os.usuario?.nome || "-"}</strong></div>
            <div class="informacao"><span class="informacao-label">TÉCNICO</span><strong>Admin</strong></div>
            <div class="informacao"><span class="informacao-label">ABERTURA</span><strong>${abertura.data_abertura ? new Date(abertura.data_abertura).toLocaleDateString("pt-BR") : "-"}</strong></div>
            <div class="informacao"><span class="informacao-label">FECHAMENTO</span><strong>${abertura.data_fechamento ? new Date(abertura.data_fechamento).toLocaleDateString("pt-BR") : "—"}</strong></div>
          `;
          document.querySelector(".descricao-problema p").textContent =
            os.descricao_problema || "Sem descrição";
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
      if (filtroTipoAtividade)
        filtroTipoAtividade.innerHTML =
          '<option value="todos">Todos os tipos</option>';
      tipos.forEach((t) => {
        selectTipoServico.innerHTML += `<option value="${t.id}">${t.tipo}</option>`;
        editTipoServico.innerHTML += `<option value="${t.id}">${t.tipo}</option>`;
        if (filtroTipoAtividade)
          filtroTipoAtividade.innerHTML += `<option value="${t.id}">${t.tipo}</option>`;
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

      if (selectPeca) {
        const resPecas = await fetch(
          `${baseUrl}/peca?select=id,descricao,custo_unitario,qtde&is_active=eq.true&order=descricao.asc`,
          { headers: headersConfig },
        );
        const pecasData = await resPecas.json();
        window.pecasGlobal = pecasData;
        selectPeca.innerHTML = '<option value="">Selecione a peça...</option>';
        pecasData.forEach((p) => {
          selectPeca.innerHTML += `<option value="${p.id}">[Estoque: ${p.qtde}] ${p.descricao} - R$ ${p.custo_unitario.toFixed(2)}</option>`;
        });
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
      const query = `select=id,servico,data_inicio,data_fechamento,tipo_servico(id,tipo),status_atividade(id,descricao)&id_abertura_ordem_servico=eq.${idAberturaAtual}&order=id.asc`;
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

      const isConcluida =
        status.toLowerCase().includes("conclu") ||
        status.toLowerCase().includes("concluída");
      if (isConcluida) {
        classeConcluida = "concluida";
        iconeNumero = '<i class="bi bi-check"></i>';
      }

      // Se estiver concluída, o botão do lápis não é gerado (some)
      const botaoLapisHTML = isConcluida
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

  async function carregarPecasDaOS() {
    try {
      const query = `select=id,quantidade,custo_unitario_na_troca,peca(descricao),atividade!inner(id_abertura_ordem_servico)&atividade.id_abertura_ordem_servico=eq.${idAberturaAtual}`;
      const res = await fetch(`${baseUrl}/troca_peca?${query}`, {
        headers: headersConfig,
      });
      if (!res.ok) throw new Error("Erro ao buscar peças");

      const trocas = await res.json();
      const tbody = document.querySelector(".tabela-pecas tbody");
      const tfootTotal = document.querySelector(
        ".tabela-pecas tfoot td:last-child strong",
      );

      if (!tbody) return;
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
        tbody.innerHTML += `
          <tr>
              <td>${t.peca?.descricao || "-"}</td>
              <td>${t.quantidade}</td>
              <td>R$ ${t.custo_unitario_na_troca.toFixed(2)}</td>
              <td><strong>R$ ${totalItem.toFixed(2)}</strong></td>
              <td class="acao-peca">
                <button type="button" class="botao-editar-peca" data-id="${t.id}" data-qtd="${t.quantidade}" title="Editar quantidade da peça">
                  <i class="bi bi-pencil"></i>
                </button>
              </td>
          </tr>
        `;
      });
      if (tfootTotal) tfootTotal.textContent = `R$ ${totalOS.toFixed(2)}`;
    } catch (erro) {
      console.error("Falha ao carregar peças:", erro);
    }
  }

  document
    .querySelector(".tabela-pecas")
    ?.addEventListener("click", async (e) => {
      const btnPeca = e.target.closest(".botao-editar-peca");
      if (!btnPeca) return;
      const idTroca = btnPeca.getAttribute("data-id");
      const qtdAtual = btnPeca.getAttribute("data-qtd");

      const novaQtd = prompt(
        "Informe a nova quantidade utilizada para esta peça:",
        qtdAtual,
      );
      if (novaQtd === null || isNaN(novaQtd) || Number(novaQtd) <= 0) return;

      try {
        const res = await fetch(`${baseUrl}/troca_peca?id=eq.${idTroca}`, {
          method: "PATCH",
          headers: headersConfig,
          body: JSON.stringify({ quantidade: Number(novaQtd) }),
        });
        if (!res.ok) throw new Error("Erro ao atualizar a quantidade da peça.");
        alert("Quantidade atualizada com sucesso!");
        carregarPecasDaOS();
      } catch (err) {
        alert(err.message);
      }
    });

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

  async function executarTrocaDeStatus(chaveStatus) {
    const novoStatusId = mapStatusIds[chaveStatus];
    if (!idAberturaAtual || !novoStatusId) return alert("Carregando dados...");

    // Validação restritiva solicitada para Finalizar OS (concluida)
    if (chaveStatus === "concluida") {
      if (arrayAtividadesGlobal.length === 0) {
        return alert(
          "Não é possível finalizar a OS pois ela não possui nenhuma atividade cadastrada.",
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
          "Todas as atividades devem estar concluídas para que a OS possa ser finalizada.",
        );
      }
    }

    try {
      const payloadAbertura = {
        id_status: novoStatusId,
        id_usuario_ultima_atualizacao: idUsuarioLogado,
      };
      if (chaveStatus === "concluida") {
        payloadAbertura.data_fechamento = new Date().toISOString();
        payloadAbertura.id_usuario_conclusao = idUsuarioLogado;
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
          "Não é possível finalizar a OS pois ela não possui nenhuma atividade cadastrada.",
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
          "Todas as atividades devem estar concluídas para que a OS possa ser finalizada.",
        );
      }
      modalEncerrar.style.display = "flex";
    });
    document
      .getElementById("cancelarModal")
      .addEventListener("click", () => (modalEncerrar.style.display = "none"));
    document
      .getElementById("confirmarEncerramento")
      .addEventListener("click", () => {
        modalEncerrar.style.display = "none";
        executarTrocaDeStatus("concluida");
      });
  }

  if (btnAdicionarAtividade)
    btnAdicionarAtividade.addEventListener(
      "click",
      () => (modalNovaAtividade.style.display = "flex"),
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

  if (btnAdicionarPeca)
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
      modalNovaPeca.style.display = "flex";
    });
  document
    .getElementById("fecharModalPeca")
    ?.addEventListener("click", () => (modalNovaPeca.style.display = "none"));
  document
    .getElementById("cancelarModalPeca")
    ?.addEventListener("click", () => (modalNovaPeca.style.display = "none"));

  inicializarDados();
});

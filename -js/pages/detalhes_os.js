document.addEventListener("DOMContentLoaded", () => {
  const baseUrl = "https://umvtsquzpugempndwitx.supabase.co/rest/v1";
  const apiKey = "sb_publishable_58JIZcrwwFjp2gnEPPVZeg_tkrJ-LHb";
  const headersConfig = {
    "Content-Type": "application/json",
    apikey: apiKey,
    Authorization: `Bearer ${apiKey}`,
    Prefer: "return=minimal",
  };

  const botoesStatus = document.querySelectorAll(".opcao-status");
  const btnCancelarOS = document.getElementById("cancelarOS");
  const btnFinalizarOS = document.getElementById("finalizarOS");
  const modalEncerrar = document.getElementById("modalEncerrarOS");

  const btnAdicionarAtividade = document.getElementById("adicionarAtividade");
  const modalNovaAtividade = document.getElementById("modalNovaAtividade");
  const formNovaAtividade = document.getElementById("formNovaAtividade");
  const selectTipoServico = document.getElementById("atividadeTipoServico");
  const selectStatusAtividade = document.getElementById("atividadeStatus");

  // Elementos Edição de Atividade
  const modalEditarAtividade = document.getElementById("modalEditarAtividade");
  const formEditarAtividade = document.getElementById("formEditarAtividade");
  const editTipoServico = document.getElementById("editAtividadeTipoServico");
  const editStatusAtividade = document.getElementById("editAtividadeStatus");
  const filtroTipoAtividade = document.getElementById("filtroTipoAtividade");
  const containerListaAtividades = document.getElementById(
    "containerListaAtividades",
  );
  let arrayAtividadesGlobal = [];

  // Elementos Peças (SGM-234)
  const btnAdicionarPeca = document.getElementById("adicionarPeca");
  const modalNovaPeca = document.getElementById("modalNovaPeca");
  const formNovaPeca = document.getElementById("formNovaPeca");
  const selectPeca = document.getElementById("pecaSelecionada");

  let idAberturaAtual = null;
  let idStatusAtual = null;
  let idUsuarioLogado = null;

  const mapStatusIds = {
    aberta: null,
    andamento: null,
    cancelada: null,
    concluida: null,
  };

  // ==========================================
  // 1. CARREGAR DADOS INICIAIS DA PÁGINA
  // ==========================================
  async function inicializarDados() {
    try {
      const resOs = await fetch(
        `${baseUrl}/abertura_ordem_servico?select=id,id_status&order=id.desc&limit=1`,
        { headers: headersConfig },
      );
      const dadosOs = await resOs.json();
      if (dadosOs.length > 0) {
        idAberturaAtual = dadosOs[0].id;
        idStatusAtual = dadosOs[0].id_status;
      }

      const resUser = await fetch(`${baseUrl}/usuario?select=id&limit=1`, {
        headers: headersConfig,
      });
      const dadosUser = await resUser.json();
      if (dadosUser.length > 0) idUsuarioLogado = dadosUser[0].id;

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

      const resTipos = await fetch(`${baseUrl}/tipo_servico?select=id,tipo`, {
        headers: headersConfig,
      });
      const tipos = await resTipos.json();
      selectTipoServico.innerHTML =
        '<option value="">Selecione o tipo</option>';
      editTipoServico.innerHTML = '<option value="">Selecione o tipo</option>';
      filtroTipoAtividade.innerHTML =
        '<option value="todos">Todos os tipos</option>';

      tipos.forEach((t) => {
        selectTipoServico.innerHTML += `<option value="${t.id}">${t.tipo}</option>`;
        editTipoServico.innerHTML += `<option value="${t.id}">${t.tipo}</option>`;
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

      // Carregar Peças Dinamicamente (SGM-234)
      const resPecas = await fetch(
        `${baseUrl}/peca?select=id,descricao,custo_unitario,qtde&is_active=eq.true&order=descricao.asc`,
        { headers: headersConfig },
      );
      const pecasData = await resPecas.json();
      window.pecasGlobal = pecasData; // Guarda para validarmos o estoque na hora de salvar

      if (selectPeca) {
        selectPeca.innerHTML = '<option value="">Selecione a peça...</option>';
        pecasData.forEach((p) => {
          selectPeca.innerHTML += `<option value="${p.id}">[Estoque: ${p.qtde}] ${p.descricao} - R$ ${p.custo_unitario.toFixed(2)}</option>`;
        });
      }

      if (idAberturaAtual) {
        carregarAtividadesDaOS();
        carregarPecasDaOS(); // Renderiza a tabela de peças utilizadas
      }
    } catch (e) {
      console.error("Erro ao inicializar dados:", e);
    }
  }

  // ==========================================
  // 2. BUSCAR E RENDERIZAR ATIVIDADES
  // ==========================================
  async function carregarAtividadesDaOS() {
    try {
      const query = `select=id,servico,tipo_servico(id,tipo),status_atividade(id,descricao)&id_abertura_ordem_servico=eq.${idAberturaAtual}&order=id.asc`;
      const resposta = await fetch(`${baseUrl}/atividade?${query}`, {
        method: "GET",
        headers: headersConfig,
      });
      if (!resposta.ok) throw new Error("Erro ao buscar atividades");

      arrayAtividadesGlobal = await resposta.json();
      renderizarAtividades(arrayAtividadesGlobal);
    } catch (erro) {
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

      if (status.toLowerCase().includes("conclu")) {
        classeConcluida = "concluida";
        iconeNumero = '<i class="bi bi-check"></i>';
      }

      containerListaAtividades.innerHTML += `
            <div class="atividade ${classeConcluida}">
                <span class="atividade-numero">${iconeNumero}</span>
                <div class="atividade-info">
                    <div class="atividade-conteudo">
                    <span class="atividade-texto">${descricao}</span>
                    <span class="atividade-tipo">Tipo: ${tipo}</span>
                    </div>
                    <span class="atividade-status">${status}</span>
                    <button type="button" class="botao-editar-atividade" data-id="${ativ.id}" aria-label="Editar atividade">
                      <i class="bi bi-pencil"></i>
                    </button>
                </div>
            </div>
          `;
    });
  }

  filtroTipoAtividade?.addEventListener("change", (e) => {
    const val = e.target.value;
    if (val === "todos") renderizarAtividades(arrayAtividadesGlobal);
    else
      renderizarAtividades(
        arrayAtividadesGlobal.filter((a) => a.tipo_servico?.id === Number(val)),
      );
  });

  // ==========================================
  // 3. BUSCAR E RENDERIZAR PEÇAS (SGM-234)
  // ==========================================
  async function carregarPecasDaOS() {
    try {
      // O "!inner" garante que trazemos apenas as peças vinculadas às atividades desta OS específica
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
                        <button type="button" class="botao-editar-peca" data-id="${t.id}" aria-label="Editar peça">
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

  // ==========================================
  // 4. NOVA PEÇA E ATUALIZAÇÃO DE ESTOQUE (SGM-234)
  // ==========================================
  if (btnAdicionarPeca) {
    btnAdicionarPeca.addEventListener("click", () => {
      // Precisamos vincular a peça a uma atividade que o técnico executou
      if (arrayAtividadesGlobal.length === 0) {
        return alert(
          "Atenção: Você precisa cadastrar ao menos uma Atividade antes de registrar uma Peça!",
        );
      }

      const selectAtiv = document.getElementById("pecaAtividadeVinculada");
      selectAtiv.innerHTML =
        '<option value="">Selecione a atividade referente...</option>';
      arrayAtividadesGlobal.forEach((a) => {
        selectAtiv.innerHTML += `<option value="${a.id}">${a.servico}</option>`;
      });

      modalNovaPeca.style.display = "flex";
    });
  }

  document
    .getElementById("fecharModalPeca")
    ?.addEventListener("click", () => (modalNovaPeca.style.display = "none"));
  document
    .getElementById("cancelarModalPeca")
    ?.addEventListener("click", () => (modalNovaPeca.style.display = "none"));

  formNovaPeca?.addEventListener("submit", async (e) => {
    e.preventDefault();
    const idPeca = Number(document.getElementById("pecaSelecionada").value);
    const qtdUsada = Number(document.getElementById("pecaQuantidade").value);
    const idAtiv = Number(
      document.getElementById("pecaAtividadeVinculada").value,
    );

    const peca = window.pecasGlobal.find((p) => p.id === idPeca);
    if (!peca) return alert("Peça não encontrada no sistema.");

    // Validação de Estoque (Evita Erro 400 do Banco de Dados)
    if (qtdUsada > peca.qtde) {
      return alert(
        `ESTOQUE INSUFICIENTE: Você tentou usar ${qtdUsada} unidades, mas temos apenas ${peca.qtde} no estoque.`,
      );
    }

    const btnSubmit = formNovaPeca.querySelector('button[type="submit"]');
    const txtOriginal = btnSubmit.innerHTML;
    btnSubmit.innerHTML = "Baixando Estoque...";
    btnSubmit.disabled = true;

    try {
      // 1. INSERE O USO DA PEÇA NA OS
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

      // 2. ATUALIZA O ESTOQUE DA PEÇA (A INTEGRAÇÃO DO SGM-234 ACONTECE AQUI)
      const novoEstoque = peca.qtde - qtdUsada;
      const resEstoque = await fetch(`${baseUrl}/peca?id=eq.${idPeca}`, {
        method: "PATCH",
        headers: headersConfig,
        body: JSON.stringify({ qtde: novoEstoque }),
      });
      if (!resEstoque.ok)
        throw new Error("Erro crítico ao dar baixa no estoque.");

      alert("Peça adicionada e estoque atualizado com sucesso!");
      modalNovaPeca.style.display = "none";
      formNovaPeca.reset();

      // Recarrega tudo para atualizar os Dropdowns com o novo estoque
      inicializarDados();
    } catch (erro) {
      console.error(erro);
      alert(erro.message);
    } finally {
      btnSubmit.innerHTML = txtOriginal;
      btnSubmit.disabled = false;
    }
  });

  // ==========================================
  // 5. ABRIR E SALVAR EDIÇÃO DA ATIVIDADE (O Lápis)
  // ==========================================
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

    const btnSubmit = formEditarAtividade.querySelector(
      'button[type="submit"]',
    );
    const txtOriginal = btnSubmit.innerHTML;
    btnSubmit.innerHTML = "Salvando...";
    btnSubmit.disabled = true;

    try {
      const payload = {
        servico: descNova,
        id_tipo_servico: Number(tipoNovo),
        id_status: Number(statusNovo),
        id_usuario_ultima_atualizacao: idUsuarioLogado,
      };
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
            observacao: "Status alterado via pop-up de edição.",
          }),
        });
      }
      alert("Atividade atualizada com sucesso!");
      modalEditarAtividade.style.display = "none";
      carregarAtividadesDaOS();
    } catch (erro) {
      console.error(erro);
      alert(erro.message);
    } finally {
      btnSubmit.innerHTML = txtOriginal;
      btnSubmit.disabled = false;
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

  // ==========================================
  // 6. ATUALIZAR STATUS DA OS
  // ==========================================
  async function executarTrocaDeStatus(chaveStatus) {
    const novoStatusId = mapStatusIds[chaveStatus];
    if (!idAberturaAtual || !idUsuarioLogado || !novoStatusId)
      return alert("Sistema carregando...");
    if (novoStatusId === idStatusAtual)
      return alert("Esta OS já se encontra neste status.");

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
      if (!resPatch.ok) throw new Error("Erro Supabase (PATCH OS)");

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
      alert("Status da OS atualizado com sucesso!");
      window.location.reload();
    } catch (erro) {
      alert(erro.message);
    }
  }

  // ==========================================
  // 7. REGISTRAR NOVA ATIVIDADE
  // ==========================================
  formNovaAtividade?.addEventListener("submit", async (e) => {
    e.preventDefault();
    if (!idAberturaAtual || !idUsuarioLogado)
      return alert("Aguarde o carregamento...");

    const dataInicioVal = document.getElementById("atividadeDataInicio").value;
    const dataFimVal = document.getElementById("atividadeDataFim").value;
    if (
      dataInicioVal &&
      dataFimVal &&
      new Date(dataFimVal) <= new Date(dataInicioVal)
    )
      return alert("A data/hora de fim deve ser MAIOR que a de início.");

    const btnSubmit = formNovaAtividade.querySelector('button[type="submit"]');
    const txtOriginal = btnSubmit.innerHTML;
    btnSubmit.innerHTML = "Salvando...";
    btnSubmit.disabled = true;

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
        headers: { ...headersConfig, Prefer: "return=representation" },
        body: JSON.stringify(payloadAtividade),
      });
      if (!resAtiv.ok) throw new Error("Erro ao salvar Atividade no banco.");

      const novaAtividadeCriada = await resAtiv.json();

      if (dataInicioVal && dataFimVal) {
        await fetch(`${baseUrl}/sessao_atividade`, {
          method: "POST",
          headers: headersConfig,
          body: JSON.stringify({
            id_atividade: novaAtividadeCriada[0].id,
            id_usuario_tecnico: idUsuarioLogado,
            data_inicio_sessao: new Date(dataInicioVal).toISOString(),
            data_fim_sessao: new Date(dataFimVal).toISOString(),
            observacao: "Apontamento inicial.",
          }),
        });
      }
      alert("Atividade registrada com sucesso!");
      modalNovaAtividade.style.display = "none";
      formNovaAtividade.reset();
      carregarAtividadesDaOS();
    } catch (erro) {
      alert(erro.message);
    } finally {
      btnSubmit.innerHTML = txtOriginal;
      btnSubmit.disabled = false;
    }
  });

  botoesStatus.forEach((btn) =>
    btn.addEventListener("click", (e) =>
      executarTrocaDeStatus(e.target.getAttribute("data-status")),
    ),
  );
  if (btnCancelarOS)
    btnCancelarOS.addEventListener(
      "click",
      () =>
        confirm("Tem certeza que deseja cancelar?") &&
        executarTrocaDeStatus("cancelada"),
    );
  if (btnFinalizarOS && modalEncerrar) {
    btnFinalizarOS.addEventListener(
      "click",
      () => (modalEncerrar.style.display = "flex"),
    );
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

  inicializarDados();
});

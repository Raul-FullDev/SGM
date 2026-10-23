document.addEventListener("DOMContentLoaded", () => {
  const baseUrl = "https://umvtsquzpugempndwitx.supabase.co/rest/v1";
  const apiKey = "sb_publishable_58JIZcrwwFjp2gnEPPVZeg_tkrJ-LHb";
  const headersConfig = {
    "Content-Type": "application/json",
    apikey: apiKey,
    Prefer: "return=representation",
  };

  const form = document.querySelector(".maintenance-form");
  const selectEquip = document.getElementById("equipamento");
  const selectTipo = document.getElementById("tipo-manutencao");
  const selectPeriodicidade = document.getElementById("periodicidade");
  const campoPeriodo = document.getElementById("periodo");
  const labelPeriodo = document.querySelector('label[for="periodo"]');
  const ajudaPeriodo = document.getElementById("periodo-ajuda");
  const campoDataInicio = document.getElementById("data-inicio");
  const campoProximaExecucao = document.getElementById("proxima-execucao");
  const campoUltimaExecucao = document.getElementById("ultima-execucao");
  const btnSubmit = form.querySelector(".btn-register");

  const urlParams = new URLSearchParams(window.location.search);
  const idPlanoEdicao = urlParams.get("id");
  const datasOriginais = { inicio: "", proxima: "" };
  const datasAlteradas = { inicio: false, proxima: false };
  const ultimosValoresValidos = { inicio: "", proxima: "" };
  let tiposManutencaoFonte = [];
  let tiposManutencaoUnicos = [];
  let periodicidadesFonte = [];
  let periodicidadesUnicas = [];

  function normalizarTexto(valor) {
    return String(valor || "")
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .replace(/\s+/g, " ")
      .trim();
  }

  // Catálogos podem conter registros ativos com nomes repetidos. Mantém um
  // único rótulo por opção e prefere o menor ID como registro canônico.
  function deduplicarPorDescricao(registros, campoDescricao = "descricao") {
    const vistos = new Set();
    return [...registros]
      .sort((a, b) => Number(a.id) - Number(b.id))
      .filter((registro) => {
        const chave = normalizarTexto(registro[campoDescricao]);
        if (!chave || vistos.has(chave)) return false;
        vistos.add(chave);
        return true;
      });
  }

  function hojeISO() {
    const hoje = new Date();
    const ano = hoje.getFullYear();
    const mes = String(hoje.getMonth() + 1).padStart(2, "0");
    const dia = String(hoje.getDate()).padStart(2, "0");
    return `${ano}-${mes}-${dia}`;
  }

  function ehTipoPermitido(descricao) {
    const nome = normalizarTexto(descricao);
    return nome.includes("preventiv") || nome.includes("corretiv");
  }

  function obterUnidadePeriodo(descricao) {
    const nome = normalizarTexto(descricao);

    if (nome.includes("diar") || nome === "dia") {
      return { singular: "dia", plural: "dias" };
    }
    if (nome.includes("seman")) {
      return { singular: "semana", plural: "semanas" };
    }
    if (nome.includes("bimestr")) {
      return { singular: "bimestre", plural: "bimestres" };
    }
    if (nome.includes("trimestr")) {
      return { singular: "trimestre", plural: "trimestres" };
    }
    if (nome.includes("semestr")) {
      return { singular: "semestre", plural: "semestres" };
    }
    if (nome.includes("anual") || nome === "ano" || nome.includes("anualment")) {
      return { singular: "ano", plural: "anos" };
    }
    if (nome.includes("mensal") || nome === "mes" || nome.includes("mens")) {
      return { singular: "mês", plural: "meses" };
    }

    return { singular: "período", plural: "períodos" };
  }

  function atualizarUnidadePeriodo() {
    const opcao = selectPeriodicidade.options[selectPeriodicidade.selectedIndex];
    const unidade = obterUnidadePeriodo(opcao ? opcao.textContent : "");
    labelPeriodo.innerHTML = `Período (${unidade.plural}) <span>*</span>`;
    campoPeriodo.placeholder = `Ex.: 1`;
    ajudaPeriodo.textContent = `Informe a quantidade de ${unidade.plural} entre as execuções.`;
  }

  async function buscarJSON(url, mensagemErro) {
    const resposta = await fetch(url, { headers: headersConfig });
    if (!resposta.ok) {
      const detalhe = await resposta.text();
      throw new Error(`${mensagemErro}${detalhe ? `: ${detalhe}` : "."}`);
    }
    return resposta.json();
  }

  async function carregarDropdowns() {
    const [equipamentos, tipos, periodicidades] = await Promise.all([
      buscarJSON(
        `${baseUrl}/equipamento?select=id,descricao,asset&order=descricao.asc`,
        "Erro ao carregar equipamentos",
      ),
      buscarJSON(
        `${baseUrl}/tipo_manutencao?select=id,descricao&is_active=eq.true&order=id.asc`,
        "Erro ao carregar tipos de manutenção",
      ),
      buscarJSON(
        `${baseUrl}/periocidade?select=id,descricao&is_active=eq.true&order=id.asc`,
        "Erro ao carregar periodicidades",
      ),
    ]);

    selectEquip.innerHTML = '<option value="">Selecione o equipamento...</option>';
    equipamentos.forEach((equipamento) => {
      const option = document.createElement("option");
      option.value = String(equipamento.id);
      option.textContent = `[${equipamento.asset || "Sem código"}] ${equipamento.descricao}`;
      selectEquip.appendChild(option);
    });

    tiposManutencaoFonte = tipos.filter((tipo) => ehTipoPermitido(tipo.descricao));
    tiposManutencaoUnicos = deduplicarPorDescricao(tiposManutencaoFonte);
    selectTipo.innerHTML = '<option value="">Selecione Preventivo ou Corretivo...</option>';
    tiposManutencaoUnicos.forEach((tipo) => {
      const option = document.createElement("option");
      option.value = String(tipo.id);
      option.textContent = tipo.descricao;
      selectTipo.appendChild(option);
    });
    if (tiposManutencaoUnicos.length === 0) {
      selectTipo.innerHTML = '<option value="">Nenhum tipo preventivo ou corretivo ativo encontrado</option>';
    }

    periodicidadesFonte = periodicidades;
    periodicidadesUnicas = deduplicarPorDescricao(periodicidadesFonte);
    selectPeriodicidade.innerHTML = '<option value="">Selecione a periodicidade...</option>';
    periodicidadesUnicas.forEach((periodicidade) => {
      const option = document.createElement("option");
      option.value = String(periodicidade.id);
      option.textContent = periodicidade.descricao;
      selectPeriodicidade.appendChild(option);
    });

    atualizarUnidadePeriodo();
  }

  function configurarMinimoData(campo, chave) {
    const hoje = hojeISO();
    const original = datasOriginais[chave];
    campo.min = original && original < hoje && !datasAlteradas[chave] ? original : hoje;
  }

  function configurarProtecaoData(campo, chave, nomeCampo) {
    campo.addEventListener("change", () => {
      const valor = campo.value;
      const hoje = hojeISO();
      const original = datasOriginais[chave];
      const podeManterDataHistorica =
        !datasAlteradas[chave] && original && valor === original && original < hoje;

      if (valor && valor < hoje && !podeManterDataHistorica) {
        alert(`${nomeCampo} não pode ser anterior à data de hoje.`);
        campo.value = ultimosValoresValidos[chave] || (original || hoje);
        return;
      }

      if (valor !== original) datasAlteradas[chave] = true;
      ultimosValoresValidos[chave] = valor;
      configurarMinimoData(campo, chave);
    });
  }

  configurarProtecaoData(campoDataInicio, "inicio", "A data de início");
  configurarProtecaoData(campoProximaExecucao, "proxima", "A próxima execução");
  selectPeriodicidade.addEventListener("change", atualizarUnidadePeriodo);

  async function carregarPlanoParaEdicao() {
    if (!idPlanoEdicao) {
      const hoje = hojeISO();
      campoDataInicio.value = hoje;
      campoProximaExecucao.value = hoje;
      campoDataInicio.min = hoje;
      campoProximaExecucao.min = hoje;
      campoUltimaExecucao.max = hoje;
      ultimosValoresValidos.inicio = hoje;
      ultimosValoresValidos.proxima = hoje;
      return;
    }

    document.querySelector(".page-title h1").textContent = "Editar Plano de Manutenção";
    document.querySelector(".breadcrumb strong").textContent = "Editar Plano";
    btnSubmit.textContent = "Salvar Alterações";

    const planos = await buscarJSON(
      `${baseUrl}/plano_manutencao?id=eq.${encodeURIComponent(idPlanoEdicao)}`,
      "Erro ao buscar os dados do plano",
    );

    if (planos.length === 0) throw new Error("Plano de manutenção não encontrado.");

    const plano = planos[0];
    document.getElementById("descricao").value = plano.descricao || "";
    campoPeriodo.value = plano.periodo ?? "";
    campoDataInicio.value = plano.data_inicio ? plano.data_inicio.split("T")[0] : "";
    campoProximaExecucao.value = plano.data_proxima_execucao
      ? plano.data_proxima_execucao.split("T")[0]
      : "";
    campoUltimaExecucao.value = plano.data_ultima_execucao
      ? plano.data_ultima_execucao.split("T")[0]
      : "";
    document.getElementById("observacoes").value = plano.observacao || "";

    selectEquip.value = String(plano.id_equipamento);

    // Se um plano antigo apontar para um registro duplicado, seleciona o
    // registro canônico com a mesma descrição. Ao salvar, o vínculo fica
    // normalizado sem exibir opções repetidas.
    const tipoAnterior = tiposManutencaoFonte.find(
      (tipo) => String(tipo.id) === String(plano.id_tipo_manutencao),
    );
    const tipoCanonico = tipoAnterior
      ? tiposManutencaoUnicos.find(
          (tipo) => normalizarTexto(tipo.descricao) === normalizarTexto(tipoAnterior.descricao),
        )
      : null;
    selectTipo.value = tipoCanonico ? String(tipoCanonico.id) : "";

    const periodicidadeAnterior = periodicidadesFonte.find(
      (item) => String(item.id) === String(plano.id_periocidade),
    );
    const periodicidadeCanonica = periodicidadeAnterior
      ? periodicidadesUnicas.find(
          (item) => normalizarTexto(item.descricao) === normalizarTexto(periodicidadeAnterior.descricao),
        )
      : null;
    selectPeriodicidade.value = periodicidadeCanonica
      ? String(periodicidadeCanonica.id)
      : "";

    datasOriginais.inicio = campoDataInicio.value;
    datasOriginais.proxima = campoProximaExecucao.value;
    ultimosValoresValidos.inicio = campoDataInicio.value;
    ultimosValoresValidos.proxima = campoProximaExecucao.value;
    configurarMinimoData(campoDataInicio, "inicio");
    configurarMinimoData(campoProximaExecucao, "proxima");
    campoUltimaExecucao.max = hojeISO();
    atualizarUnidadePeriodo();
  }

  form.addEventListener("submit", async (event) => {
    event.preventDefault();

    const hoje = hojeISO();
    const dataInicio = campoDataInicio.value;
    const dataProxima = campoProximaExecucao.value;
    const ultimaExecucao = campoUltimaExecucao.value;
    const periodo = Number(campoPeriodo.value);

    const inicioHistoricoSemAlteracao =
      datasOriginais.inicio &&
      dataInicio === datasOriginais.inicio &&
      datasOriginais.inicio < hoje &&
      !datasAlteradas.inicio;
    const proximaHistoricaSemAlteracao =
      datasOriginais.proxima &&
      dataProxima === datasOriginais.proxima &&
      datasOriginais.proxima < hoje &&
      !datasAlteradas.proxima;

    if (!Number.isInteger(periodo) || periodo < 1) {
      alert("O período deve ser um número inteiro maior que zero, na unidade indicada pela periodicidade.");
      campoPeriodo.focus();
      return;
    }

    if (dataInicio < hoje && !inicioHistoricoSemAlteracao) {
      alert("A data de início não pode ser anterior à data de hoje.");
      campoDataInicio.focus();
      return;
    }

    if (dataProxima < hoje && !proximaHistoricaSemAlteracao) {
      alert("A próxima execução não pode ser anterior à data de hoje.");
      campoProximaExecucao.focus();
      return;
    }

    if (dataProxima < dataInicio) {
      alert("A próxima execução não pode ser anterior à data de início do plano.");
      campoProximaExecucao.focus();
      return;
    }

    if (ultimaExecucao && ultimaExecucao > hoje) {
      alert("A última execução não pode estar no futuro.");
      campoUltimaExecucao.focus();
      return;
    }

    if (!selectTipo.value || !ehTipoPermitido(selectTipo.options[selectTipo.selectedIndex]?.textContent)) {
      alert("Selecione um tipo de manutenção Preventivo ou Corretivo.");
      selectTipo.focus();
      return;
    }

    if (!selectPeriodicidade.value) {
      alert("Selecione uma periodicidade válida.");
      selectPeriodicidade.focus();
      return;
    }

    const payload = {
      descricao: document.getElementById("descricao").value.trim(),
      id_equipamento: Number(selectEquip.value),
      id_tipo_manutencao: Number(selectTipo.value),
      id_periocidade: Number(selectPeriodicidade.value),
      periodo,
      data_inicio: dataInicio,
      data_proxima_execucao: dataProxima,
      data_ultima_execucao: ultimaExecucao || null,
      observacao: document.getElementById("observacoes").value.trim() || null,
    };

    const textoOriginal = btnSubmit.textContent;
    btnSubmit.textContent = "Processando...";
    btnSubmit.disabled = true;

    try {
      if (idPlanoEdicao) {
        const resposta = await fetch(
          `${baseUrl}/plano_manutencao?id=eq.${encodeURIComponent(idPlanoEdicao)}`,
          {
            method: "PATCH",
            headers: headersConfig,
            body: JSON.stringify(payload),
          },
        );
        if (!resposta.ok) throw new Error(`Falha ao atualizar o plano: ${await resposta.text()}`);
        alert("Plano atualizado com sucesso!");
      } else {
        const resposta = await fetch(`${baseUrl}/plano_manutencao`, {
          method: "POST",
          headers: headersConfig,
          body: JSON.stringify(payload),
        });
        if (!resposta.ok) throw new Error(`Falha ao cadastrar o plano: ${await resposta.text()}`);
        alert("Plano cadastrado com sucesso!");
      }

      window.location.href = "manutencao_adm.html";
    } catch (erro) {
      console.error("Erro ao salvar o plano de manutenção:", erro);
      alert(erro.message || "Não foi possível salvar o plano.");
      btnSubmit.textContent = textoOriginal;
      btnSubmit.disabled = false;
    }
  });

  async function inicializarTela() {
    try {
      await carregarDropdowns();
      await carregarPlanoParaEdicao();
    } catch (erro) {
      console.error("Erro ao inicializar o formulário de manutenção:", erro);
      alert(erro.message || "Erro ao carregar o formulário de manutenção.");
    }
  }

  inicializarTela();
});

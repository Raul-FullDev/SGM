document.addEventListener("DOMContentLoaded", () => {

  const baseUrl = "https://umvtsquzpugempndwitx.supabase.co/rest/v1";
  const apiKey = "sb_publishable_58JIZcrwwFjp2gnEPPVZeg_tkrJ-LHb";
  const headersConfig = {
    "Content-Type": "application/json",
    apikey: apiKey,
    Authorization: `Bearer ${apiKey}`,
    Prefer: "return=minimal",
  };

  const form = document.querySelector(".maintenance-form");
  const selectEquip = document.getElementById("equipamento");
  const selectTipo = document.getElementById("tipo-manutencao");
  const selectPeriocidade = document.getElementById("periodicidade");
  const btnSubmit = form.querySelector(".btn-register");

  const urlParams = new URLSearchParams(window.location.search);
  const idPlanoEdicao = urlParams.get("id");

  async function carregarDropdowns() {
    
    try {
      const resEq = await fetch(
        `${baseUrl}/equipamento?select=id,descricao,asset`,
        { headers: headersConfig },
      );
      const eqs = await resEq.json();
      selectEquip.innerHTML =
        '<option value="">Selecione o equipamento...</option>';
      eqs.forEach(
        (e) =>
          (selectEquip.innerHTML += `<option value="${e.id}">[${e.asset}] ${e.descricao}</option>`),
      );

      const resTipo = await fetch(
        `${baseUrl}/tipo_manutencao?select=id,descricao`,
        { headers: headersConfig },
      );
      const tipos = await resTipo.json();
      selectTipo.innerHTML = '<option value="">Selecione o tipo...</option>';
      tipos.forEach(
        (t) =>
          (selectTipo.innerHTML += `<option value="${t.id}">${t.descricao}</option>`),
      );

      const resPer = await fetch(`${baseUrl}/periocidade?select=id,descricao`, {
        headers: headersConfig,
      });
      const pers = await resPer.json();
      selectPeriocidade.innerHTML =
        '<option value="">Selecione a periodicidade...</option>';
      pers.forEach(
        (p) =>
          (selectPeriocidade.innerHTML += `<option value="${p.id}">${p.descricao}</option>`),
      );
    } catch (erro) {
      console.error("Erro ao carregar opções do banco:", erro);
    }
  }


  async function carregarPlanoParaEdicao() {
    if (!idPlanoEdicao) {

      const hoje = new Date();
      const ano = hoje.getFullYear();
      const mes = String(hoje.getMonth() + 1).padStart(2, "0");
      const dia = String(hoje.getDate()).padStart(2, "0");
      const dataFormatada = `${ano}-${mes}-${dia}`;

      document.getElementById("data-inicio").value = dataFormatada;
      document.getElementById("proxima-execucao").value = dataFormatada;

      return; 
    }


    document.querySelector(".page-title h1").textContent =
      "Editar Plano de Manutenção";
    document.querySelector(".breadcrumb strong").textContent = "Editar Plano";
    btnSubmit.innerHTML = "Salvar Alterações";

    try {
      const resposta = await fetch(
        `${baseUrl}/plano_manutencao?id=eq.${idPlanoEdicao}`,
        { headers: headersConfig },
      );
      const planos = await resposta.json();

      if (planos.length > 0) {
        const p = planos[0];

        document.getElementById("descricao").value = p.descricao;
        document.getElementById("periodo").value = p.periodo;
        document.getElementById("data-inicio").value = p.data_inicio
          ? p.data_inicio.split("T")[0]
          : "";
        document.getElementById("proxima-execucao").value =
          p.data_proxima_execucao;
        document.getElementById("ultima-execucao").value =
          p.data_ultima_execucao || "";
        document.getElementById("observacoes").value = p.observacao || "";

        selectEquip.value = p.id_equipamento;
        selectTipo.value = p.id_tipo_manutencao;
        selectPeriocidade.value = p.id_periocidade;
      }
    } catch (erro) {
      console.error("Erro ao carregar plano para edição:", erro);
      alert("Erro ao buscar os dados do plano.");
    }
  }


  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const textoOriginal = btnSubmit.innerHTML;
    btnSubmit.innerHTML = "Processando...";
    btnSubmit.disabled = true;


    const payload = {
      descricao: document.getElementById("descricao").value,
      id_equipamento: Number(selectEquip.value),
      id_tipo_manutencao: Number(selectTipo.value),
      id_periocidade: Number(selectPeriocidade.value),
      periodo: Number(document.getElementById("periodo").value),
      data_inicio: document.getElementById("data-inicio").value,
      data_proxima_execucao: document.getElementById("proxima-execucao").value,
      observacao: document.getElementById("observacoes").value || null,
    };

    const ultimaExec = document.getElementById("ultima-execucao").value;
    if (ultimaExec) {
      payload.data_ultima_execucao = ultimaExec;
    }

    try {
      if (idPlanoEdicao) {
        const resPatch = await fetch(
          `${baseUrl}/plano_manutencao?id=eq.${idPlanoEdicao}`,
          {
            method: "PATCH",
            headers: headersConfig,
            body: JSON.stringify(payload),
          },
        );
        if (!resPatch.ok) throw new Error("Falha ao atualizar o plano.");
        alert("Plano atualizado com sucesso!");
      } else {
        const resPost = await fetch(`${baseUrl}/plano_manutencao`, {
          method: "POST",
          headers: headersConfig,
          body: JSON.stringify(payload),
        });
        if (!resPost.ok) throw new Error("Falha ao cadastrar o novo plano.");
        alert("Plano cadastrado com sucesso!");
      }

      window.location.href = "manutencao_adm.html";
    } catch (err) {
      console.error(err);
      alert(err.message);
      btnSubmit.innerHTML = textoOriginal;
      btnSubmit.disabled = false;
    }
  });

  async function inicializarTela() {
    await carregarDropdowns();
    await carregarPlanoParaEdicao();
  }

  inicializarTela();
});

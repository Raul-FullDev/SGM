document.addEventListener("DOMContentLoaded", () => {
  
  const baseUrl = "https://umvtsquzpugempndwitx.supabase.co/rest/v1";
  const apiKey = "sb_publishable_58JIZcrwwFjp2gnEPPVZeg_tkrJ-LHb";

  const headersConfig = {
    "Content-Type": "application/json",
    apikey: apiKey,
    Prefer: "return=representation",
  };

  const selectEquipamento = document.getElementById("equipamento");
  const selectTipoManutencao = document.getElementById("tipoManutencao");

  function normalizarTexto(valor) {
    return String(valor || "")
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .replace(/\s+/g, " ")
      .trim();
  }

  function deduplicarPorDescricao(registros) {
    const vistos = new Set();
    return [...registros]
      .sort((a, b) => Number(a.id) - Number(b.id))
      .filter((registro) => {
        const chave = normalizarTexto(registro.descricao);
        if (!chave || vistos.has(chave)) return false;
        vistos.add(chave);
        return true;
      });
  }

  function ehTipoPermitido(descricao) {
    const nome = normalizarTexto(descricao);
    return nome.includes("preventiv") || nome.includes("corretiv");
  }

  async function carregarTiposManutencao() {
    try {
      const resposta = await fetch(
        `${baseUrl}/tipo_manutencao?select=id,descricao&is_active=eq.true&order=id.asc`,
        { headers: headersConfig },
      );
      if (!resposta.ok) throw new Error(await resposta.text());

      const tipos = deduplicarPorDescricao(
        (await resposta.json()).filter((tipo) => ehTipoPermitido(tipo.descricao)),
      );
      selectTipoManutencao.innerHTML = '<option value="">Selecione Preventivo ou Corretivo...</option>';

      tipos.forEach((tipo) => {
        const option = document.createElement("option");
        option.value = String(tipo.id);
        option.textContent = tipo.descricao;
        selectTipoManutencao.appendChild(option);
      });

      if (tipos.length === 0) {
        selectTipoManutencao.innerHTML = '<option value="">Nenhum tipo preventivo ou corretivo ativo foi encontrado</option>';
      }
    } catch (erro) {
      console.error("Falha ao buscar tipos de manutenção:", erro);
      selectTipoManutencao.innerHTML = '<option value="">Erro ao carregar tipos de manutenção</option>';
    }
  }

  async function carregarEquipamentos() {
    try {
      const resposta = await fetch(
        `${baseUrl}/equipamento?select=id,descricao,asset&is_active=eq.true&order=descricao.asc`,
        {
          method: "GET",
          headers: headersConfig,
        },
      );

      if (!resposta.ok)
        throw new Error("Erro ao carregar equipamentos do banco.");

      const equipamentos = await resposta.json();

      selectEquipamento.innerHTML =
        '<option value="">Selecione um equipamento...</option>';

      equipamentos.forEach((eq) => {
        selectEquipamento.innerHTML += `<option value="${eq.id}">${eq.descricao} - ${eq.asset}</option>`;
      });
    } catch (erro) {
      console.error("Falha ao buscar equipamentos:", erro);
      selectEquipamento.innerHTML =
        '<option value="">Erro ao carregar equipamentos</option>';
    }
  }

  carregarEquipamentos();
  carregarTiposManutencao();

  document
    .getElementById("formularioOrdemServico")
    .addEventListener("submit", async function (event) {
      event.preventDefault();

      const sessaoStr = localStorage.getItem("sgm_sessao");
      const sessao = sessaoStr ? JSON.parse(sessaoStr) : null;
      const idUsuarioLogado = sessao ? sessao.id : 1;

      const idEquipamento = selectEquipamento.value;
      const tipoManutencao = document.getElementById("tipoManutencao").value;
      const descricaoProblema =
        document.getElementById("descricaoProblema").value;

      const prioridadePadrao = "Média";
      const idStatusAberta = 1;

      const btnSubmit = document.getElementById("criarOrdemButton");
      const txtOriginal = btnSubmit.innerHTML;
      btnSubmit.innerHTML = "Criando...";
      btnSubmit.disabled = true;

      try {
        const novaOrdemServico = {
          descricao_problema: descricaoProblema,
          prioridade: prioridadePadrao,
          id_usuario_solicitante: idUsuarioLogado,
          id_tipo_manutencao: Number(tipoManutencao),
          id_equipamento: Number(idEquipamento),
        };

        const responseOs = await fetch(`${baseUrl}/ordem_servico`, {
          method: "POST",
          headers: headersConfig,
          body: JSON.stringify(novaOrdemServico),
        });

        if (!responseOs.ok) throw new Error(await responseOs.text());

        const dadosOs = await responseOs.json();
        const idOsGerada = dadosOs[0].id;
        console.log("Passo 1 OK! OS gerada ID:", idOsGerada);

        const novaAbertura = {
          id_ordem_servico: idOsGerada,
          id_status: idStatusAberta,
          id_usuario_responsavel: idUsuarioLogado,
          id_usuario_ultima_atualizacao: idUsuarioLogado,
        };

        const responseAbertura = await fetch(
          `${baseUrl}/abertura_ordem_servico`,
          {
            method: "POST",
            headers: headersConfig,
            body: JSON.stringify(novaAbertura),
          },
        );

        if (!responseAbertura.ok)
          throw new Error(await responseAbertura.text());

        const dadosAbertura = await responseAbertura.json();
        const idAberturaGerada = dadosAbertura[0].id;
        console.log("Passo 2 OK! Abertura gerada ID:", idAberturaGerada);

        const novoHistorico = {
          id_abertura_ordem_servico: idAberturaGerada,
          id_status_novo: idStatusAberta,
          id_usuario_responsavel: idUsuarioLogado,
          observacao: "Ordem de serviço aberta pelo sistema.",
        };

        const responseHistorico = await fetch(
          `${baseUrl}/historico_status_ordem_servico`,
          {
            method: "POST",
            headers: headersConfig,
            body: JSON.stringify(novoHistorico),
          },
        );

        if (!responseHistorico.ok)
          throw new Error(await responseHistorico.text());

        console.log("Passo 3 OK! Histórico registrado.");

        alert("Ordem de Serviço criada com sucesso!");
        window.location.href = "todas_os.html";
      } catch (erro) {
        console.error("Erro na integração com Supabase:", erro);
        alert("Ocorreu um erro ao abrir a OS. Verifique o console.");
        btnSubmit.innerHTML = txtOriginal;
        btnSubmit.disabled = false;
      }
    });
});

document.addEventListener("DOMContentLoaded", () => {
  const baseUrl = "https://umvtsquzpugempndwitx.supabase.co/rest/v1";
  const apiKey = "sb_publishable_58JIZcrwwFjp2gnEPPVZeg_tkrJ-LHb";
  const headersConfig = {
    "Content-Type": "application/json",
    apikey: apiKey,
    Authorization: `Bearer ${apiKey}`,
    Prefer: "return=representation",
  };

  const listaPlanos = document.querySelector(".plans-list");

  // ==========================================
  // BUSCAR E RENDERIZAR PLANOS NO BANCO
  // ==========================================
  async function carregarPlanos() {
    try {
      listaPlanos.innerHTML =
        '<p style="text-align: center; padding: 30px; color: #6f82a0;">Carregando planos de manutenção...</p>';

      // Busca os planos trazendo junto as descrições via Foreign Key
      const query = `select=*,equipamento(id,descricao),tipo_manutencao(id,descricao),periocidade(id,descricao)&order=data_proxima_execucao.asc`;
      const resposta = await fetch(`${baseUrl}/plano_manutencao?${query}`, {
        headers: headersConfig,
      });

      if (!resposta.ok) throw new Error("Erro ao buscar planos do Supabase.");

      const planos = await resposta.json();
      renderizarPlanos(planos);
    } catch (erro) {
      console.error(erro);
      listaPlanos.innerHTML =
        '<p style="text-align: center; padding: 30px; color: #d9534f;">Erro ao carregar os planos. Verifique o console.</p>';
    }
  }

  function renderizarPlanos(planos) {
    listaPlanos.innerHTML = "";

    if (planos.length === 0) {
      listaPlanos.innerHTML =
        '<p style="text-align: center; padding: 30px; color: #6f82a0;">Nenhum plano cadastrado no momento.</p>';
      return;
    }

    // Data atual com as horas zeradas para fazer o cálculo correto
    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);

    planos.forEach((plano) => {
      const equip = plano.equipamento?.descricao || "Sem equipamento";
      const tipo = plano.tipo_manutencao?.descricao || "Outro";
      const periocidade = plano.periocidade?.descricao || "-";

      const ultima = plano.data_ultima_execucao || "Inédita";
      const proxima = plano.data_proxima_execucao;

      // Calcula os dias restantes
      const dataProx = new Date(proxima);
      const dataProxFormatada = new Date(
        dataProx.getTime() + Math.abs(dataProx.getTimezoneOffset() * 60000),
      );
      dataProxFormatada.setHours(0, 0, 0, 0);

      const diffTime = dataProxFormatada - hoje;
      const diasRestantes = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      // Lógica de cores inteligente
      let corDestaque = "#6459ff"; // Azul padrão
      if (diasRestantes < 0)
        corDestaque = "#cf5555"; // Atrasado (Vermelho)
      else if (diasRestantes <= 7) corDestaque = "#e69a22"; // Próximo da data (Laranja)

      const article = document.createElement("article");
      article.className = "plan-card";
      article.innerHTML = `
                <div class="plan-info">
                    <h2>${plano.descricao}</h2>
                    <p>${equip} · ${tipo} · ${periocidade}</p>
                </div>

                <div class="plan-column">
                    <span>ÚLTIMA</span>
                    <strong>${ultima}</strong>
                </div>

                <div class="plan-column">
                    <span>PRÓXIMA</span>
                    <strong class="next" style="color: ${corDestaque};">${proxima}</strong>
                </div>

                <div class="plan-column">
                    <span>RESTAM</span>
                    <strong class="remaining" style="color: ${corDestaque};">${diasRestantes}d</strong>
                </div>

                <div class="plan-actions">
                    <button class="btn-edit" type="button" data-id="${plano.id}">Editar</button>
                    <button class="btn-os" type="button" data-id="${plano.id}" data-equip="${plano.id_equipamento}" data-tipo="${plano.id_tipo_manutencao}" data-desc="${plano.descricao}">Gerar OS</button>
                </div>
            `;
      listaPlanos.appendChild(article);
    });
  }

  // ==========================================
  // DELEGAÇÃO DE EVENTOS (BOTÕES DA LISTA)
  // ==========================================
  listaPlanos.addEventListener("click", async (e) => {
    // AÇÃO: REDIRECIONAR PARA EDIÇÃO
    if (e.target.classList.contains("btn-edit")) {
      const idPlano = e.target.getAttribute("data-id");
      // Manda o ID pela URL para a tela de criação/edição carregar os dados
      window.location.href = `novo_plano_manutencao_adm.html?id=${idPlano}`;
    }

    // AÇÃO: GERAR ORDEM DE SERVIÇO AUTOMATICAMENTE
    if (e.target.classList.contains("btn-os")) {
      const idPlano = e.target.getAttribute("data-id");
      const idEquip = e.target.getAttribute("data-equip");
      const idTipo = e.target.getAttribute("data-tipo");
      const descPlano = e.target.getAttribute("data-desc");

      if (
        !confirm(
          `Deseja gerar uma Ordem de Serviço agora para o plano: "${descPlano}"?`,
        )
      )
        return;

      const btn = e.target;
      const textoOriginal = btn.innerHTML;
      btn.innerHTML = "Gerando...";
      btn.disabled = true;

      try {
        // 1. Insere a OS Principal
        const payloadOS = {
          descricao_problema: `Manutenção Programada: ${descPlano}`,
          prioridade: "media",
          id_usuario_solicitante: 1, // Mock: Admin Sistema
          id_tipo_manutencao: Number(idTipo),
          id_equipamento: Number(idEquip),
          id_plano_manutencao: Number(idPlano),
        };

        const resOs = await fetch(`${baseUrl}/ordem_servico`, {
          method: "POST",
          headers: headersConfig,
          body: JSON.stringify(payloadOS),
        });
        if (!resOs.ok) throw new Error("Erro ao criar a Ordem de Serviço.");

        const osCriada = await resOs.json();
        const idOSGerada = osCriada[0].id;

        // 2. Insere a Abertura da OS
        const payloadAbertura = {
          id_ordem_servico: idOSGerada,
          id_status: 1, // Aberta
          id_usuario_responsavel: 1,
          id_usuario_ultima_atualizacao: 1,
        };

        const resAbertura = await fetch(`${baseUrl}/abertura_ordem_servico`, {
          method: "POST",
          headers: headersConfig,
          body: JSON.stringify(payloadAbertura),
        });
        if (!resAbertura.ok)
          throw new Error("Erro ao vincular a abertura da OS.");

        alert(
          `Ordem de Serviço gerada com sucesso! Verifique a aba de Ordens de Serviço.`,
        );
      } catch (erro) {
        console.error(erro);
        alert("Falha na geração da OS: " + erro.message);
      } finally {
        btn.innerHTML = textoOriginal;
        btn.disabled = false;
      }
    }
  });

  carregarPlanos();
});

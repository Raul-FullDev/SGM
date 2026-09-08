document.addEventListener("DOMContentLoaded", () => {
  const baseUrl = "https://umvtsquzpugempndwitx.supabase.co/rest/v1";
  const apiKey = "sb_publishable_58JIZcrwwFjp2gnEPPVZeg_tkrJ-LHb";
  const headersConfig = {
    "Content-Type": "application/json",
    apikey: apiKey,
    Authorization: `Bearer ${apiKey}`,
  };

  const sessaoStr = localStorage.getItem("sgm_sessao");
  if (!sessaoStr) return;

  async function carregarDashboard() {
    try {
      const resEq = await fetch(
        `${baseUrl}/equipamento?select=id,status&is_active=eq.true`,
        {
          headers: headersConfig,
        },
      );
      const equipamentos = await resEq.json();

      let totalEq = equipamentos.length;
      let eqAtivos = 0;
      let eqManutencao = 0;
      let eqInativos = 0;

      equipamentos.forEach((eq) => {
        const statusEq = (eq.status || "").toLowerCase();
        if (statusEq.includes("manuten")) eqManutencao++;
        else if (statusEq.includes("inativ")) eqInativos++;
        else eqAtivos++;
      });

      document.querySelector(
        '.card-dashboard[data-card="equipamentos"] h2',
      ).textContent = totalEq;
      document.querySelector(
        '.card-dashboard[data-card="equipamentos-manutencao"] h2',
      ).textContent = eqManutencao;

      const listaStatus = document.getElementById("listaStatus");
      if (listaStatus) {
        listaStatus.innerHTML = `
          <div class="status-item">
            <span>Ativos</span>
            <strong>${eqAtivos}</strong>
          </div>
          <div class="status-item">
            <span>Em Manutenção</span>
            <strong>${eqManutencao}</strong>
          </div>
          <div class="status-item">
            <span>Inativos</span>
            <strong>${eqInativos}</strong>
          </div>
        `;
      }

      const resOs = await fetch(
        `${baseUrl}/ordem_servico?select=id,created_at,descricao_problema,abertura_ordem_servico(status_ordem_servico(descricao))&order=id.desc`,
        { headers: headersConfig },
      );
      const ordens = await resOs.json();

      let osPendentes = 0;

      ordens.forEach((os) => {
        const abertura =
          os.abertura_ordem_servico && os.abertura_ordem_servico.length > 0
            ? os.abertura_ordem_servico[0]
            : null;
        const statusDesc =
          abertura?.status_ordem_servico?.descricao?.toLowerCase() || "aberta";

        if (
          statusDesc.includes("aberta") ||
          statusDesc.includes("andamento") ||
          statusDesc.includes("pendente")
        ) {
          osPendentes++;
        }
      });

      document.querySelector(
        '.card-dashboard[data-card="ordens"] h2',
      ).textContent = ordens.length;
      document.querySelector(
        '.card-dashboard[data-card="manutencoes-pendentes"] h2',
      ).textContent = osPendentes;

      const recentes = ordens.slice(0, 4);
      const listaOrdens = document.getElementById("listaOrdens");
      listaOrdens.innerHTML = "";

      if (recentes.length === 0) {
        listaOrdens.innerHTML =
          '<p style="text-align: center; color: #8b9ab1; font-size: 11px; padding: 20px;">Nenhuma Ordem de Serviço cadastrada.</p>';
      } else {
        recentes.forEach((os) => {
          const anoOs = new Date(os.created_at).getFullYear();
          const numOs = `OS-${anoOs}-${String(os.id).padStart(4, "0")}`;
          const descricao = os.descricao_problema || "Manutenção geral";

          const abertura =
            os.abertura_ordem_servico && os.abertura_ordem_servico.length > 0
              ? os.abertura_ordem_servico[0]
              : null;
          const statusDesc =
            abertura?.status_ordem_servico?.descricao || "Aberta";
          const stLower = statusDesc.toLowerCase();

          let classeStatus = "status-pendente"; // Amarelo
          if (stLower.includes("andamento"))
            classeStatus = "status-andamento"; // Azul
          else if (stLower.includes("concluid") || stLower.includes("encerrad"))
            classeStatus = "status-concluida"; // Verde

          listaOrdens.innerHTML += `
            <div class="ordem-item" data-os-id="${os.id}" style="cursor: pointer;" onclick="window.location.href='detalhes_os.html?id=${os.id}'">
              <div>
                <strong>${numOs}</strong>
                <p>${descricao.substring(0, 45)}${descricao.length > 45 ? "..." : ""}</p>
              </div>
              <span class="${classeStatus}">${statusDesc}</span>
            </div>
          `;
        });
      }

      const dataHoje = new Date().toISOString().split("T")[0];
      const resPlanos = await fetch(
        `${baseUrl}/plano_manutencao?select=descricao,data_proxima_execucao,equipamento(descricao)&data_proxima_execucao=gte.${dataHoje}&order=data_proxima_execucao.asc&limit=4`,
        { headers: headersConfig },
      );
      const planos = await resPlanos.json();

      const listaManut = document.getElementById("listaManutencoes");
      listaManut.innerHTML = "";

      if (planos.length === 0) {
        listaManut.innerHTML =
          '<p style="text-align: center; color: #8b9ab1; font-size: 11px; padding: 20px;">Nenhuma manutenção programada.</p>';
      } else {
        planos.forEach((pl) => {
          const equipDesc = pl.equipamento?.descricao || "Equipamento";
          const planoDesc = pl.descricao || "Manutenção programada";

          const dataIso = new Date(pl.data_proxima_execucao);

          const dataCorrigida = new Date(
            dataIso.getTime() + Math.abs(dataIso.getTimezoneOffset() * 60000),
          );
          const diaMes = `${String(dataCorrigida.getDate()).padStart(2, "0")}/${String(dataCorrigida.getMonth() + 1).padStart(2, "0")}`;

          listaManut.innerHTML += `
            <div class="manutencao-item">
              <div>
                <strong>${equipDesc}</strong>
                <p>${planoDesc}</p>
              </div>
              <span>${diaMes}</span>
            </div>
          `;
        });
      }
    } catch (erro) {
      console.error("Erro ao carregar Dashboard:", erro);
    }
  }

  carregarDashboard();
});

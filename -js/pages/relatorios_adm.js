document.addEventListener("DOMContentLoaded", () => {
  const baseUrl = "https://umvtsquzpugempndwitx.supabase.co/rest/v1";
  const apiKey = "sb_publishable_58JIZcrwwFjp2gnEPPVZeg_tkrJ-LHb";
  const headersConfig = {
    "Content-Type": "application/json",
    apikey: apiKey,
  };

  function normalizarTexto(valor) {
    return String(valor || "")
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase();
  }

  function formatarPeriodo(periodo, descricaoPeriodicidade) {
    const nome = normalizarTexto(descricaoPeriodicidade);
    let unidade = "períodos";
    if (nome.includes("diar") || nome === "dia") unidade = Number(periodo) === 1 ? "dia" : "dias";
    else if (nome.includes("seman")) unidade = Number(periodo) === 1 ? "semana" : "semanas";
    else if (nome.includes("bimestr")) unidade = Number(periodo) === 1 ? "bimestre" : "bimestres";
    else if (nome.includes("trimestr")) unidade = Number(periodo) === 1 ? "trimestre" : "trimestres";
    else if (nome.includes("semestr")) unidade = Number(periodo) === 1 ? "semestre" : "semestres";
    else if (nome.includes("anual") || nome === "ano") unidade = Number(periodo) === 1 ? "ano" : "anos";
    else if (nome.includes("mens") || nome === "mes") unidade = Number(periodo) === 1 ? "mês" : "meses";
    return `${periodo} ${unidade}`;
  }

  function exportarCSV(colunasVisiveis, chavesDados, dados, nomeArquivo) {
    let csvContent = "data:text/csv;charset=utf-8,\uFEFF"; 

    csvContent += colunasVisiveis.join(";") + "\n";

    dados.forEach((row) => {
      const linha = chavesDados
        .map((chave) => {
          let valor =
            row[chave] === null || row[chave] === undefined
              ? ""
              : String(row[chave]);
          return `"${valor.replace(/"/g, '""')}"`;
        })
        .join(";");
      csvContent += linha + "\n";
    });

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `${nomeArquivo}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  function exportarPDF(
    titulo,
    colunasVisiveis,
    chavesDados,
    dados,
    nomeArquivo,
  ) {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();

    doc.setFontSize(16);
    doc.text(titulo, 14, 15);
    doc.setFontSize(10);
    doc.text(`Gerado em: ${new Date().toLocaleDateString("pt-BR")}`, 14, 22);

    const linhas = dados.map((row) =>
      chavesDados.map((chave) => row[chave] || ""),
    );

    doc.autoTable({
      head: [colunasVisiveis],
      body: linhas,
      startY: 28,
      theme: "grid",
      headStyles: { fillColor: [33, 85, 220] },
      styles: { fontSize: 9 },
    });

    doc.save(`${nomeArquivo}.pdf`);
  }

  async function processarRelatorio(
    tipoRelatorio,
    formatoExportacao,
    botaoClicado,
  ) {
    const textoOriginal = botaoClicado.innerText;
    botaoClicado.innerText = "Gerando...";
    botaoClicado.disabled = true;

    let dados = [];
    let colunasVisiveis = [];
    let chavesDados = [];
    let tituloPDF = "";
    let nomeArquivo = `SGM_${tipoRelatorio}_${new Date().getTime()}`;

    try {
      switch (tipoRelatorio) {
        case "os-periodo":
          const resOs = await fetch(
            `${baseUrl}/ordem_servico?select=id,equipamento(descricao),abertura_ordem_servico(data_abertura,status_ordem_servico(descricao))`,
            { headers: headersConfig },
          );
          const rawOs = await resOs.json();

          tituloPDF = "Relatório de Ordens de Serviço";
          colunasVisiveis = ["OS", "Equipamento", "Data Abertura", "Status"];
          chavesDados = ["os", "equipamento", "data", "status"];

          dados = rawOs.map((os) => {
            const ab = os.abertura_ordem_servico?.[0];
            return {
              os: `OS-${String(os.id).padStart(4, "0")}`,
              equipamento: os.equipamento?.descricao || "-",
              data: ab?.data_abertura
                ? new Date(ab.data_abertura).toLocaleDateString("pt-BR")
                : "-",
              status: ab?.status_ordem_servico?.descricao || "Pendente",
            };
          });
          break;

        case "custo-equipamento":
          const resEquip = await fetch(
            `${baseUrl}/equipamento?select=asset,descricao,status,local(setor)`,
            { headers: headersConfig },
          );
          const rawEquip = await resEquip.json();

          tituloPDF = "Relatório de Equipamentos e Status";
          colunasVisiveis = ["Asset", "Descrição", "Setor", "Status Atual"];
          chavesDados = ["asset", "descricao", "setor", "status"];

          dados = rawEquip.map((eq) => ({
            asset: eq.asset,
            descricao: eq.descricao,
            setor: eq.local?.setor || "-",
            status: eq.status.toUpperCase(),
          }));
          break;

        case "disponibilidade":
          const resDisp = await fetch(
            `${baseUrl}/equipamento?select=descricao,data_aquisicao,status`,
            { headers: headersConfig },
          );
          const rawDisp = await resDisp.json();

          tituloPDF = "Relatório de Disponibilidade de Ativos";
          colunasVisiveis = ["Equipamento", "Data Aquisição", "Condição"];
          chavesDados = ["equipamento", "data", "condicao"];

          dados = rawDisp.map((eq) => ({
            equipamento: eq.descricao,
            data: new Date(eq.data_aquisicao).toLocaleDateString("pt-BR"),
            condicao: eq.status === "ativo" ? "Disponível" : "Indisponível",
          }));
          break;

        case "historico-tecnico":
          let usuarios = [];
          let ultimoErroTecnicos = null;
          let consultaTecnicosValida = false;
          let usuariosSemNivelRelacionado = [];

          for (const relacionamento of ["papel(funcao)", "nivel(funcao)", null]) {
            const parametrosTecnicos = new URLSearchParams({
              select: relacionamento
                ? `nome,matricula,funcao,contato,${relacionamento}`
                : "nome,matricula,funcao,contato",
              order: "nome.asc",
            });
            const respostaTecnicos = await fetch(
              `${baseUrl}/usuario?${parametrosTecnicos.toString()}`,
              { headers: headersConfig },
            );
            if (!respostaTecnicos.ok) {
              ultimoErroTecnicos = new Error(await respostaTecnicos.text());
              continue;
            }

            const resultadoTecnicos = await respostaTecnicos.json();
            consultaTecnicosValida = true;
            if (resultadoTecnicos.length > 0) {
              const possuiNivelRelacionado = resultadoTecnicos.some((usuario) =>
                usuario.papel?.funcao || usuario.nivel?.funcao,
              );
              if (!relacionamento || possuiNivelRelacionado) {
                usuarios = resultadoTecnicos;
                break;
              }
              usuariosSemNivelRelacionado = resultadoTecnicos;
            }
          }

          if (usuarios.length === 0 && usuariosSemNivelRelacionado.length > 0) {
            usuarios = usuariosSemNivelRelacionado;
          }
          if (usuarios.length === 0 && !consultaTecnicosValida && ultimoErroTecnicos) {
            throw ultimoErroTecnicos;
          }
          const rawTec = usuarios
            .filter((usuario) => normalizarTexto(
              usuario.papel?.funcao || usuario.nivel?.funcao || usuario.funcao,
            ).includes("tecnic"))
            .map(({ papel, nivel, ...usuario }) => usuario);

          tituloPDF = "Quadro de Técnicos de Manutenção";
          colunasVisiveis = [
            "Matrícula",
            "Nome do Técnico",
            "Função",
            "Contato",
          ];
          chavesDados = ["matricula", "nome", "funcao", "contato"];

          dados = rawTec;
          break;

        case "consumo-pecas":
          const resPecas = await fetch(
            `${baseUrl}/peca?select=descricao,qtde,custo_unitario&is_active=eq.true`,
            { headers: headersConfig },
          );
          const rawPecas = await resPecas.json();

          tituloPDF = "Relatório de Saldo de Estoque de Peças";
          colunasVisiveis = [
            "Peça",
            "Qtd Estoque",
            "Custo Unitário (R$)",
            "Custo Total (R$)",
          ];
          chavesDados = ["peca", "estoque", "unitario", "total"];

          dados = rawPecas.map((p) => ({
            peca: p.descricao,
            estoque: p.qtde,
            unitario: p.custo_unitario.toFixed(2),
            total: (p.qtde * p.custo_unitario).toFixed(2),
          }));
          break;

        case "plano-preventivo":
          const resPlanos = await fetch(
            `${baseUrl}/plano_manutencao?select=descricao,periodo,data_proxima_execucao,equipamento(descricao),periocidade(descricao)`,
            { headers: headersConfig },
          );
          if (!resPlanos.ok) throw new Error(await resPlanos.text());
          const rawPlanos = await resPlanos.json();

          tituloPDF = "Relatório de Planos de Manutenção";
          colunasVisiveis = [
            "Plano",
            "Equipamento",
            "Intervalo entre execuções",
            "Próxima Execução",
          ];
          chavesDados = ["plano", "equipamento", "periodo", "proxima"];

          dados = rawPlanos.map((pl) => ({
            plano: pl.descricao,
            equipamento: pl.equipamento?.descricao || "-",
            periodo: formatarPeriodo(pl.periodo, pl.periocidade?.descricao),
            proxima: pl.data_proxima_execucao
              ? new Date(pl.data_proxima_execucao).toLocaleDateString("pt-BR")
              : "-",
          }));
          break;

        default:
          throw new Error("Relatório não configurado.");
      }

      if (formatoExportacao === "pdf") {
        exportarPDF(
          tituloPDF,
          colunasVisiveis,
          chavesDados,
          dados,
          nomeArquivo,
        );
      } else if (formatoExportacao === "csv") {
        exportarCSV(colunasVisiveis, chavesDados, dados, nomeArquivo);
      }
    } catch (erro) {
      console.error(erro);
      alert("Erro ao gerar o relatório. Verifique a conexão com o banco.");
    } finally {
      botaoClicado.innerText = textoOriginal;
      botaoClicado.disabled = false;
    }
  }

  document.querySelectorAll(".botao-gerar-relatorio").forEach((botao) => {
    botao.addEventListener("click", (e) => {
      const tipo = e.target.getAttribute("data-relatorio");
      processarRelatorio(tipo, "pdf", e.target);
    });
  });

  document.querySelectorAll(".botao-csv").forEach((botao) => {
    botao.addEventListener("click", (e) => {
      const tipo = e.target.getAttribute("data-relatorio");
      processarRelatorio(tipo, "csv", e.target);
    });
  });
});

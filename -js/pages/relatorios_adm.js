document.addEventListener("DOMContentLoaded", () => {
  const baseUrl = "https://umvtsquzpugempndwitx.supabase.co/rest/v1";
  const apiKey = "sb_publishable_58JIZcrwwFjp2gnEPPVZeg_tkrJ-LHb";
  const headersConfig = {
    "Content-Type": "application/json",
    apikey: apiKey,
    Authorization: `Bearer ${apiKey}`,
  };

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
          const resTec = await fetch(
            `${baseUrl}/usuario?select=nome,matricula,funcao,contato&id_papel=eq.3`,
            { headers: headersConfig },
          );
          const rawTec = await resTec.json();

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
            `${baseUrl}/peca?select=descricao,qtde,custo_unitario`,
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
            `${baseUrl}/plano_manutencao?select=descricao,periodo,data_proxima_execucao,equipamento(descricao)`,
            { headers: headersConfig },
          );
          const rawPlanos = await resPlanos.json();

          tituloPDF = "Relatório de Planos Preventivos";
          colunasVisiveis = [
            "Plano",
            "Equipamento",
            "Período (Dias)",
            "Próxima Execução",
          ];
          chavesDados = ["plano", "equipamento", "periodo", "proxima"];

          dados = rawPlanos.map((pl) => ({
            plano: pl.descricao,
            equipamento: pl.equipamento?.descricao || "-",
            periodo: pl.periodo,
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

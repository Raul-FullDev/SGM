document.addEventListener("DOMContentLoaded", () => {
  // ==========================================
  // CONFIGURAÇÕES DA API SUPABASE
  // ==========================================
  const baseUrl = "https://umvtsquzpugempndwitx.supabase.co/rest/v1";
  const apiKey = "sb_publishable_58JIZcrwwFjp2gnEPPVZeg_tkrJ-LHb";
  const headersConfig = {
    "Content-Type": "application/json",
    apikey: apiKey,
    Authorization: `Bearer ${apiKey}`,
    Prefer: "return=representation",
  };

  // Referências do HTML
  const corpoTabela = document.getElementById("corpoTabelaEquipamentos");
  const inputPesquisa = document.getElementById("pesquisaEquipamento");
  const estadoVazio = document.getElementById("estadoVazio");
  const tabelaContainer = document.querySelector(".tabela-equipamentos");

  // Variável global para guardar os dados na memória (usada pelo filtro)
  let todosEquipamentos = [];

  // ==============================================
  // TAREFA 1: BUSCAR EQUIPAMENTOS + NOME DO SETOR (JOIN)
  // ==============================================
  async function carregarEquipamentos() {
    try {
      // A mágica do JOIN: "local(setor)" pede para a API trazer o campo "setor" da tabela estrangeira
      const resposta = await fetch(
        `${baseUrl}/equipamento?select=*,local(setor)&order=id.asc`,
        {
          method: "GET",
          headers: headersConfig,
        },
      );

      if (!resposta.ok) throw new Error("Erro ao buscar equipamentos");

      // Guarda os dados na memória para o filtro usar depois
      todosEquipamentos = await resposta.json();

      // Manda desenhar a tabela
      renderizarTabela(todosEquipamentos);
    } catch (erro) {
      console.error("Falha ao carregar equipamentos:", erro);
    }
  }

  // ==============================================
  // FUNÇÃO AUXILIAR: DESENHAR A TABELA NO HTML
  // ==============================================
  function renderizarTabela(dados) {
    // Limpa as linhas fixas antigas do HTML
    corpoTabela.innerHTML = "";

    // Controle de Estado Vazio
    if (dados.length === 0) {
      tabelaContainer.style.display = "none";
      estadoVazio.style.display = "flex";
      return;
    }

    tabelaContainer.style.display = "block";
    estadoVazio.style.display = "none";

    // Preenche a tabela
    dados.forEach((eqp) => {
      // Define a classe CSS do status
      let classeStatus = "status-inativo";
      let textoStatus = eqp.status || "ativo";

      if (textoStatus.toLowerCase() === "ativo") {
        classeStatus = "status-ativo";
      } else if (
        textoStatus.toLowerCase() === "manutenção" ||
        textoStatus.toLowerCase() === "manutencao"
      ) {
        classeStatus = "status-manutencao";
        textoStatus = "Manutenção";
      } else {
        textoStatus = "Inativo";
      }

      // Pega o nome do setor (Vindo do JOIN). Se não tiver, previne erro.
      const nomeSetor = eqp.local ? eqp.local.setor : "Sem Setor";

      const tr = document.createElement("tr");
      tr.innerHTML = `
                <td>${eqp.asset}</td>
                <td>${eqp.descricao}</td>
                <td>${eqp.manufaturado} · ${eqp.modelo}</td>
                <td>${nomeSetor}</td>
                <td>${eqp.numero_serie}</td>
                <td>${eqp.data_aquisicao}</td>
                <td>
                    <span class="status ${classeStatus}">${textoStatus.charAt(0).toUpperCase() + textoStatus.slice(1)}</span>
                </td>
            `;
      corpoTabela.appendChild(tr);
    });
  }

  // ==============================================
  // TAREFA 2: FILTRAR O ARRAY AO DIGITAR NA PESQUISA
  // ==============================================
  inputPesquisa.addEventListener("input", (event) => {
    const termo = event.target.value.toLowerCase();

    // Filtra o array salvo na memória
    const dadosFiltrados = todosEquipamentos.filter((eqp) => {
      const asset = eqp.asset ? eqp.asset.toLowerCase() : "";
      const descricao = eqp.descricao ? eqp.descricao.toLowerCase() : "";
      const fabricante = eqp.manufaturado ? eqp.manufaturado.toLowerCase() : "";
      const modelo = eqp.modelo ? eqp.modelo.toLowerCase() : "";
      const setor = eqp.local ? eqp.local.setor.toLowerCase() : "";

      // Retorna TRUE se o texto digitado existir em qualquer uma dessas colunas
      return (
        asset.includes(termo) ||
        descricao.includes(termo) ||
        fabricante.includes(termo) ||
        modelo.includes(termo) ||
        setor.includes(termo)
      );
    });

    // Redesenha a tabela apenas com os dados filtrados
    renderizarTabela(dadosFiltrados);
  });

  // ==============================================
  // INICIALIZAÇÃO
  // ==============================================
  // Inicia a tela buscando os dados do banco
  carregarEquipamentos();
});

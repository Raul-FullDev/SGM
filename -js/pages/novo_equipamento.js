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
  const selectSetor = document.getElementById("setor");
  const formEquipamento = document.getElementById("formEquipamento");

  // ==============================================
  // 1. CARREGAR SETORES NO SELECT (GET)
  // ==============================================
  async function carregarSetores() {
    try {
      const resposta = await fetch(
        `${baseUrl}/local?select=id,setor&is_active=eq.true`,
        {
          method: "GET",
          headers: headersConfig,
        },
      );

      if (!resposta.ok) throw new Error("Erro ao buscar setores.");

      const setores = await resposta.json();

      // Limpa o select e adiciona a opção padrão
      selectSetor.innerHTML = '<option value="">Selecione um setor...</option>';

      // Preenche dinamicamente com os dados do banco
      setores.forEach((local) => {
        const option = document.createElement("option");
        option.value = local.id;
        option.textContent = local.setor;
        selectSetor.appendChild(option);
      });
    } catch (erro) {
      console.error("Falha ao carregar setores:", erro);
      selectSetor.innerHTML =
        '<option value="">Erro ao carregar setores</option>';
    }
  }

  // ==============================================
  // 2. CADASTRAR NOVO EQUIPAMENTO (POST)
  // ==============================================
  formEquipamento.addEventListener("submit", async (event) => {
    event.preventDefault();

    // Monta o objeto com os dados exatos exigidos pelo seu banco de dados
    const novoEquipamento = {
      asset: document.getElementById("asset").value,
      descricao: document.getElementById("descricao").value,
      manufaturado: document.getElementById("fabricante").value,
      modelo: document.getElementById("modelo").value,
      numero_serie: document.getElementById("numeroSerie").value,
      data_aquisicao: document.getElementById("dataAquisicao").value,
      id_local: Number(selectSetor.value), // Converte o ID do select para número
    };

    // Altera o texto do botão para mostrar carregamento
    const btnCadastrar = document.querySelector(".botao-cadastrar");
    const textoOriginalBtn = btnCadastrar.innerHTML;
    btnCadastrar.innerHTML =
      '<i class="bi bi-hourglass-split"></i> Salvando...';
    btnCadastrar.disabled = true;

    try {
      const resposta = await fetch(`${baseUrl}/equipamento`, {
        method: "POST",
        headers: headersConfig,
        body: JSON.stringify(novoEquipamento),
      });

      if (!resposta.ok) {
        const erro = await resposta.json();
        // Verifica se o erro é por violação de UNIQUE (ex: Asset ou Número de Série duplicado)
        if (erro.code === "23505") {
          throw new Error(
            "Este Asset ou Número de Série já está cadastrado no sistema.",
          );
        }
        throw new Error("Erro ao cadastrar equipamento. Verifique o console.");
      }

      alert("Equipamento cadastrado com sucesso!");
      window.location.href = "equipamentos.html"; // Redireciona para a listagem
    } catch (erro) {
      console.error("Falha na integração:", erro);
      alert(erro.message);
    } finally {
      // Restaura o botão
      btnCadastrar.innerHTML = textoOriginalBtn;
      btnCadastrar.disabled = false;
    }
  });

  // Inicializa carregando os setores
  carregarSetores();
});

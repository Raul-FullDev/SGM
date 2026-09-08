document.addEventListener("DOMContentLoaded", () => {
  const baseUrl = "https://umvtsquzpugempndwitx.supabase.co/rest/v1";
  const apiKey = "sb_publishable_58JIZcrwwFjp2gnEPPVZeg_tkrJ-LHb";
  const headersConfig = {
    "Content-Type": "application/json",
    apikey: apiKey,
    Authorization: `Bearer ${apiKey}`,
    Prefer: "return=representation",
  };

  const selectSetor = document.getElementById("setorLocalizacao");
  const formEquipamento = document.getElementById("formularioEquipamento");

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
      selectSetor.innerHTML = '<option value="">Escolha um setor:</option>';

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

  formEquipamento.addEventListener("submit", async (event) => {
    event.preventDefault();

    const novoEquipamento = {
      asset: document.getElementById("codigoAtivo").value,
      status: document.getElementById("statusEquipamento").value,
      descricao: document.getElementById("descricaoEquipamento").value,
      manufaturado: document.getElementById("fabricanteEquipamento").value,
      modelo: document.getElementById("modeloEquipamento").value,
      numero_serie: document.getElementById("numeroSerie").value,
      data_aquisicao: document.getElementById("dataAquisicao").value,
      id_local: Number(selectSetor.value),
    };

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
        if (erro.code === "23505") {
          throw new Error(
            "Este Asset ou Número de Série já está cadastrado no sistema.",
          );
        }
        throw new Error("Erro ao cadastrar equipamento. Verifique o console.");
      }

      alert("Equipamento cadastrado com sucesso!");
      window.location.href = "equipamentos.html";
    } catch (erro) {
      console.error("Falha na integração:", erro);
      alert(erro.message);
    } finally {
      btnCadastrar.innerHTML = textoOriginalBtn;
      btnCadastrar.disabled = false;
    }
  });

  carregarSetores();
});

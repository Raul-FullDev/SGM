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
    Prefer: "return=minimal",
  };

  // Referências do HTML
  const selectCategoria = document.getElementById("categoriaPeca");
  const formPeca = document.getElementById("formularioPeca");

  // CORREÇÃO: Busca no documento inteiro, pois o botão está fora da tag <form>
  const btnCadastrar = document.querySelector(".botao-cadastrar");

  // ==========================================
  // 1. CARREGAR AS CATEGORIAS NO SELECT
  // ==========================================
  async function carregarCategorias() {
    try {
      const resposta = await fetch(
        `${baseUrl}/categoria_peca?select=id,descricao&is_active=eq.true&order=descricao.asc`,
        { headers: headersConfig },
      );

      if (!resposta.ok) throw new Error("Falha ao buscar categorias");

      const categorias = await resposta.json();

      selectCategoria.innerHTML =
        '<option value="">Selecione uma categoria...</option>';
      categorias.forEach((cat) => {
        selectCategoria.innerHTML += `<option value="${cat.id}">${cat.descricao}</option>`;
      });
    } catch (erro) {
      console.error(erro);
      selectCategoria.innerHTML =
        '<option value="">Erro ao carregar categorias</option>';
    }
  }

  // ==========================================
  // 2. SALVAR A NOVA PEÇA NO BANCO
  // ==========================================
  formPeca.addEventListener("submit", async (e) => {
    e.preventDefault();

    const textoOriginal = btnCadastrar.innerHTML;
    btnCadastrar.innerHTML =
      '<i class="bi bi-hourglass-split"></i> Salvando...';
    btnCadastrar.disabled = true;

    const payload = {
      descricao: document.getElementById("descricaoPeca").value,
      id_categoria: Number(selectCategoria.value),
      custo_unitario: Number(document.getElementById("custoUnitario").value),
      qtde: Number(document.getElementById("quantidadeEstoque").value),
      estoque_minimo: Number(document.getElementById("estoqueMinimo").value),
      unidade_medida: document.getElementById("unidadeMedida").value,
    };

    try {
      const resposta = await fetch(`${baseUrl}/peca`, {
        method: "POST",
        headers: headersConfig,
        body: JSON.stringify(payload),
      });

      if (!resposta.ok)
        throw new Error("Erro ao cadastrar a peça no banco de dados.");

      alert("Peça cadastrada com sucesso!");
      window.location.href = "pecas_adm.html";
    } catch (erro) {
      console.error(erro);
      alert(erro.message);
    } finally {
      btnCadastrar.innerHTML = textoOriginal;
      btnCadastrar.disabled = false;
    }
  });

  carregarCategorias();
});

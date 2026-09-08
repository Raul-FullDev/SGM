document.addEventListener("DOMContentLoaded", () => {
  const baseUrl = "https://umvtsquzpugempndwitx.supabase.co/rest/v1";
  const apiKey = "sb_publishable_58JIZcrwwFjp2gnEPPVZeg_tkrJ-LHb";
  const headersConfig = {
    "Content-Type": "application/json",
    apikey: apiKey,
    Authorization: `Bearer ${apiKey}`,
    Prefer: "return=representation",
  };

  const listaPecas = document.getElementById("listaPecas");
  let arrayPecasGlobal = [];
  let arrayCategoriasGlobal = [];

  async function inicializarTela() {
    try {
      const resCat = await fetch(
        `${baseUrl}/categoria_peca?select=id,descricao&is_active=eq.true&order=descricao.asc`,
        { headers: headersConfig },
      );
      arrayCategoriasGlobal = await resCat.json();

      const selectEditCategoria = document.getElementById("editPecaCategoria");
      selectEditCategoria.innerHTML =
        '<option value="">Selecione uma categoria...</option>';
      arrayCategoriasGlobal.forEach(
        (c) =>
          (selectEditCategoria.innerHTML += `<option value="${c.id}">${c.descricao}</option>`),
      );

      const resPecas = await fetch(
        `${baseUrl}/peca?select=*,categoria_peca(descricao)&is_active=eq.true&order=id.desc`,
        { headers: headersConfig },
      );
      arrayPecasGlobal = await resPecas.json();

      renderizarInterface(arrayPecasGlobal);
    } catch (e) {
      console.error(e);
      if (listaPecas)
        listaPecas.innerHTML =
          '<tr><td colspan="7" style="text-align: center; color: red;">Erro ao carregar dados.</td></tr>';
    }
  }

  function renderizarInterface(pecas) {
    let totalItens = pecas.length;
    let valorTotal = 0;
    let estoqueCritico = 0;

    listaPecas.innerHTML = "";

    if (pecas.length === 0) {
      listaPecas.innerHTML =
        '<tr><td colspan="7" style="text-align: center;">Nenhuma peça cadastrada.</td></tr>';
    }

    pecas.forEach((peca) => {
      const custo = Number(peca.custo_unitario) || 0;
      const qtd = Number(peca.qtde) || 0;
      const min = Number(peca.estoque_minimo) || 5;
      const totalItem = custo * qtd;

      valorTotal += totalItem;
      if (qtd <= min) estoqueCritico++;


      let alertaHTML =
        qtd <= min ? `<span class="alerta-estoque">estoque baixo</span>` : "";
      let classeLinha = qtd <= min ? 'class="peca-estoque-baixo"' : "";
      let categoriaNome = peca.categoria_peca
        ? peca.categoria_peca.descricao
        : "Sem Categoria";

      listaPecas.innerHTML += `
        <tr ${classeLinha}>
          <td class="codigo-peca">PC${String(peca.id).padStart(4, "0")}</td>
          <td>
            <div class="descricao-peca">
              <span>${peca.descricao}</span>
              ${alertaHTML}
            </div>
          </td>
          <td style="color: #647a99; font-size: 11px;">${categoriaNome}</td>
          <td class="quantidade-peca">${qtd} ${peca.unidade_medida || "un"}</td>
          <td class="custo-peca">R$ ${custo.toFixed(2)}</td>
          <td class="total-peca">R$ ${totalItem.toFixed(2)}</td>
          <td class="acoes-peca">
            <button type="button" class="botao-acoes btn-abrir-edicao" data-id="${peca.id}"><i class="bi bi-pencil"></i></button>
          </td>
        </tr>
      `;
    });

    document.querySelectorAll(".conteudo-resumo-peca h2")[0].textContent =
      totalItens;
    document.querySelectorAll(".conteudo-resumo-peca h2")[1].textContent =
      `R$ ${valorTotal.toFixed(2).replace(".", ",")}`;
    document.querySelectorAll(".conteudo-resumo-peca h2")[2].textContent =
      estoqueCritico;
  }

  const modalEditar = document.getElementById("modalEditarPeca");
  const formEditar = document.getElementById("formEditarPeca");


  if (listaPecas) {
    listaPecas.addEventListener("click", (e) => {
      const btn = e.target.closest(".btn-abrir-edicao");
      if (!btn) return;

      const idPeca = Number(btn.getAttribute("data-id"));
      const peca = arrayPecasGlobal.find((p) => p.id === idPeca);
      if (!peca) return;

      document.getElementById("editPecaId").value = peca.id;
      document.getElementById("editPecaDescricao").value = peca.descricao;
      document.getElementById("editPecaQuantidade").value = peca.qtde;
      document.getElementById("editPecaCusto").value = peca.custo_unitario;
      document.getElementById("editPecaCategoria").value =
        peca.id_categoria || "";

      modalEditar.style.display = "flex";
    });
  }

  function fecharModalEditar() {
    modalEditar.style.display = "none";
  }
  document
    .getElementById("fecharEditarPecaX")
    ?.addEventListener("click", (e) => {
      e.preventDefault();
      fecharModalEditar();
    });
  document
    .getElementById("overlayEditarPeca")
    ?.addEventListener("click", fecharModalEditar);

  formEditar?.addEventListener("submit", async (e) => {
    e.preventDefault();
    const btnSalvar = document.getElementById("btnSalvarPecaEdit");
    btnSalvar.innerHTML = "Salvando...";
    btnSalvar.disabled = true;

    const id = document.getElementById("editPecaId").value;
    const payload = {
      descricao: document.getElementById("editPecaDescricao").value,
      id_categoria: Number(document.getElementById("editPecaCategoria").value),
      qtde: Number(document.getElementById("editPecaQuantidade").value),
      custo_unitario: Number(document.getElementById("editPecaCusto").value),
    };

    try {
      const res = await fetch(`${baseUrl}/peca?id=eq.${id}`, {
        method: "PATCH",
        headers: headersConfig,
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error("Erro ao atualizar a peça.");
      alert("Peça atualizada!");
      fecharModalEditar();
      inicializarTela();
    } catch (err) {
      alert(err.message);
    } finally {
      btnSalvar.innerHTML = '<i class="bi bi-check-lg"></i> Salvar alterações';
      btnSalvar.disabled = false;
    }
  });

  document
    .getElementById("btnExcluirPeca")
    ?.addEventListener("click", async () => {
      if (!confirm("Tem certeza que deseja excluir esta peça do estoque?"))
        return;

      const id = document.getElementById("editPecaId").value;
      try {
        const res = await fetch(`${baseUrl}/peca?id=eq.${id}`, {
          method: "PATCH",
          headers: headersConfig,
          body: JSON.stringify({ is_active: false }),
        });
        if (!res.ok) throw new Error("Erro ao excluir peça.");
        alert("Peça excluída com sucesso!");
        fecharModalEditar();
        inicializarTela();
      } catch (err) {
        alert(err.message);
      }
    });

  const modalCategoria = document.getElementById("popupNovaCategoria");
  const formCategoria = document.getElementById("formNovaCategoria");

  document
    .getElementById("botaoNovaCategoria")
    ?.addEventListener("click", () => (modalCategoria.style.display = "flex"));

  function fecharModalCategoria() {
    modalCategoria.style.display = "none";
    formCategoria?.reset();
  }
  document
    .getElementById("fecharNovaCategoriaX")
    ?.addEventListener("click", (e) => {
      e.preventDefault();
      fecharModalCategoria();
    });
  document
    .getElementById("cancelarCategoria")
    ?.addEventListener("click", fecharModalCategoria);
  document
    .getElementById("fecharOverlayCategoria")
    ?.addEventListener("click", fecharModalCategoria);

  formCategoria?.addEventListener("submit", async (e) => {
    e.preventDefault();
    const btnSalvar = document.getElementById("salvarCategoria");
    btnSalvar.innerHTML = "Salvando...";
    btnSalvar.disabled = true;

    try {
      const res = await fetch(`${baseUrl}/categoria_peca`, {
        method: "POST",
        headers: headersConfig,
        body: JSON.stringify({
          descricao: document.getElementById("nomeCategoria").value,
        }),
      });
      if (!res.ok) {
        const erro = await res.json();
        if (erro.code === "23505") throw new Error("Esta categoria já existe!");
        throw new Error("Erro ao salvar no banco.");
      }
      alert("Categoria criada!");
      fecharModalCategoria();
      inicializarTela();
    } catch (err) {
      alert(err.message);
    } finally {
      btnSalvar.innerHTML = '<i class="bi bi-check-lg"></i> Criar categoria';
      btnSalvar.disabled = false;
    }
  });

  inicializarTela();
});

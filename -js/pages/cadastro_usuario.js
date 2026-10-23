document.addEventListener("DOMContentLoaded", () => {
  const baseUrl = "https://umvtsquzpugempndwitx.supabase.co/rest/v1";
  const apiKey = "sb_publishable_58JIZcrwwFjp2gnEPPVZeg_tkrJ-LHb";
  const headersConfig = {
    "Content-Type": "application/json",
    apikey: apiKey,
    Prefer: "return=representation",
  };

  const form = document.getElementById("userForm");
  const selectNivel = document.getElementById("userLevel");
  const inputContato = document.getElementById("userContact");
  const btnSubmit = document.getElementById("saveUserButton");

  function normalizarTelefone(valor) {
    return valor.replace(/\D/g, "");
  }

  function normalizarTexto(valor) {
    return String(valor || "")
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .replace(/\s+/g, " ")
      .trim();
  }

  async function consultarNiveisAcesso() {
    let ultimoErro = null;
    let consultaValidaSemResultados = false;

    for (const tabela of ["papel", "nivel"]) {
      let resposta;
      try {
        resposta = await fetch(
          `${baseUrl}/${tabela}?select=id,funcao&is_active=eq.true&order=id.asc`,
          { headers: headersConfig },
        );
        if (!resposta.ok) {
          ultimoErro = new Error(`${tabela}: ${await resposta.text()}`);
          resposta = await fetch(
            `${baseUrl}/${tabela}?select=id,funcao&order=id.asc`,
            { headers: headersConfig },
          );
        }
        if (!resposta.ok) {
          ultimoErro = new Error(`${tabela}: ${await resposta.text()}`);
          continue;
        }

        const niveis = await resposta.json();
        if (niveis.length > 0) {
          const vistos = new Set();
          return niveis.filter((nivel) => {
            const chave = normalizarTexto(nivel.funcao);
            if (!chave || vistos.has(chave)) return false;
            vistos.add(chave);
            return true;
          });
        }
        consultaValidaSemResultados = true;
      } catch (erro) {
        ultimoErro = erro;
      }
    }

    if (consultaValidaSemResultados) return [];
    throw ultimoErro || new Error("Não foi possível consultar os níveis de acesso.");
  }

  async function carregarNiveisAcesso() {
    selectNivel.innerHTML = '<option value="">Carregando níveis de acesso...</option>';
    selectNivel.disabled = true;
    btnSubmit.disabled = true;

    try {
      const niveis = await consultarNiveisAcesso();
      selectNivel.innerHTML = '<option value="">Selecione um nível de acesso...</option>';

      niveis.forEach((nivel) => {
        const option = document.createElement("option");
        option.value = String(nivel.id);
        option.textContent = nivel.funcao;
        selectNivel.appendChild(option);
      });

      if (niveis.length === 0) {
        selectNivel.innerHTML = '<option value="">Nenhum nível de acesso ativo</option>';
      }
    } catch (erro) {
      console.error("Erro ao carregar níveis de acesso:", erro);
      selectNivel.innerHTML = '<option value="">Erro ao carregar níveis de acesso</option>';
      alert(`Não foi possível carregar os níveis de acesso. ${erro.message}`);
    } finally {
      selectNivel.disabled = false;
      btnSubmit.disabled = selectNivel.options.length <= 1 || !selectNivel.value;
    }
  }

  selectNivel.addEventListener("change", () => {
    btnSubmit.disabled = !selectNivel.value;
  });

  inputContato.addEventListener("blur", () => {
    inputContato.value = normalizarTelefone(inputContato.value);
  });

  form.addEventListener("submit", async (event) => {
    event.preventDefault();

    const nome = document.getElementById("userName").value.trim();
    const matricula = document.getElementById("userRegistration").value.trim();
    const contato = normalizarTelefone(inputContato.value);
    const funcao = document.getElementById("userFunction").value.trim();
    const senha = document.getElementById("userPassword").value;
    const idPapel = Number(selectNivel.value);

    // O banco aceita até 12 caracteres; telefones brasileiros locais costumam ter 10 ou 11 dígitos.
    if (!/^\d{10,12}$/.test(contato)) {
      alert("Digite um telefone válido com DDD (10 a 12 dígitos, sem letras). ");
      inputContato.focus();
      return;
    }

    if (!Number.isInteger(idPapel) || idPapel <= 0) {
      alert("Selecione um nível de acesso válido.");
      selectNivel.focus();
      return;
    }

    const novoUsuario = {
      nome,
      matricula,
      contato,
      funcao,
      senha,
      id_papel: idPapel,
    };

    const textoOriginal = btnSubmit.textContent;
    btnSubmit.textContent = "Cadastrando...";
    btnSubmit.disabled = true;

    try {
      const respostaContato = await fetch(
        `${baseUrl}/usuario?select=id&contato=eq.${encodeURIComponent(contato)}`,
        { headers: headersConfig },
      );

      if (!respostaContato.ok) {
        throw new Error(`Não foi possível verificar o contato: ${await respostaContato.text()}`);
      }

      const usuariosComContato = await respostaContato.json();
      if (usuariosComContato.length > 0) {
        alert("O número inserido já foi cadastrado.");
        inputContato.focus();
        return;
      }

      const respostaCadastro = await fetch(`${baseUrl}/usuario`, {
        method: "POST",
        headers: headersConfig,
        body: JSON.stringify(novoUsuario),
      });

      const respostaTexto = await respostaCadastro.text();
      if (!respostaCadastro.ok) {
        throw new Error(`Erro ${respostaCadastro.status}: ${respostaTexto}`);
      }

      alert("Usuário cadastrado com sucesso! Ele será exibido na lista de usuários.");
      window.location.href = "usuarios.html?atualizado=1";
    } catch (erro) {
      console.error("Falha ao cadastrar usuário:", erro);
      alert(`Não foi possível cadastrar o usuário. ${erro.message}`);
    } finally {
      btnSubmit.textContent = textoOriginal;
      btnSubmit.disabled = !selectNivel.value;
    }
  });

  carregarNiveisAcesso();
});

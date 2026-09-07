document.getElementById("userForm").addEventListener("submit", async function (event) {
    event.preventDefault();
    
    //TROCAR O BANCO DO CADASTRO E DO "USUARIOS" ANTES DE TESTAR
    // 1. Capturando os elementos de forma segura
    const nome = document.getElementById("userName").value;
    const matricula = document.getElementById("userRegistration").value;
    const contato = document.getElementById("userContact").value;
    const funcao = document.getElementById("userFunction").value;
    const senha = document.getElementById("userPassword").value;
    const nivel = document.getElementById("userLevel").value;

    // 2. Montando o objeto exatamente igual às colunas do Supabase
    const novoUsuario = {
      nome: nome,
      matricula: matricula,
      contato: contato,
      funcao: funcao,
      senha: senha,
      id_papel: Number(nivel), // Corrigido de 'id_nivel_usuario' para 'id_papel'
    };

    if (contato.length > 12){
      alert("Seu número de telefone passa do limite de 12 caracteres");
      return;
    }

    if (contato.length < 12){
      alert("Digite um número valido")
      return;
    }

    try {
        const checkResponse = await fetch(`https://akbqnlvyfravlglouoqs.supabase.co/rest/v1/usuario?contato=eq.${encodeURIComponent(contato)}`, {
            method: 'GET',
            headers: {
                "apikey": "sb_publishable_1c5c9HTR_Hcf3KF5SX22NQ_wNXFADKK",
                "Authorization": "Bearer sb_publishable_1c5c9HTR_Hcf3KF5SX22NQ_wNXFADKK"
                }
            });

            const checagemContanto = await checkResponse.json();

            if (checagemContanto.length > 0){
                alert("O número inserido já foi cadastrado");
                return;
            }

            } catch (error) {
            console.error("Erro na verificação de contato:", error);
                alert("Erro ao verificar duplicidade de contato.");
                return;
            }

    console.log("Enviando usuário:", novoUsuario);

    // 3. Fazendo a requisição (POST) para o Supabase
    fetch("https://akbqnlvyfravlglouoqs.supabase.co/rest/v1/usuario", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        apikey: "sb_publishable_1c5c9HTR_Hcf3KF5SX22NQ_wNXFADKK",
        Authorization: "Bearer sb_publishable_1c5c9HTR_Hcf3KF5SX22NQ_wNXFADKK",
        Prefer: "return=representation", // Faz o Supabase devolver os dados inseridos na resposta
      },
      body: JSON.stringify(novoUsuario),
    })
      .then(async (response) => {
        const respostaText = await response.text();

        if (!response.ok) {
          throw new Error(`Erro ${response.status}: ${respostaText}`);
        }

        return respostaText ? JSON.parse(respostaText) : {};
      })
      .then((dadosInseridos) => {
        console.log("Usuário cadastrado com sucesso:", dadosInseridos);
        alert("Usuário cadastrado com sucesso!");

        // Opcional: Limpar o formulário após o sucesso
        document.getElementById("userForm").reset();

        // Opcional: Redirecionar para a tela de listagem
        // window.location.href = 'usuarios.html';
      })
      .catch((error) => {
        console.error("Falha ao salvar no banco:", error);
        alert("Ocorreu um erro ao cadastrar. Verifique o console.");
      });
});

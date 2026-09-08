document.getElementById("userForm").addEventListener("submit", async function (event) {
    event.preventDefault();
    
    const nome = document.getElementById("userName").value;
    const matricula = document.getElementById("userRegistration").value;
    const contato = document.getElementById("userContact").value;
    const funcao = document.getElementById("userFunction").value;
    const senha = document.getElementById("userPassword").value;
    const nivel = document.getElementById("userLevel").value;

    const novoUsuario = {
      nome: nome,
      matricula: matricula,
      contato: contato,
      funcao: funcao,
      senha: senha,
      id_papel: Number(nivel),
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
        const checkResponse = await fetch(`https://umvtsquzpugempndwitx.supabase.co/rest/v1/usuario?contato=eq.${encodeURIComponent(contato)}`, {
            method: 'GET',
            headers: {
                "apikey": "sb_publishable_58JIZcrwwFjp2gnEPPVZeg_tkrJ-LHb",
                "Authorization": "Bearer sb_publishable_58JIZcrwwFjp2gnEPPVZeg_tkrJ-LHb"
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

    fetch("https://umvtsquzpugempndwitx.supabase.co/rest/v1/usuario", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        apikey: "sb_publishable_58JIZcrwwFjp2gnEPPVZeg_tkrJ-LHb",
        Authorization: "Bearer sb_publishable_58JIZcrwwFjp2gnEPPVZeg_tkrJ-LHb",
        Prefer: "return=representation", 
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

        document.getElementById("userForm").reset();

      })
      .catch((error) => {
        console.error("Falha ao salvar no banco:", error);
        alert("Ocorreu um erro ao cadastrar. Verifique o console.");
      });
});

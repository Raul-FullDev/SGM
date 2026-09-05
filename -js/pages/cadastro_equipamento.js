document.getElementById('formularioEquipamento').addEventListener('submit', function(event){
    event.preventDefault();

    const asset = document.getElementById('codigoAtivo').value; 
    const status = document.getElementById('statusEquipamento').value; 
    const descricao = document.getElementById('descricaoEquipamento').value; 
    const fabricante = document.getElementById('fabricanteEquipamento').value; 
    const modelo = document.getElementById('modeloEquipamento').value; 
    const numero_serie = document.getElementById('numeroSerie').value; 
    const data_aquisicao = document.getElementById('dataAquisicao').value; 
    const id_local = document.getElementById('setorLocalizacao').value; 

    const novoEquipamento = {
        asset: asset,
        status: status,
        descricao: descricao,
        manufaturado: fabricante,
        modelo: modelo,
        numero_serie: numero_serie,
        data_aquisicao: data_aquisicao,
        id_local: id_local,
    };

    console.log("Enviando equipamento:", novoEquipamento);


    fetch(`https://umvtsquzpugempndwitx.supabase.co/rest/v1/equipamento`, {
       method: "POST",
       headers: {
        "Content-Type": "application/json",
        apikey: "sb_publishable_58JIZcrwwFjp2gnEPPVZeg_tkrJ-LHb",
        Authorization: "Bearer sb_publishable_58JIZcrwwFjp2gnEPPVZeg_tkrJ-LHb",
        Prefer: "return=representation", // Faz o Supabase devolver os dados inseridos na resposta
      },  
      body: JSON.stringify(novoEquipamento),
    })
        .then(async (resposta) => {

            const respostaText = await resposta.text();

            console.log("Status:", resposta.status);
            console.log("Resposta do Supabase:", respostaText);

            if (!resposta.ok) {
                throw new Error(
                    `Erro ${resposta.status}: ${respostaText}`
                );
            }

            return respostaText
                ? JSON.parse(respostaText)
                : {};
        })
        .then((novoEquipamento) => {
            console.log("Equipamento cadastrado com sucesso:", novoEquipamento);
            alert("Equipamento cadastrado com sucesso!");

            // Opcional: Limpar o formulário após o sucesso
            // document.getElementById("userForm").reset();

            // Opcional: Redirecionar para a tela de listagem
            // window.location.href = 'usuarios.html';
        })
        .catch((error) => {
            console.error("Falha ao salvar no banco:", error);
            alert("Ocorreu um erro ao cadastrar. Verifique o console.");
        });

});
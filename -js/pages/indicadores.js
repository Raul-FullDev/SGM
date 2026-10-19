const SUPABASE_BASE_URL = "https://umvtsquzpugempndwitx.supabase.co/rest/v1";
const SUPABASE_API_KEY = "sb_publishable_58JIZcrwwFjp2gnEPPVZeg_tkrJ-LHb";

const CABECALHOS_SUPABASE = {
  apikey: SUPABASE_API_KEY,
  Authorization: `Bearer ${SUPABASE_API_KEY}`,
  Accept: "application/json",
};

async function consultarSupabase(tabela, filtros = {}) {
  const parametros = new URLSearchParams({ select: "*", limit: "10000" });

  Object.entries(filtros).forEach(([chave, valor]) => {
    if (valor !== undefined && valor !== null && valor !== "") {
      parametros.set(chave, String(valor));
    }
  });

  const resposta = await fetch(
    `${SUPABASE_BASE_URL}/${encodeURIComponent(tabela)}?${parametros.toString()}`,
    { method: "GET", headers: CABECALHOS_SUPABASE }
  );

  const texto = await resposta.text();
  if (!resposta.ok) {
    throw new Error(`Erro ao consultar ${tabela}: ${resposta.status} - ${texto}`);
  }

  return texto ? JSON.parse(texto) : [];
}

async function consultarOpcional(tabela) {
  try {
    return await consultarSupabase(tabela);
  } catch (erro) {
    console.warn(`NÃ£o foi possÃ­vel consultar a tabela ${tabela}:`, erro.message);
    return [];
  }
}

function normalizar(valor) {
  return String(valor ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "");
}

function escaparHtml(valor) {
  return String(valor ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function campoPorRegex(objeto, regex) {
  if (!objeto || typeof objeto !== "object") return null;
  for (const [chave, valor] of Object.entries(objeto)) {
    if (regex.test(normalizar(chave)) && valor !== null && valor !== undefined && valor !== "") {
      return { chave, valor };
    }
  }
  return null;
}

function pegarIdPrincipal(registro) {
  if (!registro) return null;
  if (registro.id !== undefined && registro.id !== null) return registro.id;
  const campo = campoPorRegex(registro, /^id$/);
  return campo ? campo.valor : null;
}

function buscarPorId(lista, id) {
  if (id === null || id === undefined || id === "") return null;
  return lista.find((item) => String(pegarIdPrincipal(item)) === String(id)) || null;
}

function pegarRotulo(registro) {
  if (!registro) return "";
  const preferidos = ["descricao", "nome", "status", "tipo", "titulo", "label"];
  for (const preferido of preferidos) {
    const campo = Object.entries(registro).find(([chave, valor]) =>
      normalizar(chave) === preferido && typeof valor === "string" && valor.trim()
    );
    if (campo) return campo[1].trim();
  }
  const campo = Object.entries(registro).find(([chave, valor]) =>
    /nome|descricao|status|tipo|titulo|label/.test(normalizar(chave)) &&
    typeof valor === "string" && valor.trim()
  );
  return campo ? campo[1].trim() : "";
}

function converterNumero(valor) {
  if (typeof valor === "number") return Number.isFinite(valor) ? valor : null;
  if (valor === null || valor === undefined || valor === "") return null;
  let texto = String(valor).trim();
  if (texto.includes(",")) texto = texto.replace(/\./g, "").replace(",", ".");
  const numero = Number(texto);
  return Number.isFinite(numero) ? numero : null;
}

function dataValida(valor) {
  if (!valor) return null;
  const data = new Date(valor);
  return Number.isNaN(data.getTime()) ? null : data;
}

function obterDataInicio(registro) {
  const campo = campoPorRegex(
    registro,
    /^(dataabertura|dataregistro|datacriacao|createdat|datainicio|inicioem|abertoem)$/
  );
  return campo ? dataValida(campo.valor) : null;
}

function obterDataFim(registro) {
  const campo = campoPorRegex(
    registro,
    /^(datafechamento|dataconclusao|dataencerramento|datafim|closedat|concluidoem|fechadoem)$/
  );
  return campo ? dataValida(campo.valor) : null;
}

function obterDataMovimento(registro) {
  const campo = campoPorRegex(
    registro,
    /^(datatroca|datamovimentacao|dataregistro|datacriacao|createdat|datautilizacao|datacusto)$/
  );
  return campo ? dataValida(campo.valor) : null;
}

function pegarIdRelacionamento(registro, regex) {
  const campo = campoPorRegex(registro, regex);
  return campo ? campo.valor : null;
}

function encontrarAbertura(ordem, aberturas) {
  const idOrdem = pegarIdPrincipal(ordem);
  const ligacao = /^(idordemservico|ordemservicoid|idos|osid)$/;
  return aberturas.find((abertura) => {
    const idLigado = pegarIdRelacionamento(abertura, ligacao);
    if (idLigado !== null && idLigado !== undefined) return String(idLigado) === String(idOrdem);
    return String(pegarIdPrincipal(abertura)) === String(idOrdem);
  }) || null;
}

function resolverStatus(ordem, abertura, listaStatus) {
  for (const registro of [abertura, ordem]) {
    if (!registro) continue;

    const campoTexto = campoPorRegex(registro, /^(status|situacao|estado|statusordemservico|statusos)$/);
    if (campoTexto) {
      const valor = campoTexto.valor;
      if (typeof valor === "string" && converterNumero(valor) === null) return valor;
      const encontrado = buscarPorId(listaStatus, valor);
      const rotulo = pegarRotulo(encontrado);
      if (rotulo) return rotulo;
    }

    const idStatus = pegarIdRelacionamento(registro, /^(idstatus|statusid|idstatusordemservico|statusordemservicoid)$/);
    if (idStatus !== null && idStatus !== undefined) {
      const rotulo = pegarRotulo(buscarPorId(listaStatus, idStatus));
      if (rotulo) return rotulo;
    }
  }
  return "NÃ£o identificado";
}

function resolverTipo(ordem, planos, tipos) {
  const direto = campoPorRegex(ordem, /^(tipomanutencao|idtipomanutencao|manutencaotipo)$/);
  if (direto) {
    if (typeof direto.valor === "string" && converterNumero(direto.valor) === null) return direto.valor;
    const tipo = buscarPorId(tipos, direto.valor);
    const rotulo = pegarRotulo(tipo);
    if (rotulo) return rotulo;
  }

  const idPlano = pegarIdRelacionamento(ordem, /^(idplanomanutencao|planomanutencaoid)$/);
  const plano = buscarPorId(planos, idPlano);
  if (plano) {
    const campoTipo = pegarIdRelacionamento(plano, /^(idtipomanutencao|tipomanutencaoid|tipomanutencao)$/);
    if (campoTipo !== null && campoTipo !== undefined) {
      if (typeof campoTipo === "string" && converterNumero(campoTipo) === null) return campoTipo;
      const tipo = buscarPorId(tipos, campoTipo);
      const rotulo = pegarRotulo(tipo);
      if (rotulo) return rotulo;
    }
  }
  return "NÃ£o identificado";
}

function resolverEquipamento(ordem, abertura, equipamentos) {
  const regexIdEquipamento = /^(idequipamento|equipamentoid|assetid|asset)$/;
  const campo = pegarIdRelacionamento(ordem, regexIdEquipamento) ??
    pegarIdRelacionamento(abertura, regexIdEquipamento);

  let equipamento = buscarPorId(equipamentos, campo);
  if (!equipamento && campo !== null && campo !== undefined) {
    equipamento = equipamentos.find((item) =>
      String(item.asset ?? "") === String(campo) || String(item.numero_serie ?? "") === String(campo)
    ) || null;
  }

  if (equipamento) {
    const descricao = equipamento.descricao || equipamento.nome || "Equipamento";
    const patrimonio = equipamento.asset ? ` (${equipamento.asset})` : "";
    return { chave: String(pegarIdPrincipal(equipamento) ?? campo), nome: `${descricao}${patrimonio}` };
  }

  if (campo !== null && campo !== undefined) {
    return { chave: String(campo), nome: String(campo) };
  }
  return { chave: null, nome: "Equipamento nÃ£o identificado" };
}

function formatarNumero(valor, casas = 1) {
  if (valor === null || valor === undefined || !Number.isFinite(valor)) return "N/D";
  return valor.toLocaleString("pt-BR", { minimumFractionDigits: casas, maximumFractionDigits: casas });
}

function definirCard(classe, valor, unidade = "", percentual = false) {
  const elemento = document.querySelector(`.${classe} .valor-indicador`);
  if (!elemento) return;

  const temValor = typeof valor === "number" && Number.isFinite(valor);
  const texto = temValor ? formatarNumero(valor) : "N/D";
  elemento.innerHTML = `${escaparHtml(texto)}${temValor && unidade ? `<span>${escaparHtml(unidade)}</span>` : ""}`;

  const barra = document.querySelector(`.${classe} .barra-indicador span`);
  if (barra) {
    barra.style.width = temValor && percentual ? `${Math.max(0, Math.min(100, valor))}%` : "0%";
  }
}

function classificarStatus(status) {
  const texto = normalizar(status);
  return {
    cancelada: texto.includes("cancel"),
    concluida: texto.includes("conclu") || texto.includes("finaliz") || texto.includes("encerr"),
    andamento: texto.includes("andamento") || texto.includes("execu") || texto.includes("aberta"),
  };
}

function renderizarTipos(enriquecidas) {
  const container = document.getElementById("listaTiposManutencao");
  if (!container) return;

  const contagem = new Map();
  enriquecidas.forEach((item) => {
    if (item.tipo !== "NÃ£o identificado") {
      contagem.set(item.tipo, (contagem.get(item.tipo) || 0) + 1);
    }
  });

  if (contagem.size === 0) {
    container.innerHTML = '<p class="mensagem-indicadores">NÃ£o hÃ¡ tipos de manutenÃ§Ã£o vinculados Ã s OS.</p>';
    return;
  }

  const dados = [...contagem.entries()].sort((a, b) => b[1] - a[1]);
  const maximo = Math.max(...dados.map((item) => item[1]), 1);
  container.innerHTML = dados.map(([nome, quantidade]) => {
    const tipo = normalizar(nome);
    let classe = "barra-corretiva";
    if (tipo.includes("prevent")) classe = "barra-preventiva";
    else if (tipo.includes("predit")) classe = "barra-preditiva";
    else if (tipo.includes("inspec")) classe = "barra-inspecao";
    else if (tipo.includes("corret")) classe = "barra-corretiva";
    const largura = (quantidade / maximo) * 100;

    return `<div class="linha-tipo">
      <span class="nome-tipo">${escaparHtml(nome)}</span>
      <div class="barra-tipo"><span class="${classe}" style="width:${largura}%"></span></div>
      <strong>${quantidade}</strong>
    </div>`;
  }).join("");
}

function renderizarTopEquipamentos(enriquecidas) {
  const container = document.querySelector(".top-equipamentos");
  if (!container) return;

  container.querySelectorAll(".item-top-equipamento, .mensagem-top-equipamentos").forEach((el) => el.remove());
  const contagem = new Map();
  enriquecidas.forEach((item) => {
    const tipo = normalizar(item.tipo);
    const status = normalizar(item.status);
    const ehFalha = tipo.includes("corret") || tipo.includes("falha") || status.includes("cancel");
    if (ehFalha && item.equipamento.chave) {
      const atual = contagem.get(item.equipamento.chave) || { nome: item.equipamento.nome, quantidade: 0 };
      atual.quantidade++;
      contagem.set(item.equipamento.chave, atual);
    }
  });

  const top = [...contagem.values()].sort((a, b) => b.quantidade - a.quantidade).slice(0, 3);
  if (top.length === 0) {
    const mensagem = document.createElement("p");
    mensagem.className = "mensagem-top-equipamentos";
    mensagem.textContent = "Sem dados suficientes para identificar equipamentos com mais falhas.";
    container.appendChild(mensagem);
    return;
  }

  top.forEach((item) => {
    const linha = document.createElement("div");
    linha.className = "item-top-equipamento";
    linha.innerHTML = `<span>${escaparHtml(item.nome)}</span><strong>${item.quantidade} falha(s)</strong>`;
    container.appendChild(linha);
  });
}

function renderizarCustos(trocas, pecas) {
  const container = document.getElementById("graficoCustoMensal");
  if (!container) return;

  const mapaPecas = new Map(pecas.map((peca) => [String(pegarIdPrincipal(peca)), peca]));
  const totais = new Map();
  let encontrouDado = false;

  trocas.forEach((troca) => {
    const data = obterDataMovimento(troca);
    if (!data) return;

    const quantidadeCampo = campoPorRegex(troca, /^(quantidade|qtde|qtd|quantidadeutilizada|quantidadepeca)$/);
    const quantidade = converterNumero(quantidadeCampo?.valor) ?? 1;
    const valorTotal = campoPorRegex(troca, /^(custototal|valortotal|total)$/);
    const valorUnitario = campoPorRegex(troca, /^(custounitario|valorunitario|precounitario)$/);
    const idPeca = pegarIdRelacionamento(troca, /^(idpeca|pecaid)$/);
    const peca = buscarPorId(pecas, idPeca) || mapaPecas.get(String(idPeca));
    const custoPeca = campoPorRegex(peca, /^(custounitario|valorunitario|preco)$/);

    let valor = converterNumero(valorTotal?.valor);
    if (valor === null) {
      const unitario = converterNumero(valorUnitario?.valor) ?? converterNumero(custoPeca?.valor);
      if (unitario !== null) valor = unitario * quantidade;
    }
    if (valor === null || valor < 0) return;

    const chaveMes = `${data.getFullYear()}-${String(data.getMonth() + 1).padStart(2, "0")}`;
    totais.set(chaveMes, (totais.get(chaveMes) || 0) + valor);
    encontrouDado = true;
  });

  if (!encontrouDado) {
    container.innerHTML = '<p class="mensagem-indicadores">Sem dados de custo com data e valor para exibir.</p>';
    return;
  }

  const meses = [];
  const agora = new Date();
  for (let i = 5; i >= 0; i--) {
    const data = new Date(agora.getFullYear(), agora.getMonth() - i, 1);
    const chave = `${data.getFullYear()}-${String(data.getMonth() + 1).padStart(2, "0")}`;
    meses.push({ chave, nome: data.toLocaleDateString("pt-BR", { month: "short" }).replace(".", ""), valor: totais.get(chave) || 0 });
  }

  const maior = Math.max(...meses.map((mes) => mes.valor), 1);
  container.innerHTML = meses.map((mes) => {
    const altura = (mes.valor / maior) * 100;
    const valorFormatado = mes.valor.toLocaleString("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 });
    return `<div class="barra-grafico">
      <span class="valor-barra">${escaparHtml(valorFormatado)}</span>
      <div class="barra"><span style="height:${altura}%"></span></div>
      <strong>${escaparHtml(mes.nome)}</strong>
    </div>`;
  }).join("");
}

async function carregarIndicadores() {
  try {
    const [ordens, aberturas, statusOS, tipos, planos, equipamentos, trocas, pecas] = await Promise.all([
      consultarSupabase("ordem_servico"),
      consultarOpcional("abertura_ordem_servico"),
      consultarOpcional("status_ordem_servico"),
      consultarOpcional("tipo_manutencao"),
      consultarOpcional("plano_manutencao"),
      consultarOpcional("equipamento"),
      consultarOpcional("troca_peca"),
      consultarOpcional("peca"),
    ]);

    const enriquecidas = ordens.map((ordem) => {
      const abertura = encontrarAbertura(ordem, aberturas);
      return {
        ordem,
        abertura,
        tipo: resolverTipo(ordem, planos, tipos),
        status: resolverStatus(ordem, abertura, statusOS),
        equipamento: resolverEquipamento(ordem, abertura, equipamentos),
        dataInicio: obterDataInicio(abertura) || obterDataInicio(ordem),
        dataFim: obterDataFim(abertura) || obterDataFim(ordem),
      };
    });

    const duracoes = enriquecidas
      .filter((item) => item.dataInicio && item.dataFim && item.dataFim >= item.dataInicio)
      .map((item) => (item.dataFim - item.dataInicio) / (1000 * 60 * 60));
    const mttr = duracoes.length ? duracoes.reduce((soma, valor) => soma + valor, 0) / duracoes.length : null;

    const porEquipamento = new Map();
    enriquecidas.forEach((item) => {
      const tipo = normalizar(item.tipo);
      if (!item.dataInicio || !item.equipamento.chave || !(tipo.includes("corret") || tipo.includes("falha"))) return;
      if (!porEquipamento.has(item.equipamento.chave)) porEquipamento.set(item.equipamento.chave, []);
      porEquipamento.get(item.equipamento.chave).push(item.dataInicio);
    });
    const intervalos = [];
    porEquipamento.forEach((datas) => {
      datas.sort((a, b) => a - b);
      for (let i = 1; i < datas.length; i++) {
        const horas = (datas[i] - datas[i - 1]) / (1000 * 60 * 60);
        if (horas > 0) intervalos.push(horas);
      }
    });
    const mtbf = intervalos.length ? intervalos.reduce((soma, valor) => soma + valor, 0) / intervalos.length : null;

    const disponibilidade = mtbf !== null && mttr !== null && mtbf + mttr > 0
      ? (mtbf / (mtbf + mttr)) * 100
      : null;

    const tiposConhecidos = enriquecidas.length > 0 && enriquecidas.every((item) => item.tipo !== "NÃ£o identificado");
    const falhas = enriquecidas.filter((item) => {
      const tipo = normalizar(item.tipo);
      const status = normalizar(item.status);
      return tipo.includes("corret") || tipo.includes("falha") || status.includes("cancel");
    });
    const taxaFalha = ordens.length > 0 && tiposConhecidos
      ? (new Set(falhas.map((item) => String(pegarIdPrincipal(item.ordem)))).size / ordens.length) * 100
      : null;

    const confiabilidade =
            taxaFalha !== null ? 100 - taxaFalha : null;

    definirCard("indicador-mtbf", mtbf, "h");
    definirCard("indicador-mttr", mttr, "h");
    definirCard("indicador-disp", disponibilidade, "%", true);
    definirCard("indicador-conf", confiabilidade, "%", true);
    definirCard("indicador-falha", taxaFalha, "%", true);

    renderizarTipos(enriquecidas);
    renderizarTopEquipamentos(enriquecidas);
    renderizarCustos(trocas, pecas);

    console.info("Indicadores carregados.", {
      totalOS: ordens.length,
      mtbfHoras: mtbf,
      mttrHoras: mttr,
      disponibilidadePercentual: disponibilidade,
      taxaFalhaPercentual: taxaFalha,
    });
  } catch (erro) {
    console.error("Erro ao carregar os indicadores:", erro);
  }
}

document.addEventListener("DOMContentLoaded", carregarIndicadores);
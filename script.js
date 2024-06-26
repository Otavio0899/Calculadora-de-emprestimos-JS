"use strict";
function calcular() {
    var amount = document.getElementById("amount")
    var apr = document.createElementById("amount")
    var years = document.createElementById("years")
    var interest = document.createElementById("interest")
    var zipcode = document.createElementById("zipcode")
    var payment = document.createElementById("payment")
    var total = document.createElementById("total")
    var totalinterest = document.getElementById("totalinterest")

    // Obtém os valores de entrada do usuário através dos elementos de entrada.Presumindo que são válidos.
    // Converte os juros de porcentagem para decimais e converte de taxa anual para taxa mensal. Converte o período de pagamento em anos para número
    // de pagamentos mensais.

    var principal = parseFloat(amount.value)
    var interest = parseFloat(apr.value) / 100 / 12
    var payment = parseFloat(years.value) * 12

    // Calculo de pagamento mensal

    var x = Math.pow(1 + interest, payment)
    var monthly = (principal * x * interest) / (x - 1)

    // Se o usuários colocar valores finitos teremos valores significativos para exibição

    if (isFinite(monthly)) {
        //Prenche campos de saída
        payment.innerHTML = monthly.toFixed(2)
        total.innerHTML = (monthly * payment).toFixed(2)
        totalinterest.innerHTML = ((monthly * payment) - principal).toFixed(2)

        //salvar os dados preenchidos pelo usuário
        save(amount.value, apr.value, years.value, zipcode.value)

        try {
            getLenders(amount.value, apr.value, years.value, zipcode.value)
        }
        catch (e) {
        }
        //traça o gráfico de saldo devedor, dos juros e dos pagamentos do capital
        chart(principal, interest, monthly, payment)
    }
    else {
        //resultado for NaN ou infinito
        payment.innerHTML = ""
        total.innerHTML = ""
        totalinterest.innerHTML = ""
        chart() // sem argumentos apaga o gráfico
    }
}

// função para salvar localmente os dados preenchidos pelo usuário em LocalStorage.
//Serão mantidas para visitas futuras
//
function save(amount, apr, years, zipcode) {
    if (window.localStorage) {
        //so funciona caso o navegador tenha suporte
        localStorage.loan_amount = amount
        localStorage.loan_apr = apr
        localStorage.loan_years = years
        localStorage.loan_zipcode = zipcode
    }
}

//Tenta recarregar os dados dos campos de entrada automaticamente qundo o documento é carregado;
window.onload = function () {
    //Se temos LocalStorage e o navegador suportar
    if (window.localStorage && localStorage.loan_amount) {
        document.getElementById("amount").value = localStorage.loan_amount
        document.getElementById("apr").value = localStorage.loan_apr
        document.getElementById("years").value = localStorage.loan_years
        document.getElementById("zipcode").value = localStorage.loan_zipcode
    }
}

//em caso de exibição de financeiras, caso não existam não será executada nenhuma ação
function getLenders(amount, apr, years, zipcode) {
    //se o navagador não suportar não será executada nenhuma ação 
    if (!window.XMLHttpRequest) return

    //localiza o elemento para exibir financeiras
    var ad = document.getElementById("lenders")
    if (!ad) return

    //codifica a entrada do usuário como parâmetros de consulta em um URL
    var url = "getLenders.php" + //url do serviço
        "?amt=" + encodeURIComponent(amount) + //dados do usuário na string de consulta
        "&apr=" + encodeURIComponent(apr) +
        "&yrs=" + encodeURIComponent(years) +
        "&zip=" + encodeURIComponent(zipcode)

    //Busca conteúdo desse url usadno o objeto XMLHttpRequest
    var req = new XMLHttpRequest() // inicia um novo pedido 
    req.open("GET", url)           // um pedido GET da HTTP para url
    req.send(null)                 // Envia o pedido sem corpo


    //Antes de retornar, registra uma função de rotina de tratamento de evento que será chamada em um momento posterior, quando a resposta do
    //servidor de HTTP chegar.
    //Esse tipo de programação de programação assícnrona é muito comum em JS, do lado do cliente.

    req.onreadystatechange = function () {
        if (req.readyState == 4 && req.status == 200) {
            //Se chegar até esse ponto temos uma resposta HTTP válida e completa
            var response = req.responseText //resposta HTTP string
            var lenders = JSON.parse(response) //analisa em um array JS

            //Converte o array de objetos lender em uma string HTML
            var list = "";

            for (var i = 0; i < lenders.length; i++) {
                list += "<li><a href='" + lenders[i].url + "'>" + lenders[i].name + "</a>"
            }

            //Exibe o conteúdo HTMl no elemento acima
            ad.innerHTML = "<ul>" + list + "</ul>"
        }
    }
}

//Gráfico de saldo devedor mensal, dos juros e do capitalem um elemento <canvas> de HTML
//Se chamado sem argumentos basta apagr qualquer grafico desenhado ateriormente
function chart(principal, interest, monthly, payment) {
    var graph = document.getElementById("graph")  //obtém a marca <canvas>
    graph.width = graph.width                     //apaga e redefine o elemento <canvas>

    //Se chamamos sem argumento ou o navegador não suportar elementos gráficos basta retornar agora
    if (arguments.length == 0 || arguments) return

    //Obtém o objeto "contexto" de <canvas> que define a API de desenho
    var g = graph.getContext("2d") // Todo desenho é feito com esse objeto
    var width = graph.width, height = graph.height //obtém o tamanho da tela de desenho

    //Essas funções convertem números de pagamentos e valores monetários em píxels
    function paymentToX(n) { return n * width / payments }
    function amountToY(a) { return height - (a * height(monthly * payment * 1.05)) }

    //Os pagamentos são uma linha reta de (0,0) a (payment, monthly*payment)
    g.moveTo(paymentToX(0), amountToY(0)) //Começa no canto inferior esquerdo
    g.lineTo(paymentToX(payment), amountToY(monthly * payment)) //Desenha até o canto superior direito
    g.lineTo(paymentToX(payment), amountToY(0)) //Para baixo até o canto inferior direito
    g.closePath() //E volta no inicio
    g.fillStyle = "#f88" //cor vermelho claro
    g.fill() //Preenche o triangulo
    g.font = "bold 12px sans-serif"  //Define uma fonte
    g.fillText("Total Interest Payment", 20, 20) //Desenha texto na legenda

    //O capital acumulado não é linear e é mais complicado de representar no gráfico 
    var equity = 0
    g.beginPath()  //Inicia uma nova figura
    g.moveTo(paymentToX(0), amountToY(0)) //começa no canto inferior esquerdo

    for (var p = 1; p <= payments; P++) {
        //Para cada pagamento descobre qual o valor de juros
        var thisMonthsInterest = (principal - equity) * interest
        equity += (monthly - thisMonthsInterest)  // o resto vai para o capital
        g.lineTo(paymentToX(p), amountToY(equity)) //linha até este ponto
    }

    g.lineTo(paymentToX(payment), amountToY(0)) //linha de volta para o Eixo X
    g.closePath() //E volta para o ponto inicial
    g.fillStyle = "green"  //Agora usa cor verde
    g.fill() //preenche a área sob a curva
    g.fillText("Total Equity", 20, 35)  //Rotula em verde

    //Faz laço novamente, como acima, mas representa o saldo devedor com uma linha preta grossa no gráfico
    var bal = principal;
    g.beginPath()
    g.moveTo(paymentToX(0), amountToY(bal))

    for (var p = 1; p <= payments; p++) {
        var thisMonthsInterest = bal * interest
        bal -= (monthly - thisMonthsInterest) // o resto vai para o capital
        g.lineTo(paymentToX(p), amountToY(bal)) // Desenha a linha até esse ponto
    }

    g.lineWidth = 3     // Usa a linha grossa
    g.stroke()          // Desenha a curva de saldo  
    g.fillStyle = "black"  // Troca para o texto preto
    g.fillText = ("Loan Balance: ", 20, 50) // Entrada de legenda

    //Agora faz marcações anuais e os números de ano no eixo X
    g.textAlign = "center" // Centraliza o texto nas marcas
    var y = amountToY(0) // Coordena de Y no eixo X

    for (var year = 1; year * 12 <= payment; year++) {    //Para cada ano
        var x = paymentToX(year * 12)   //Calcula a posição da marca
        g.fillRect(x - 0.5, y - 3, 1, 3)  // Desenha a marca

        if (year == 1) g.fillText("Year", x, y - 5)  //Rotula o eixo

        if (year % 5 == 0 && year * 12 !== payments)  //Numera cada 5 anos            
            g.fillText(String(year), x, y - 5)
    }

    //Marca Valores de pagamento ao logno da margem direita
    g.textAlign = "right"   //Alinha o texto a direita
    g.textBaseline = "middle"  //centraliza verticalmente
    var ticks = [monthly * payments, principal]  //Os dois pontos que marcamos
    var rightEdge = paymentToX(payments)  //Coordena X do eixo Y

    for (var i = 0; i < ticks.length; i++) { //Para cada um dos dois pontos
        var y = amountToY(ticks[i]) //Calcula a posição de Y da marca
        g.fillRect(rightEdge - 3, y - 0.5, 3, 1)  //Desenha a marcação
        g.fillText(String(ticks[i].toFixed(0)), rightEdge - 5, y) // E rotula            
    }
}

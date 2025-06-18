let carro;
let velocidadeBase = 5; // A velocidade inicial do jogo
let velocidadeVertical = velocidadeBase; // Velocidade atual dos obstáculos e da rua
let obstaculos = [];
let gameOver = false;
let carroImg;
let obstaculoImg1;
let obstaculoImg2;
let obstaculoImg3;
let velocidadeLateral = 8;

// Variáveis para as faixas da estrada
let faixas = [];
let numFaixas = 5;
let alturaFaixa = 100;
let espacoEntreFaixas = 100;

// Variável para o modo de depuração (true para ver as caixas de colisão)
let modoDepuracao = false;

// --- Estados do Jogo ---
const ESTADO_TELA_INICIO = 0;
const ESTADO_JOGANDO = 1;
const ESTADO_GAME_OVER = 2;
const ESTADO_VITORIA = 3;

let estadoAtualDoJogo = ESTADO_TELA_INICIO; // O jogo começa na tela de início

// Variáveis para a dificuldade
let nivelDificuldade = 100;
let tempoParaAumentarDificuldade = 150; // Aumenta a cada 400 frames

// Posições X para as faixas dos obstáculos (para que apareçam em "pistas" definidas)
let posicoesFaixaX = [];
let numFaixasObstaculo = 3;

// --- Novas variáveis para o contador de distância e tempo ---
let distanciaTotal = 20000; // Distância total em metros
let distanciaRestante; // Distância restante para o objetivo
// AJUSTADO PARA 4 MINUTOS DE JOGO:
let duracaoMaximaJogo = 1 * 60 * 2000;
let metrosPorSegundo = distanciaTotal / (duracaoMaximaJogo / 1000); // Quantos metros são "percorridos" por segundo (20000m / 240s = ~41.67)
let tempoInicioJogo; // Armazena o millis() quando o jogo começaframe


let gameWin = false; // True se o jogador venceu (chegou ao destino), false se perdeu
let mensagemFinal = ""; // Mensagem a ser exibida na tela de Game Over/Vitória

// --- Variável para reduzir o tamanho da área de colisão ---
let fatorReducaoColisao = 0.8; // 0.8 significa 80% do tamanho original. Ajuste este valor (0.0 a 1.0)

// --- Variável para controlar a posição Y do próximo obstáculo a ser gerado ---
let proximaPosicaoYOstaculo = -400; // Começa um pouco acima da tela

// --- Variável para a fonte personalizada ---
let gameFont; // Declarada aqui

// --- Imagens de fundo para Game Over (derrota) e Vitória ---
let winScreenBgImg; // Imagem para a tela de vitória (a imagem que você pediu)

// --- NOVAS VARIÁVEIS PARA OS SONS ---
let gameOverSound;
let winSound;
let backgroundMusic; // Nova variável para a música de fundo

let audioGameOverPlayed = false; // Flag para controlar se o áudio de Game Over já foi tocado
let audioWinPlayed = false;      // Flag para controlar se o áudio de Vitória já foi tocado
let audioBackgroundPlayed = false; // Flag para controlar a música de fundo

function preload() {
    carroImg = loadImage('pixilart-drawing.png');
    obstaculoImg1 = loadImage('pixil-frame-0 (1).png');
    obstaculoImg2 = loadImage("Carro funciona porra.png");
    obstaculoImg3 = loadImage('pixil-frame-0 (2).png');
    
    // Carrega a fonte personalizada para o visual do jogo
    //gameFont = loadFont();    
    
    // Carrega a imagem de fundo para a tela de Vitória
    winScreenBgImg = loadImage('Untitled 05-26-2025 12-57-04.png');

    // --- CARREGA OS SONS ---
    gameOverSound = loadSound('crashingsound.mp3');
    winSound = loadSound('festa-junina.mp3');
    backgroundMusic = loadSound('carro acelera.mp3'); // <-- AQUI ESTÁ A ALTERAÇÃO
}

function setup() {
    createCanvas(600, 800);
    carro = {
        x: width / 2,
        y: height - 150, // Carro fixo na parte inferior da tela
        largura: 110,
        altura: 220
    };

    // Inicializa as faixas da estrada
    for (let i = 0; i < numFaixas; i++) {
        faixas.push({
            y: i * (alturaFaixa + espacoEntreFaixas) - height
        });
    }

    // Define as posições X para as "faixas" dos obstáculos
    let larguraRua = 400;
    let espacoEntreFaixasObstaculo = larguraRua / numFaixasObstaculo;
    let limiteEsquerdoRua = width / 2 - larguraRua / 2;

    for (let i = 0; i < numFaixasObstaculo; i++) {
        // Calcula o centro de cada faixa
        let laneX = limiteEsquerdoRua + (espacoEntreFaixasObstaculo / 2) + (i * espacoEntreFaixasObstaculo);
        posicoesFaixaX.push(laneX);
    }

    // Define a fonte para todo o texto do jogo
    if (gameFont) { // <-- DESCOMENTE para aplicar a fonte
        textFont(gameFont);
    }
}

function draw() {
    // O loop principal do draw agora decide qual tela mostrar
    if (estadoAtualDoJogo === ESTADO_TELA_INICIO) {
        desenharTelaInicio();
        // Reseta as flags de áudio e PARA a música de fundo
        audioGameOverPlayed = false;
        audioWinPlayed = false;
        if (backgroundMusic.isPlaying()) { // Verifica se está tocando antes de parar
            backgroundMusic.stop();
            audioBackgroundPlayed = false; // Reseta a flag
        }
    } else if (estadoAtualDoJogo === ESTADO_JOGANDO) {
        // Lógica para aumentar a velocidade progressivamente
        if (frameCount % tempoParaAumentarDificuldade === 0) { // A cada X frames
            nivelDificuldade++;
            velocidadeVertical = velocidadeBase + (nivelDificuldade * 0.5); // Aumenta 0.5 a cada nível
            // console.log("Velocidade atual: " + velocidadeVertical.toFixed(1)); // Para depuração
        }
        desenharJogo();
        // Reseta as flags de áudio
        audioGameOverPlayed = false;
        audioWinPlayed = false;

        // Inicia a música de fundo em loop APENAS se não estiver tocando
        if (!audioBackgroundPlayed) {
            backgroundMusic.loop(); // loop() faz o som tocar repetidamente
            audioBackgroundPlayed = true;
        }

    } else if (estadoAtualDoJogo === ESTADO_GAME_OVER) {
        desenharGameOver(); // Tela de derrota
        if (!audioGameOverPlayed) {
            gameOverSound.play();
            audioGameOverPlayed = true;
            if (backgroundMusic.isPlaying()) { // Para a música de fundo ao dar Game Over
                backgroundMusic.stop();
                audioBackgroundPlayed = false; // Reseta a flag
            }
        }
    } else if (estadoAtualDoJogo === ESTADO_VITORIA) {
        desenharTelaVitoria(); // Nova tela de vitória
        if (!audioWinPlayed) {
            winSound.play();
            audioWinPlayed = true;
            if (backgroundMusic.isPlaying()) { // Para a música de fundo ao ganhar
                backgroundMusic.stop();
                audioBackgroundPlayed = false; // Reseta a flag
            }
        }
    }
}

// --- FUNÇÃO PARA DESENHAR A TELA DE INÍCIO COM HISTÓRIA E INSTRUÇÕES ---
function desenharTelaInicio() {
    background(14, 33, 72)
    fill(255);
    textAlign(CENTER, CENTER);

    // Título com sombra
    textSize(60)
    fill(0,0,0)
    text("CORRIDA JUNINA", width / 2, height / 4)


    textSize(18);
    fill(255);
    // História
    text("VISH! Você está atrasado para a festa junina na casa da vovó!", width / 2, height / 2.5);
    text("O bolo de fubá, o quentão e a paçoca estão esperando...", width / 2, height / 2.5 + 30);
    text("Mas o trânsito está uma loucura! Desvie dos outros carros", width / 2, height / 2.5 + 60);
    text("e chegue antes que a festa acabe!", width / 2, height / 2.5 + 90);

    // Instruções
    textSize(22);
    fill(241 ,239,236)
    text("Como Jogar:", width / 2, height / 1.7);
    textSize(18);
    text("Use 'A' para ir para a esquerda.", width / 2, height / 1.7 + 30);
    text("Use 'D' para ir para a direita.", width / 2, height / 1.7 + 55);

    // Botão "Pressione ESPAÇO" com estilo
    fill(255, 255, 0); // Amarelo vibrante
    noStroke();
    rectMode(CENTER);
    rect(width / 2, height - 100, 350, 60, 15); // Retângulo arredondado
    fill(0); // Texto preto
    textSize(24);
    text("Pressione ESPAÇO para Começar", width / 2, height - 100);
}

// --- FUNÇÃO PARA DESENHAR O JOGO (CONTEÚDO PRINCIPAL) ---
function desenharJogo() {
    background("rgb(103, 174, 110)"); // Gramado
    fill("black");
    rectMode(CENTER);
    rect(width / 2, height / 2, 400, height); // Rua

    fill("white");
    for (let i = 0; i < faixas.length; i++) {
        rectMode(CENTER);
        rect(width / 2, faixas[i].y, 10, alturaFaixa);
        faixas[i].y += velocidadeVertical; // Move as faixas para baixo
        if (faixas[i].y > height + alturaFaixa / 2) {
            faixas[i].y = -alturaFaixa / 2 - espacoEntreFaixas;
        }
    }

    // Movimento lateral do carro
    if (keyIsDown(65)) { // Tecla A
        carro.x -= velocidadeLateral;
    }
    if (keyIsDown(68)) { // Tecla D
        carro.x += velocidadeLateral;
    }

    let larguraRua = 400;
    let limiteEsquerdoRua = width / 2 - larguraRua / 2;
    let limiteDireitoRua = width / 2 + larguraRua / 2;
    let limiteEsquerdoCarro = limiteEsquerdoRua + carro.largura / 2;
    let limiteDireitoCarro = limiteDireitoRua - carro.largura / 2;
    carro.x = constrain(carro.x, limiteEsquerdoCarro, limiteDireitoCarro);

    imageMode(CENTER);
    image(carroImg, carro.x, carro.y, carro.largura, carro.altura);

    // Desenha a caixa de colisão REDUZIDA do carro (para depuração)
    if (modoDepuracao) {
        noFill();
        stroke(255, 0, 0); // Vermelho
        rect(carro.x, carro.y, carro.largura * fatorReducaoColisao, carro.altura * fatorReducaoColisao);
        stroke(0);
    }

    // --- Loop de atualização e desenho dos obstáculos ---
    // Percorre os obstáculos e verifica o que precisa ser feito
    for (let i = obstaculos.length - 1; i >= 0; i--) {
        desenharObstaculo(obstaculos[i]);
        obstaculos[i].y += velocidadeVertical; // Move os obstáculos para baixo

        // Se o obstáculo saiu da tela por baixo, reposiciona ele em uma nova faixa
        if (obstaculos[i].y > height + obstaculos[i].altura / 2) {
            // Reposiciona o obstáculo atual
            // Calcula a próxima posição Y para garantir espaçamento
            proximaPosicaoYOstaculo -= (carro.altura + random(200, 400)); // Distância maior entre obstáculos
            obstaculos[i].y = proximaPosicaoYOstaculo;

            // Garante que este obstáculo vá para uma nova faixa (sem repetir a última usada imediatamente)
            // Escolhe uma faixa aleatória para o obstáculo
            let novaFaixaIndex = floor(random(posicoesFaixaX.length));
            obstaculos[i].x = posicoesFaixaX[novaFaixaIndex];

            // Atualiza a imagem do obstáculo para variar
            let tipoObstaculo = floor(random(3));
            if (tipoObstaculo === 0) {
                obstaculos[i].imagem = obstaculoImg1;
            } else if (tipoObstaculo === 1) {
                obstaculos[i].imagem = obstaculoImg2;
            } else {
                obstaculos[i].imagem = obstaculoImg3;
            }
        }

        // Verifica colisão
        if (verificarColisao(carro, obstaculos[i])) {
            gameOver = true;
            gameWin = false; // Perdeu por colisão
            mensagemFinal = "Você bateu! A vovó vai ficar triste...";
            estadoAtualDoJogo = ESTADO_GAME_OVER; // Muda para a tela de Game Over (derrota)
        }

        // Desenha a caixa de colisão REDUZIDA do obstáculo (para depuração)
        if (modoDepuracao) {
            noFill();
            stroke(0, 255, 0); // Verde
            rect(obstaculos[i].x, obstaculos[i].y, obstaculos[i].largura * fatorReducaoColisao, obstaculos[i].altura * fatorReducaoColisao);
            stroke(0);
        }
    }

    // --- Lógica do contador de distância e tempo ---
    if (!gameOver) {
        // Diminui a distância restante com base no tempo (deltaTime para precisão)
        distanciaRestante -= (metrosPorSegundo / 1000) * deltaTime;
        distanciaRestante = max(0, distanciaRestante); // Garante que não fique negativo

        // Verifica se a distância foi percorrida
        if (distanciaRestante <= 0) {
            gameOver = true;
            gameWin = true; // Venceu por distância
            mensagemFinal = "Parabéns! Você chegou à festa da vovó, o Bolo de Fuba e a Feijoada e o quente do quentão te aguardam!"; // Mensagem de vitória
            estadoAtualDoJogo = ESTADO_VITORIA; // Muda para a NOVA tela de Vitória
        }

        // Verifica o limite de tempo
        let tempoDecorrido = millis() - tempoInicioJogo;
        if (tempoDecorrido >= duracaoMaximaJogo && !gameWin) { // Se o tempo acabou e ainda não venceu
            gameOver = true;
            gameWin = false; // Perdeu por tempo
            mensagemFinal = "Tempo esgotado! Você não chegou a tempo...";
            estadoAtualDoJogo = ESTADO_GAME_OVER; // Muda para a tela de Game Over (derrota)
        }
    }

    // Exibe o contador de distância na tela com um fundo
    fill(0, 0, 0, 150); // Fundo preto semi-transparente
    noStroke();
    rectMode(CORNER); // Volta para CORNER para o retângulo do placar
    rect(width - 170, 10, 150, 40, 10); // Retângulo arredondado para o placar
    fill(255); // Texto branco
    textSize(24);
    textAlign(RIGHT, TOP);
    text(distanciaRestante.toFixed(0) + "m", width - 20, 20); // Arredonda para não ter casas decimais
}

// --- FUNÇÃO PARA DESENHAR A TELA DE GAME OVER (DERROTA) ---
function desenharGameOver() {
    // Usa um fundo preto sólido para a tela de derrota
    background(0);

    // Adiciona um retângulo semi-transparente para o fundo da mensagem principal
    fill(0, 0, 0, 180); // Preto com 70% de opacidade
    noStroke();
    rectMode(CENTER);
    // Aumenta a altura do retângulo de fundo para acomodar mais texto
    rect(width / 2, height / 2 - 80, width * 0.8, 220, 15);
    fill(255); // Texto branco para contrastar com o fundo preto
    textAlign(CENTER, CENTER);
    textSize(32);
    text(mensagemFinal, width / 2, height / 2 - 80, width * 0.8, 200);

    textSize(24);
    // Botão "Pressione ESPAÇO" com estilo
    fill(0, 0, 0, 150); // Fundo semi-transparente preto para o botão
    noStroke();
    rectMode(CENTER);
    rect(width / 2, height / 2 + 50, 350, 60, 15); // Retângulo arredondado
    fill(255); // Texto branco para o botão
    text("Pressione ESPAÇO para reiniciar", width / 2, height / 2 + 50);
}

// --- NOVA FUNÇÃO PARA DESENHAR A TELA DE VITÓRIA ---
function desenharTelaVitoria() {
    imageMode(CORNER); // Desenha a imagem do canto superior esquerdo
    image(winScreenBgImg, 0, 0, width, height); // Desenha a imagem de fundo para a vitória

    // Adiciona um retângulo semi-transparente para o fundo da mensagem principal
    fill(0, 0, 0, 180); // Preto com 70% de opacidade
    noStroke();
    rectMode(CENTER);
    rect(width / 2, height / 2 - 80, width * 0.8, 220, 15); // Altura ajustada para 220, Y ajustado para -80

    fill(255); // Texto branco para contrastar com o fundo preto
    textAlign(CENTER, CENTER);
    textSize(32);
    text(mensagemFinal, width / 2, height / 2 - 80, width * 0.8, 200);

    textSize(24);
    // Botão "Pressione ESPAÇO" com estilo
    fill(0, 0, 0, 150); // Fundo semi-transparente preto para o botão
    noStroke();
    rectMode(CENTER);
    rect(width / 2, height / 2 + 50, 350, 60, 15); // Retângulo arredondado
    fill(255); // Texto branco para o botão
    text("Pressione ESPAÇO para reiniciar", width / 2, height / 2 + 50);
}


function desenharObstaculo(obstaculo) {
    imageMode(CENTER);
    image(obstaculo.imagem, obstaculo.x, obstaculo.y, obstaculo.largura, obstaculo.altura);
}

// Modificada para criar um obstáculo que pode ser reutilizado
function criarObstaculo(yInicial, laneIndex) {
    let tipoObstaculo = floor(random(3));
    let imgObstaculo;

    if (tipoObstaculo === 0) {
        imgObstaculo = obstaculoImg1;
    } else if (tipoObstaculo === 1) {
        imgObstaculo = obstaculoImg2;
    } else {
        imgObstaculo = obstaculoImg3;
    }

    const larguraObstaculo = 110;
    const alturaObstaculo = 220;

    // Usa a posição X da faixa passada como parâmetro
    let obstaculoX = posicoesFaixaX[laneIndex];

    return {
        x: obstaculoX, // Posição X da faixa específica
        y: yInicial,
        largura: larguraObstaculo,
        altura: alturaObstaculo,
        imagem: imgObstaculo,
        faixa: laneIndex // Adiciona qual faixa este obstáculo está ocupando
    };
}

function verificarColisao(obj1, obj2) {
    // Calcula as dimensões efetivas da caixa de colisão com base no fator de redução
    let colisaoLargura1 = obj1.largura * fatorReducaoColisao;
    let colisaoAltura1 = obj1.altura * fatorReducaoColisao;
    let colisaoLargura2 = obj2.largura * fatorReducaoColisao; // Corrigido aqui
    let colisaoAltura2 = obj2.altura * fatorReducaoColisao;   // Corrigido aqui

    // Calcula as bordas do primeiro objeto (obj1) usando as dimensões reduzidas
    let obj1Esquerda = obj1.x - colisaoLargura1 / 2;
    let obj1Direita = obj1.x + colisaoLargura1 / 2;
    let obj1Topo = obj1.y - colisaoAltura1 / 2;
    let obj1Base = obj1.y + colisaoAltura1 / 2;

    // Calcula as bordas do segundo objeto (obj2) usando as dimensões reduzidas
    let obj2Esquerda = obj2.x - colisaoLargura2 / 2; // Corrigido aqui
    let obj2Direita = obj2.x + colisaoLargura2 / 2;   // Corrigido aqui
    let obj2Topo = obj2.y - colisaoAltura2 / 2;     // Corrigido aqui
    let obj2Base = obj2.y + colisaoAltura2 / 2;       // Corrigido aqui

    // Verifica se há sobreposição nos eixos X e Y
    let colisaoX = obj1Direita > obj2Esquerda && obj1Esquerda < obj2Direita;
    let colisaoY = obj1Base > obj2Topo && obj1Topo < obj2Base;

    return colisaoX && colisaoY;
}

function reiniciarJogo() {
    gameOver = false;
    gameWin = false; // Reseta a flag de vitória
    mensagemFinal = ""; // Limpa a mensagem final
    carro.x = width / 2; // Reseta a posição X do carro
    velocidadeVertical = velocidadeBase; // Reseta a velocidade
    nivelDificuldade = 0; // Reseta o nível de dificuldade

    distanciaRestante = distanciaTotal; // Reseta a distância
    tempoInicioJogo = millis(); // Inicia o contador de tempo do jogo

    obstaculos = [];
    // Gera um obstáculo para CADA FAIXA, garantindo que não há mais obstáculos que faixas
    let faixasDisponiveis = Array.from({
        length: numFaixasObstaculo
    }, (_, i) => i); // [0, 1, 2]
    proximaPosicaoYOstaculo = -400; // Reseta a posição Y para o primeiro grupo de obstáculos

    for (let i = 0; i < numFaixasObstaculo; i++) { // Cria apenas um obstáculo por faixa
        // Escolhe uma faixa aleatória que ainda não foi usada para este grupo inicial
        let randomIndex = floor(random(faixasDisponiveis.length));
        let chosenLane = faixasDisponiveis.splice(randomIndex, 1)[0]; // Remove a faixa escolhida

        // Posiciona os obstáculos iniciais para que fiquem bem espaçados
        let initialY = -i * (carro.altura + 250) - 400;
        obstaculos.push(criarObstaculo(initialY, chosenLane));
    }

    for (let i = 0; i < numFaixas; i++) {
        faixas[i].y = i * (alturaFaixa + espacoEntreFaixas) - height;
    }
}

// --- FUNÇÃO keyReleased() PARA DETECTAR O ESPAÇO ---
function keyReleased() {
    if (keyCode === 32) { // Tecla ESPAÇO
        if (estadoAtualDoJogo === ESTADO_TELA_INICIO) {
            reiniciarJogo(); // Prepara o jogo
            estadoAtualDoJogo = ESTADO_JOGANDO; // Inicia o jogo
        } else if (estadoAtualDoJogo === ESTADO_GAME_OVER) {
            reiniciarJogo(); // Prepara o jogo
            estadoAtualDoJogo = ESTADO_JOGANDO; // Volta a jogar
        } else if (estadoAtualDoJogo === ESTADO_VITORIA) { // Se estiver na tela de vitória
            reiniciarJogo(); // Prepara o jogo
            estadoAtualDoJogo = ESTADO_JOGANDO; // Volta a jogar
        }
    }
}
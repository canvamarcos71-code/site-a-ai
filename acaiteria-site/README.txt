AÇAÍÊ — SITE DE AÇAITERIA
==========================

ARQUIVOS
- index.html: estrutura e conteúdo.
- style.css: identidade visual, responsividade e animações.
- script.js: catálogo, montagem do açaí, carrinho e finalização via WhatsApp.
- assets/favicon.svg: favicon.
- assets/hero-loop.mp4: opcional; adicione aqui o vídeo criado no Google Flow.

COMO EXECUTAR
1. Extraia a pasta do ZIP.
2. Abra index.html no navegador. Não há build nem dependências de framework.
3. Para testar o pedido via WhatsApp, configure primeiro CONFIG.whatsappNumber em script.js.
   Alguns navegadores podem restringir recursos locais; se isso acontecer, use uma extensão
   de servidor local simples ou execute `python -m http.server 8000` dentro da pasta e abra
   http://localhost:8000.

CONFIGURAR WHATSAPP E DADOS DA LOJA
No início de script.js, edite o objeto CONFIG:
- whatsappNumber: somente números com código do país e DDD. Exemplo de formato: 55 + DDD + número.
  Não use espaços, +, parênteses ou hífens.
- instagramUrl: URL real do perfil da loja, começando com https://www.instagram.com/
- address: endereço real ou instrução de retirada.
- openingHours: horários reais.

CONFIGURAR PRODUTOS E PREÇOS
No objeto CATALOG em script.js:
- products: altere nome, descrição, tamanho, preço, badge e imagem dos quatro cards.
- sizes: altere os preços base dos tamanhos 300, 500 e 700 ml.
- toppings: altere nomes, preços e emojis dos complementos.
Os preços estão em reais e são valores de demonstração. Revise todos antes de publicar.
A barca e os combos são exemplos fictícios. Ajuste também os banners promocionais em index.html.

IMAGENS
O projeto usa URLs de imagens remotas do Unsplash como demonstração. Para produção:
1. Use fotos próprias ou imagens licenciadas para uso comercial.
2. Salve-as em assets/ e troque os atributos src no HTML e os campos image no CATALOG em script.js.
3. Mantenha os atributos alt descritivos. As imagens dos cards têm fallback visual básico caso não carreguem.

VÍDEO DO GOOGLE FLOW
1. Gere/exporte um vídeo curto em MP4, de preferência 16:9, sem áudio, com movimento suave e fundo compatível com magenta/roxo.
2. Salve-o com o nome assets/hero-loop.mp4.
3. O HTML já contém <video autoplay muted loop playsinline> com poster e camada de contraste.
4. Caso o arquivo não exista, o fundo CSS continua funcionando. Respeite a preferência de movimento reduzido do visitante.
O vídeo não foi gerado nem incluído automaticamente neste pacote.

ANTES DE PUBLICAR
- Troque marca, texto, fotos, preços e dados comerciais.
- Substitua avaliações demonstrativas por avaliações verdadeiras autorizadas, ou remova a seção.
- Configure WhatsApp e Instagram.
- Informe condições reais de entrega, taxas, disponibilidade, alergênicos e políticas da loja, se aplicável.
- Teste o pedido em celular e desktop.
- Publique em hospedagem HTTPS. O checkout abre o WhatsApp para o cliente confirmar o envio; não há envio automático.
- O projeto não processa pagamento, não calcula taxa de entrega e não confirma estoque.

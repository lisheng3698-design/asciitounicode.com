(function () {
  "use strict";
  const config = window.asciiUnicodeI18n;
  if (!config) return;
  const pageNames = {
    grayToOctal: "Gray Code to Octal",
    octalToGray: "Octal to Gray Code",
    grayToHex: "Gray Code to Hex",
    grayToBinary: "Gray Code to Binary",
    binaryToGray: "Binary to Gray Code"
  };
  const shared = {
    zh: {
      toolTitleSuffix: "精确转换", howTitleSuffix: "转换方法", codeTitleSuffix: "BigInt 代码", boundaryTitleSuffix: "输入边界与限制",
      warningInvalidGrayCode: "请输入仅含 0 和 1 的反射 Gray 码；可使用 0b 前缀、空格和下划线。",
      warningInvalidBinaryInteger: "请输入仅含 0 和 1 的普通二进制整数；可使用 0b 前缀、空格和下划线。",
      warningInvalidOctalInteger: "请输入仅含 0–7 的非负八进制整数；可使用 0o 前缀、空格和下划线。",
      warningEmpty: "请输入需要转换的值。", inputLabel: "输入", outputLabel: "输出",
      relatedCard1Text: "把十进制整数精确编码为反射 Gray 码。", relatedCard2Text: "把反射 Gray 码精确解码为十进制整数。", relatedCard3Text: "在 2–36 进制之间转换精确整数。"
    },
    es: {
      toolTitleSuffix: "conversión exacta", howTitleSuffix: "cómo convertir", codeTitleSuffix: "código con BigInt", boundaryTitleSuffix: "límites de entrada",
      warningInvalidGrayCode: "Introduce código Gray reflejado usando solo 0 y 1; se permiten 0b, espacios y guiones bajos.",
      warningInvalidBinaryInteger: "Introduce un entero binario ordinario usando solo 0 y 1; se permiten 0b, espacios y guiones bajos.",
      warningInvalidOctalInteger: "Introduce un entero octal no negativo usando solo 0–7; se permiten 0o, espacios y guiones bajos.",
      warningEmpty: "Introduce un valor para convertir.", inputLabel: "Entrada", outputLabel: "Salida",
      relatedCard1Text: "Codifica enteros decimales exactos como código Gray reflejado.", relatedCard2Text: "Decodifica código Gray reflejado a enteros decimales exactos.", relatedCard3Text: "Convierte enteros exactos entre bases 2 y 36."
    },
    pt: {
      toolTitleSuffix: "conversão exata", howTitleSuffix: "como converter", codeTitleSuffix: "código com BigInt", boundaryTitleSuffix: "limites de entrada",
      warningInvalidGrayCode: "Digite código Gray refletido usando apenas 0 e 1; 0b, espaços e sublinhados são permitidos.",
      warningInvalidBinaryInteger: "Digite um inteiro binário comum usando apenas 0 e 1; 0b, espaços e sublinhados são permitidos.",
      warningInvalidOctalInteger: "Digite um inteiro octal não negativo usando apenas 0–7; 0o, espaços e sublinhados são permitidos.",
      warningEmpty: "Digite um valor para converter.", inputLabel: "Entrada", outputLabel: "Saída",
      relatedCard1Text: "Codifique inteiros decimais exatos como código Gray refletido.", relatedCard2Text: "Decodifique código Gray refletido em inteiros decimais exatos.", relatedCard3Text: "Converta inteiros exatos entre as bases 2 e 36."
    },
    fr: {
      toolTitleSuffix: "conversion exacte", howTitleSuffix: "méthode de conversion", codeTitleSuffix: "code BigInt", boundaryTitleSuffix: "limites de saisie",
      warningInvalidGrayCode: "Saisissez un code Gray réfléchi composé uniquement de 0 et 1 ; 0b, espaces et tirets bas sont acceptés.",
      warningInvalidBinaryInteger: "Saisissez un entier binaire ordinaire composé uniquement de 0 et 1 ; 0b, espaces et tirets bas sont acceptés.",
      warningInvalidOctalInteger: "Saisissez un entier octal non négatif composé uniquement de 0 à 7 ; 0o, espaces et tirets bas sont acceptés.",
      warningEmpty: "Saisissez une valeur à convertir.", inputLabel: "Entrée", outputLabel: "Sortie",
      relatedCard1Text: "Encodez des entiers décimaux exacts en code Gray réfléchi.", relatedCard2Text: "Décodez le code Gray réfléchi en entiers décimaux exacts.", relatedCard3Text: "Convertissez des entiers exacts entre les bases 2 et 36."
    },
    de: {
      toolTitleSuffix: "exakte Konvertierung", howTitleSuffix: "Konvertierung", codeTitleSuffix: "BigInt-Code", boundaryTitleSuffix: "Eingabegrenzen",
      warningInvalidGrayCode: "Geben Sie reflektierten Gray-Code nur mit 0 und 1 ein; 0b, Leerzeichen und Unterstriche sind zulässig.",
      warningInvalidBinaryInteger: "Geben Sie eine gewöhnliche Binärzahl nur mit 0 und 1 ein; 0b, Leerzeichen und Unterstriche sind zulässig.",
      warningInvalidOctalInteger: "Geben Sie eine nichtnegative Oktalzahl nur mit 0–7 ein; 0o, Leerzeichen und Unterstriche sind zulässig.",
      warningEmpty: "Geben Sie einen Wert zum Konvertieren ein.", inputLabel: "Eingabe", outputLabel: "Ausgabe",
      relatedCard1Text: "Kodiert exakte Dezimalzahlen als reflektierten Gray-Code.", relatedCard2Text: "Dekodiert reflektierten Gray-Code in exakte Dezimalzahlen.", relatedCard3Text: "Konvertiert exakte Ganzzahlen zwischen den Basen 2 und 36."
    },
    ja: {
      toolTitleSuffix: "正確な変換", howTitleSuffix: "変換方法", codeTitleSuffix: "BigInt コード", boundaryTitleSuffix: "入力境界と制限",
      warningInvalidGrayCode: "0 と 1 だけの反射 Gray コードを入力してください。0b、空白、アンダースコアを使用できます。",
      warningInvalidBinaryInteger: "0 と 1 だけの通常の二進整数を入力してください。0b、空白、アンダースコアを使用できます。",
      warningInvalidOctalInteger: "0～7 だけの非負八進整数を入力してください。0o、空白、アンダースコアを使用できます。",
      warningEmpty: "変換する値を入力してください。", inputLabel: "入力", outputLabel: "出力",
      relatedCard1Text: "十進整数を正確な反射 Gray コードへ符号化します。", relatedCard2Text: "反射 Gray コードを正確な十進整数へ復号します。", relatedCard3Text: "2～36 進数の間で整数を正確に変換します。"
    },
    ko: {
      toolTitleSuffix: "정확한 변환", howTitleSuffix: "변환 방법", codeTitleSuffix: "BigInt 코드", boundaryTitleSuffix: "입력 경계와 제한",
      warningInvalidGrayCode: "0과 1로만 된 반사 Gray 코드를 입력하세요. 0b, 공백, 밑줄을 사용할 수 있습니다.",
      warningInvalidBinaryInteger: "0과 1로만 된 일반 이진 정수를 입력하세요. 0b, 공백, 밑줄을 사용할 수 있습니다.",
      warningInvalidOctalInteger: "0–7로만 된 음이 아닌 8진 정수를 입력하세요. 0o, 공백, 밑줄을 사용할 수 있습니다.",
      warningEmpty: "변환할 값을 입력하세요.", inputLabel: "입력", outputLabel: "출력",
      relatedCard1Text: "십진 정수를 정확한 반사 Gray 코드로 인코딩합니다.", relatedCard2Text: "반사 Gray 코드를 정확한 십진 정수로 디코딩합니다.", relatedCard3Text: "2–36진수 사이에서 정수를 정확히 변환합니다."
    }
  };
  for (const [pageKey, name] of Object.entries(pageNames)) {
    for (const [lang, values] of Object.entries(shared)) {
      Object.assign(config.pages[pageKey][lang], values, {
        toolTitle: name + " — " + values.toolTitleSuffix,
        howTitle: name + " — " + values.howTitleSuffix,
        codeTitle: name + " — " + values.codeTitleSuffix,
        boundaryTitle: name + " — " + values.boundaryTitleSuffix
      });
    }
  }
  const homeKeys = {
    relatedGrayOctal: "Gray Code to Octal Converter",
    relatedOctalGray: "Octal to Gray Code Converter",
    relatedGrayHex: "Gray Code to Hex Converter",
    relatedGrayBinary: "Gray Code to Binary Converter",
    relatedBinaryGray: "Binary to Gray Code Converter"
  };
  for (const [lang, values] of Object.entries(shared)) {
    const home = {};
    for (const [key, title] of Object.entries(homeKeys)) {
      home[key + "Title"] = title;
      home[key + "Text"] = lang === "zh" ? "使用精确 BigInt 与严格输入校验完成专用转换。" :
        lang === "ja" ? "正確な BigInt と厳密な入力検証で専用変換を行います。" :
        lang === "ko" ? "정확한 BigInt와 엄격한 입력 검사로 전용 변환을 수행합니다." :
        lang === "es" ? "Conversión específica con BigInt exacto y validación estricta." :
        lang === "pt" ? "Conversão específica com BigInt exato e validação estrita." :
        lang === "fr" ? "Conversion dédiée avec BigInt exact et validation stricte." :
        "Spezialisierte Konvertierung mit exaktem BigInt und strenger Prüfung.";
    }
    config.home[lang] = Object.assign(config.home[lang] || {}, home);
  }
})();

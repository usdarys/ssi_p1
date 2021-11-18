const { exit } = require("process");
const { appendFile, writeFile } = require("fs/promises");
const params = require("./params");

const a = params.a;
const b = params.b;
const c = params.c;
const liczbaWykonanProgramu = params.liczbaWykonanProgramu;
const liczbaPopulacji = params.liczbaPopulacji;
const liczbaOsobnikowPopulacji = params.liczbaOsobnikowPopulacji;
const prawdopodobienstwoKrzyzowania = params.prawdopodobienstwoKrzyzowania;
const prawdopodobienstwoMutacji = params.prawdopodobienstwoMutacji;
const resultFile = params.resultFile;

if (liczbaPopulacji * liczbaOsobnikowPopulacji >= params.limitPrzetwarzanychOsobnikow) {
    console.error("\x1b[31m", `Error: Liczba przetwarzanych osobnikow (liczba populacji * liczba osobnikow w populacji) jest wieksza niz ${params.limitPrzetwarzanychOsobnikow}`);
    exit(0);
}

(async () => {
    let populacja = [], f, najlepszyOsobnik;

    try {
        await writeFile(resultFile, '');
    } catch (err) {
        console.error("\x1b[31m", err);
    }

    for (let i = 0; i < liczbaWykonanProgramu; i++) {
        populacja = wygenerujPopulacjeStartowa(liczbaOsobnikowPopulacji, true);

        for (let j = 0; j < liczbaPopulacji; j++) {
            populacja = krzyzujPopulacje(populacja);
            populacja = mutujPopulacje(populacja);
            populacja = wybierzOsobnikow(populacja);
        }

        najlepszyOsobnik = maxOsobnik(populacja);
        f = funkcjaKwadratowa(a, b, c, najlepszyOsobnik);

        try {
            await appendFile(resultFile, `${f} ${najlepszyOsobnik}${(i < (liczbaWykonanProgramu - 1)) ? '\n' : ''}`);
        } catch (err) {
            console.error("\x1b[31m", err);
        }
    }
})();

/**
 * 
 * @param {number[]} populacja 
 * @returns {number} Osobnik, dla ktorego funkcja ma najwieksza wartosc
 */
function maxOsobnik(populacja) {
    let f, fMax, osobnik;
    osobnik = populacja[0];
    fMax = funkcjaKwadratowa(a, b, c, osobnik);
    for (let j = 1; j < populacja.length; j++) {
        f = funkcjaKwadratowa(a, b, c, populacja[j]);
        if (f > fMax) {
            osobnik = populacja[j];
            fMax = f;
        }
    }
    return osobnik;
}

/**
 * 
 * @param {number[]} populacja 
 * @returns {number} Osobnik, dla ktorego funkcja ma najmniejsza wartosc
 */
 function minOsobnik(populacja) {
    let f, fMin, osobnik;
    osobnik = populacja[0];
    fMin = funkcjaKwadratowa(a, b, c, osobnik);
    for (let j = 1; j < populacja.length; j++) {
        f = funkcjaKwadratowa(a, b, c, populacja[j]);
        if (f < fMin) {
            osobnik = populacja[j];
            fMin = f;
        }
    }
    return osobnik;
}

/**
 * 
 * @param {number} liczbaOsobnikowPopulacji 
 * @param {boolean} zwracanie czy losowac osobnikow ze zwracaniem
 * @returns {number[]}
 */
 function wygenerujPopulacjeStartowa(liczbaOsobnikowPopulacji, zwracanie) {
    let populacja = [];

    if (zwracanie) {
        for (let i = 0; i < liczbaOsobnikowPopulacji; i++) {
            populacja.push(getRandomInt(0, 256));
        }
    } else {
        populacja = shuffle([...Array(256).keys()]);
        populacja = populacja.slice(0, liczbaOsobnikowPopulacji);
    }

    return populacja;
}

/**
 * 
 * @param {number[]} populacja 
 * @returns {number[]}
 */
 function krzyzujPopulacje(populacja) {
    let skrzyzowanaPopulacja = [], para = [];

    populacja = shuffle(populacja);

    while (populacja.length > 1) {
        para = [populacja[0], populacja[1]];
        populacja.splice(0, 2);
        if (Math.random() > prawdopodobienstwoKrzyzowania) {
            skrzyzowanaPopulacja = skrzyzowanaPopulacja.concat(para);
        } else {
            skrzyzowanaPopulacja = skrzyzowanaPopulacja.concat(krzyzujOsobniki(para));
        }
    }

    // jezeli zostal osobnik bez pary to przechodzi dalej
    if (populacja.length) {
        skrzyzowanaPopulacja.push(populacja[0]);
    }

    return skrzyzowanaPopulacja;
}

/**
 * 
 * @param {number[]} para 
 * @returns {number[]} skrzyzowana para
 */
function krzyzujOsobniki(para) {
    const punktPrzeciecia = getRandomInt(1, 8);
    para = konwertujPopulacjeNaKodowanieBinarne(para);

    let tmp = para[0];
    para[0] = para[0].slice(0, punktPrzeciecia).concat(para[1].slice(punktPrzeciecia));
    para[1] = para[1].slice(0, punktPrzeciecia).concat(tmp.slice(punktPrzeciecia));

    return konwertujPopulacjeNaKodowanieDziesietne(para);
}

/**
 * 
 * @param {number[]} populacja 
 * @returns {number[]}
 */
function mutujPopulacje(populacja) {
    populacja = konwertujPopulacjeNaKodowanieBinarne(populacja);
    populacja.forEach(osobnik => {
        osobnik.forEach((gen, i) => {
            if (Math.random() <= prawdopodobienstwoMutacji) {
                osobnik[i] = (gen === '1') ? '0' : '1';
            }
        });
    });
    return konwertujPopulacjeNaKodowanieDziesietne(populacja);
}

/**
 * 
 * @param {number[]} populacja 
 * @returns {number[]}
 */
function wybierzOsobnikow(populacja) {
    let populacjaPoSelekcji = [], los;

    const st = Math.abs(funkcjaKwadratowa(a, b, c, minOsobnik(populacja)));

    let funkcja = (a, b, c, x) => {
        return funkcjaKwadratowa(a, b, c, x) + st;
    }

    let sumarycznaWartoscFunkcji = 0;
    populacja.forEach(x => {
        sumarycznaWartoscFunkcji += funkcja(a, b, c, x);
    });

    let prawdopodobienstwaWybraniaOsobnikow = [];
    populacja.forEach(x => {
        prawdopodobienstwaWybraniaOsobnikow.push(funkcja(a, b, c, x) / sumarycznaWartoscFunkcji);
    });

    let przedzialy = [];
    let granicaPrzedzialu = 0;
    prawdopodobienstwaWybraniaOsobnikow.forEach((p, i) => {
        przedzialy[i] = {};
        przedzialy[i].poczatek = granicaPrzedzialu;
        granicaPrzedzialu += p;
        przedzialy[i].koniec = granicaPrzedzialu;
    });

    for (let i = 0; i < populacja.length; i++) {
        los = Math.random();
        for (let j = 0; j < przedzialy.length; j++) {
            if (los >= przedzialy[j].poczatek && los < przedzialy[j].koniec) {
                populacjaPoSelekcji.push(populacja[j]);
            }
        }
    }

    return populacjaPoSelekcji;
}

/**
 * 
 * @param {number[]} populacja w postaci dziesietnej [1, 3]
 * @returns {string[][]} populacja w postaci binarnej [['0','1'], ['1','1']]
 */
function konwertujPopulacjeNaKodowanieBinarne(populacja) {
    return populacja.map(osobnik => {
        osobnik = osobnik.toString(2).split('');

        if (osobnik.length < 8) {
            let dopelnienie = [];
            for (let j = 0; j < (8 - osobnik.length); j++) {
                dopelnienie.push('0');
            }
            osobnik = dopelnienie.concat(osobnik);
        }

        return osobnik;
    });
}

/**
 * 
 * @param {string[][]} populacja w postaci binarnej [['0','1'], ['1','1']]
 * @returns {number[]} populacja w postaci dziesietnej [1, 3]
 */
function konwertujPopulacjeNaKodowanieDziesietne(populacja) {
    return populacja.map(osobnik => parseInt(osobnik.join(''), 2));
}

/**
 * 
 * @param {number} a 
 * @param {number} b 
 * @param {number} c 
 * @param {number} x 
 * @returns {number}
 */
function funkcjaKwadratowa(a, b, c, x) {
    return (a * x * x) + (b * x) + c;
}

/**
 * 
 * @param {number} min 
 * @param {number} max 
 * @returns {number} Liczba Int z zakresu [min, max)
 */
function getRandomInt(min, max) {
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(Math.random() * (max - min) + min);
}  

/**
 * 
 * @param {number[]} arr 
 * @returns {number[]}
 */
function shuffle(arr) {
    let currentIndex = arr.length, randomIndex;
    while (currentIndex != 0) {
      randomIndex = Math.floor(Math.random() * currentIndex);
      currentIndex--;
      [arr[currentIndex], arr[randomIndex]] = [arr[randomIndex], arr[currentIndex]];
    }
    return arr;
}
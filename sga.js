// Pojedyncza pętla (wykonanie głownego programu) powinno zwrocic: 
// - najlepszyOsobnik osobnik z ostatniej populacji
// - wartosc funkcji dla najlepszego osobnika
// 
// Glowna petla to:
// 1. Wygenerowanie startowej populacji osobnikow?
// 2. From 0 to liczbaPopulacji:
//    - krzyzowanie osobnikow w populacji - wynik to populacja tymczasowa po krzyzowaniu
//    - mutacja osobików w populacji - wynik to populacja tymczasowa po mutacji
//    - selekcja osobnikow do nastepnej populacji - wynik to populacja potomna
// 
// Pytania / niejasności:
// - osobnik to liczba z przedzialu <0,255> - starowi osobnicy to liczby losowe z dopuszczalnego przedzialu?
// - czy liczbaPopulacji ma uwzględniać populację początkową czy chodzi o otrzymane przez program populacje?

const params = require("./params");
const { exit } = require("process");
const { appendFile } = require("fs/promises");

const a = params.a;
const b = params.b;
const c = params.c;
const liczbaWykonanProgramu = params.liczbaWykonanProgramu;
const liczbaPopulacji = params.liczbaPopulacji;
const liczbaOsobnikowPopulacji = params.liczbaOsobnikowPopulacji;
const prawdopodobienstwoKrzyzowania = params.prawdopodobienstwoKrzyzowania;
const prawdopodobienstwoMutacji = params.prawdopodobienstwoMutacji;

if (liczbaPopulacji * liczbaOsobnikowPopulacji >= 150) {
    console.error("\x1b[31m", "Error: Liczba przetwarzanych osobnikow jest wieksza niz 150");
    exit(0);
}

main();

async function main() {
    let populacja = [], f, fMax, najlepszyOsobnik;

    for (let i = 0; i < liczbaWykonanProgramu; i++) {
        populacja = wygenerujPopulacjeStartowa(liczbaOsobnikowPopulacji, true);

        for (let j = 0; j < liczbaPopulacji; j++) {
            populacja = krzyzujPopulacje(populacja);
            populacja = mutujPopulacje(populacja);
            populacja = wybierzOsobnikow(populacja);
        }

        // wybierz najlepszego osobnika z ostatniej populacji
        najlepszyOsobnik = populacja[0];
        fMax = funkcjaKwadratowa(a, b, c, najlepszyOsobnik);
        for (let j = 1; j < populacja.length; j++) {
            f = funkcjaKwadratowa(a, b, c, populacja[j]);
            if (f > fMax) {
                najlepszyOsobnik = populacja[j];
                fMax = f;
            }
        }

        // zapisz wynik do pliku
        //const result = `${fMax} ${najlepszyOsobnik}`;
        //await appendFile('results.txt', result);
    }
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
 * TODO: dodać stałą na zabezpieczenie przed ujemna funkcja
 * @param {number[]} populacja 
 * @returns {number[]}
 */
function wybierzOsobnikow(populacja) {
    let populacjaPoSelekcji = [], los;

    let sumarycznaWartoscFunkcji = 0;
    populacja.forEach(x => {
        sumarycznaWartoscFunkcji += funkcjaKwadratowa(a, b, c, x);
    });

    let prawdopodobienstwaWybraniaOsobnikow = [];
    populacja.forEach(x => {
        prawdopodobienstwaWybraniaOsobnikow.push(funkcjaKwadratowa(a, b, c, x) / sumarycznaWartoscFunkcji);
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
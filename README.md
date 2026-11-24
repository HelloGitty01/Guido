# Guido

Simulatore di guida di Hopthop Studio, © 2026.

Simulatore di guida nel browser (Three.js). Si apre da GitHub Pages: `https://hellogitty01.github.io/Guido/`.

Il gioco è ambientato nella **Repubblica di Ornavia**, una micronazione inventata:
- dieci città diverse: Valdorna (la capitale), Porto Calvino, Lido Serena, Ravenzo, Castellago, Montecastro, Pievalta, San Rocco Terme, Ferrandina e Collebruna;
- l'autostrada A1 ad anello (circa 47 km) e le statali panoramiche lungo il lago, la costa e i passi di montagna;
- paesi, cascine con le mucche, zone industriali, il porto con le navi e le barche sul lago e in mare;
- traffico e pedoni più fitti in città, più radi fuori e in montagna.

Il mondo è generato in anticipo da `tools/ornavia/gen2.py` (Python, numpy, scipy, scikit-image, Pillow) e salvato in `models/ornavia.json`.

Modelli 3D: vedi "Crediti" nel gioco.

## Struttura del codice

- `index.html`: pagina, stili, schermata di caricamento e caricatore.
- `js/`: il codice del gioco diviso per argomento (`01_base.js` … `14_mondo_ornavia.js`). Il caricatore scarica le parti in parallelo e le esegue insieme come un unico programma, nell'ordine dei numeri: una funzione o variabile definita in una parte è visibile in tutte le altre.
- `models/`: modelli 3D e dati del mondo; `cockpit/`: abitacoli; `shots/` e `img/`: riprese e logo del caricamento; `music/`: sigla e brani di Radio Guido.

const newGuess = document.querySelector("#new-guess");
const message = document.querySelector("#message");
const lowHigh = document.querySelector("#low-high");
const checkButton = document.querySelector("#check");
const restartButton = document.querySelector("#restart");
const root = document.querySelector(":root");

let previousGuesses = [];
let theGuess;
window.onload = newRandom();
newGuess.focus();
 
// χειριστές συμβάντων
// ορίζει χειριστή στο πεδίο κειμένου newGuess για το συμβάν "keypress" τη συνάρτηση checkKey
// με "keypress" υπάρχει η αναμενόμενη συμπεριφορά όταν το restartButton έχει το focus
newGuess.addEventListener("keypress", checkKey);
// ορίζει χειριστή στο πλήκτρο checkButton για το συμβάν "click" τη συνάρτηση checkGuess
checkButton.addEventListener("click", checkGuess);
// ορίζει χειριστή στο πλήκτρο restartButton για το συμβάν "click" τη συνάρτηση restart
restartButton.addEventListener("click", restart);

function newRandom(){
/* συνάρτηση που βρίσκει ένα τυχαίο αριθμό μεταξύ 1 και 100 και τον εκχωρεί στη μεταβλητή theGuess */
    // υπολογίζει έναν τυχαίο αριθμό στο διάστημα [min, max]
    const min = 1; // κάτω όριο 1
    const max = 100; // πάνω όριο 100
    // ισοδυναμεί με theGuess = Math.floor(Math.random() * 100 + 1);
    theGuess = Math.floor(Math.random() * (max - min + 1) + min);
}

function checkKey(e){
/* συνάρτηση που όταν ο χρήστης πατήσει <<enter>> καλεί τη συνάρτηση που αποτελεί τον κεντρικό ελεγκτή του παιχνιδιού */
    // για δοκιμαστική προβολή των keys που πατιούνται
    // console.log(e.key);
    // αν το key του event είναι "Enter", τότε καλεί τη συνάρτηση checkGuess
    if (e.key === "Enter") {
        checkGuess();
    }
}

function checkGuess(){
/* συνάρτηση checkGuess η οποία καλείται είτε όταν ο χρήστης πατήσει <<enter>>
στο πεδίο "new-guess" είτε όταν πατήσει το πλήκτρο "check", η οποία είναι ο κεντρικός ελεγκτής,
καλεί τη συνάρτηση processGuess (η οποία αποφαίνεται για την ορθότητα του αριθμού) και κάνει
τις κατάλληλες ενέργειες για να μην μπορεί να εισάγει ο χρήστης νέο αριθμό ή να ανασταλεί η
λειτουργία του <<enter>>, εμφάνιση του πλήκτρου 'restart' και την εξαφάνιση του πλήκτρου 'check'
σε περίπτωση ολοκλήρωσης του παιχνιδιού. */
    // καλεί τη συνάρτηση processGuess με όρισμα την τιμή του πεδίου κειμένου newGuess
    // στη μεταβλητή gameState αποθηκεύεται η τιμή που επιστρέφει η συνάρτηση processGuess
    let gameState = processGuess(newGuess.value);
    // μηδενίζει την τιμή του πεδίου κειμένου newGuess και του δίνει το focus
    newGuess.value = "";
    newGuess.focus();
    // αν η μεταβλητή gameState δεν έχει τιμή "gameOn" (άρα έχει τιμή "win" ή "lost", έχει ολοκληρωθεί το παιχνίδι)
    // τότε απενεργοποιείται το πεδίο κειμένου newGuess (προσθέτει την ιδιότητα "disabled" στο newGuess)
    // το πλήκτρο checkButton εξαφανίζεται
    // το πλήκτρο restartButton εμφανίζεται και παίρνει το focus
    if (gameState !== "gameOn") {
        newGuess.setAttribute("disabled", "");
        checkButton.style.visibility = "hidden";
        restartButton.style.visibility = "visible";
        restartButton.focus();
    }
}

// βοηθητική συνάρτηση που ελέγχει αν ένα string είναι ακέραιος αριθμός
// μετατρέπει το string σε αριθμό, αφαιρεί το δεκαδικό μέρος αν υπάρχει, το μετατρέπει ξανά σε string
// και ελέγχει αν είναι ίδιο με το αρχικό
// αποκλείει τις περιπτώσεις Infinity, -Infinity και NaN
// επιστρέφει true ή false
function isInteger(str) {
    return (str === String(Math.round(Number(str))) && isFinite(str));
}

function processGuess(newValue){
 /* συνάρτηση processGuess(newValue) η οποία καλείται από τη συνάρτηση checkGuess,
 περιέχει τη λογική του παιχνιδιού, ελέγχει αν η τιμή του χρήστη είναι σωστή, ή αν το παιχνίδι έχει
 τελειώσει χωρίς ο χρήστης να έχει βρει τον αριθμό, και επιστρέφει αντίστοιχα την τιμή "win", ή "lost",
 δημιουργεί και εμφανίζει τα κατάλληλα μηνύματα, αλλάζοντας το χρώμα του στοιχείου μηνυμάτων.
 Όλα τα μηνύματα του προγράμματος εμανίζονται από την processGuess(). */
    // μέγιστος αριθμός προσπαθειών 10
    // αν η είσοδος είναι ακέραιος αριθμός (έλεγχος με τη συνάρτηση isInteger), τότε
    // μετατρέπει την είσοδο σε αριθμό για επεξεργασία
    // προσθέτει την τιμή στον πίνακα previousGuesses (μόνο οι ακέραιοι αριθμοί μετράνε ως προσπάθειες)
    // εμφανίζει τον πίνακα previousGuesses στην περιοχή μηνυμάτων lowHigh
    // ως template string, με τη μέθοδο join(" ") για να αφαιρεθούν τα κόμματα και τη μέθοδο trim() για να αφαιρεθούν τα κενά
        // αν η είσοδος είναι ο μυστικός αριθμός, τότε
        // αλλάζει το χρώμα υποβάθρου της περιοχής μηνυμάτων message σε --msg-win-color
        // παίρνει από το στοιχείο root την τιμή με τη συνάρτηση getComputedStyle και τη μέθοδο getPropertyValue
        // εμφανίζει το κατάλληλο μήνυμα στην περιοχή μηνυμάτων message
        // και επιστρέφει την τιμή "win"
        // αλλιώς εμφανίζει τα κατάλληλα μηνύματα στην περιοχή μηνυμάτων message
    // αν η είσοδος δεν είναι ακέραιος αριθμός, τότε
    // εμφανίζει το κατάλληλο μήνυμα στην περιοχή μηνυμάτων message
    // αν το μήκος του πίνακα έχει φτάσει στο μέγιστο αριθμό προσπαθειών και η είσοδος δεν είναι ο μυστικός αριθμός, τότε
    // εμφανίζει το κατάλληλο μήνυμα στην περιοχή μηνυμάτων message
    // και επιστρέφει την τιμή "lost"
    // σε κάθε άλλη περίπτωση επιστρέφει την τιμή "gameOn", συνεχίζεται το παιχνίδι
    const maxLength = 10;
    if (isInteger(newValue)) {
        newValue = Number(newValue);
        previousGuesses.push(newValue);
        lowHigh.innerHTML = `Προηγούμενες προσπάθειες: ${previousGuesses.join(" ").trim()}`;
        if (newValue === theGuess) {
            message.style.backgroundColor = getComputedStyle(root).getPropertyValue("--msg-win-color");
            message.innerHTML = "Μπράβο, το βρήκες!";
            return "win";
        }
        else if (newValue > theGuess) {
            message.innerHTML = "Λάθος, το ξεπέρασες";
        }
        else if (newValue < theGuess) {
            message.innerHTML = "Λάθος, είσαι πιο χαμηλά";
        }
    }
    else {
        message.innerHTML = "Δώσε ακέραιο αριθμό!";
    }
    if (previousGuesses.length === maxLength && newValue !== theGuess) {
        message.innerHTML = "Τέλος παιχνιδιού, έχασες";
        return "lost";
    }
    return "gameOn";
}

function restart(){
/* συνάρτηση restart η οποία καλείται όταν ο χρήστης πατήσει το πλήκτρο 'restart' και επανεκινεί τη διαδικασία */
    // αδειάζει τον πίνακα previousGuesses από στοιχεία
    // καλεί τη συνάρτηση newRandom για να δημιουργήσει ένα νέο μυστικό αριθμό μεταξύ 1 και 100
    // ενεργοποιεί το πλαίσιο κειμένου newGuess (αφαιρεί την ιδιότητα "disabled" από το newGuess)
    // μηδενίζει την τιμή του newGuess και του δίνει το focus
    // το πλήκτρο checkButton εμφανίζεται
    // το πλήκτρο restartButton εξαφανίζεται
    // αλλάζει το χρώμα υποβάθρου της περιοχής μηνυμάτων message σε --msg-wrong-color
    // παίρνει την τιμή από το στοιχείο root με τη συνάρτηση getComputedStyle και τη μέθοδο getPropertyValue
    // αδειάζουν τα περιεχόμενα των περιοχών μηνυμάτων message και lowHigh
    // επιστρέφει false
    previousGuesses = [];
    newRandom();
    newGuess.removeAttribute("disabled");
    newGuess.value = "";
    newGuess.focus();
    checkButton.style.visibility = "visible";
    restartButton.style.visibility = "hidden";
    message.style.backgroundColor = getComputedStyle(root).getPropertyValue("--msg-wrong-color");
    message.innerHTML = "";
    lowHigh.innerHTML = "";
    return false;
}

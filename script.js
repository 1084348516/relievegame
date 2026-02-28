document.addEventListener('DOMContentLoaded', () => {
    const gameBoard = document.getElementById('game-board');
    const slotArea = document.getElementById('slot-area');
    const resetButton = document.getElementById('reset-button');
    const holdButton = document.getElementById('hold-button');
    const undoButton = document.getElementById('undo-button');
    const holdArea = document.getElementById('hold-area');
    const levelDisplay = document.getElementById('level-display');

    const cardTypes = ['🐑', '🐔', '🐷', '🐮', '🐰', '🐶', '🐱', '🐻', '🐼', '🐨', '🐯', '🦁', '🐸', '🐵', '🦊', '🐴', '🦄', '🦓', '🦉', '🦋', '🐢', '🐍', '🐳', '🐬', '🍎', '🍉', '🍌', '🍍', '🥕', '🥦'];
    let cards = [];
    let slots = [];
    let heldCard = null;
    let history = [];
    let level = 1;


    function loadGame() {
        const savedLevel = localStorage.getItem('sheepGameLevel');
        if (savedLevel) {
            level = parseInt(savedLevel, 10);
        }
    }

    function saveGame() {
        localStorage.setItem('sheepGameLevel', level);
    }


    function initGame() {
        gameBoard.innerHTML = '';
        slotArea.innerHTML = '';
        cards = [];
        slots = [];
        heldCard = null;
        history = [];
        levelDisplay.textContent = `Level: ${level}`;
        generateCards();
        renderCards();
        renderHoldArea();
    }

    function generateCards() {
        let sets;

        if (level === 1) {
            // Level 1: Very Easy
            sets = 10; // 30 cards total
        } else if (level === 2) {
            // Level 2: Slightly Harder
            sets = 20; // 60 cards total
        } else {
            // Level 3+: Very, Very Hard
            const levelFactor = level - 2;
            // Exponential growth for the number of card sets
            sets = 20 * Math.pow(1.8, levelFactor);
            sets = Math.floor(sets);
        }

        let types = [];
        // Use a different variety of cards for each level
        const availableTypes = [...cardTypes].sort(() => Math.random() - 0.5);

        for (let i = 0; i < sets; i++) {
            // Cycle through the available types
            const type = availableTypes[i % availableTypes.length];
            types.push(type, type, type);
        }
        
        // Shuffle the final list of cards to be placed on the board
        types = types.sort(() => Math.random() - 0.5);

        // `cards` is already cleared in initGame, so we just populate it.
        for (let i = 0; i < types.length; i++) {
            const card = {
                id: i,
                type: types[i],
                x: Math.floor(Math.random() * (320 - 40)),
                y: Math.floor(Math.random() * (320 - 40)),
                zIndex: i, // Creates a stack, higher index is on top
                isCovered: false
            };
            cards.push(card);
        }
        checkCoveredCards();
    }


    function checkCoveredCards() {
        for (let i = 0; i < cards.length; i++) {
            const cardA = cards[i];
            cardA.isCovered = false;
            for (let j = 0; j < cards.length; j++) {
                if (i === j) continue;
                const cardB = cards[j];
                if (
                    cardA.zIndex < cardB.zIndex &&
                    cardA.x < cardB.x + 40 &&
                    cardA.x + 40 > cardB.x &&
                    cardA.y < cardB.y + 40 &&
                    cardA.y + 40 > cardB.y
                ) {
                    cardA.isCovered = true;
                    break;
                }
            }
        }
    }

    function renderCards() {
        gameBoard.innerHTML = '';
        cards.forEach(card => {
            const cardElement = document.createElement('div');
            cardElement.classList.add('card');
            cardElement.textContent = card.type;
            cardElement.style.left = `${card.x}px`;
            cardElement.style.top = `${card.y}px`;
            cardElement.style.zIndex = card.zIndex;
            if (card.isCovered) {
                cardElement.classList.add('disabled');
            }
            cardElement.addEventListener('click', () => onCardClick(card));
            gameBoard.appendChild(cardElement);
        });
    }

    function onCardClick(card) {
        if (card.isCovered || slots.length >= 7) return;

        history.push(JSON.parse(JSON.stringify({ cards, slots, heldCard })));

        // Move card to slot
        slots.push(card.type);
        cards = cards.filter(c => c.id !== card.id);

        checkCoveredCards();
        renderCards();
        renderSlots();
        checkMatches();
    }

    function holdCard() {
        if (!heldCard && slots.length > 0) {
            history.push(JSON.parse(JSON.stringify({ cards, slots, heldCard })));
            heldCard = slots.pop();
            renderSlots();
            renderHoldArea();
        } else if (heldCard) {
            history.push(JSON.parse(JSON.stringify({ cards, slots, heldCard })));
            slots.push(heldCard);
            heldCard = null;
            renderSlots();
            renderHoldArea();
            checkMatches();
        }
    }

    function undo() {
        if (history.length > 0) {
            const lastState = history.pop();
            cards = lastState.cards;
            slots = lastState.slots;
            heldCard = lastState.heldCard;
            renderAll();
        }
    }

    function renderAll() {
        renderCards();
        renderSlots();
        renderHoldArea();
    }

    function renderHoldArea() {
        holdArea.innerHTML = '';
        if (heldCard) {
            const cardElement = document.createElement('div');
            cardElement.classList.add('slot-card');
            cardElement.textContent = heldCard;
            holdArea.appendChild(cardElement);
        }
    }

    function renderSlots() {
        slotArea.innerHTML = '';
        slots.forEach(type => {
            const slotCard = document.createElement('div');
            slotCard.classList.add('slot-card');
            slotCard.textContent = type;
            slotArea.appendChild(slotCard);
        });
    }

    function checkMatches() {
        const counts = {};
        slots.forEach(type => {
            counts[type] = (counts[type] || 0) + 1;
        });

        for (const type in counts) {
            if (counts[type] === 3) {
                slots = slots.filter(t => t !== type);
                renderSlots();
            }
        }

        checkWinOrLose();
    }

    function checkWinOrLose() {
        if (cards.length === 0 && slots.length === 0) {
            alert('Congratulations, you passed the level!');
            level++;
            saveGame();
            initGame();
        } else if (slots.length >= 7) {
            alert('Game over, please try again!');
            level = 1;
            saveGame();
            initGame();
        }
    }

    function updateDifficultyButtons() {
        if (difficulty === 'easy') {
            easyModeButton.classList.add('active');
            hardModeButton.classList.remove('active');
        } else {
            hardModeButton.classList.add('active');
            easyModeButton.classList.remove('active');
        }
    }

    resetButton.addEventListener('click', () => {
        level = 1;
        saveGame();
        initGame();
    });

    holdButton.addEventListener('click', holdCard);
    undoButton.addEventListener('click', undo);

    loadGame();
    initGame();
});

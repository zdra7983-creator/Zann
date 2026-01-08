document.addEventListener('DOMContentLoaded', function() {
    // Inisialisasi variabel dan state aplikasi
    let currentQueue = null;
    let queueHistory = [];
    let isSoundEnabled = true;
    let operators = [
        { id: 1, name: "Operator 1 - Pendaftaran", status: "tersedia", color: "#3498db" },
        { id: 2, name: "Operator 2 - Berkas", status: "tersedia", color: "#2ecc71" },
        { id: 3, name: "Operator 3 - Wawancara", status: "tersedia", color: "#e74c3c" },
        { id: 4, name: "Operator 4 - Tes Akademik", status: "tersedia", color: "#f39c12" },
        { id: 5, name: "Operator 5 - Administrasi", status: "tersedia", color: "#9b59b6" },
        { id: 6, name: "Operator 6 - Konsultasi", status: "tersedia", color: "#1abc9c" },
        { id: 7, name: "Operator 7 - Pembayaran", status: "tersedia", color: "#d35400" },
        { id: 8, name: "Operator 8 - Pengambilan ID", status: "tersedia", color: "#34495e" }
    ];
    
    // Inisialisasi Web Speech API
    const speech = new SpeechSynthesisUtterance();
    speech.lang = 'id-ID';
    speech.rate = 1.0;
    speech.pitch = 1.0;
    speech.volume = 1.0;
    
    // Set voice ke perempuan jika tersedia
    function setFemaleVoice() {
        const voices = window.speechSynthesis.getVoices();
        const femaleVoice = voices.find(voice => 
            voice.lang.includes('id') && voice.name.toLowerCase().includes('female')
        ) || voices.find(voice => voice.lang.includes('id'));
        
        if (femaleVoice) {
            speech.voice = femaleVoice;
        }
    }
    
    // Panggil fungsi setFemaleVoice setelah voices dimuat
    if (speechSynthesis.onvoiceschanged !== undefined) {
        speechSynthesis.onvoiceschanged = setFemaleVoice;
    }
    
    // Elemen DOM
    const currentQueueElement = document.getElementById('current-queue');
    const nextQueueElement = document.getElementById('next-queue');
    const currentOperatorElement = document.getElementById('current-operator');
    const nextOperatorElement = document.getElementById('next-operator');
    const queueNumberInput = document.getElementById('queue-number');
    const operatorSelect = document.getElementById('operator-select');
    const operatorColorElement = document.getElementById('operator-color');
    const callButton = document.getElementById('call-btn');
    const resetButton = document.getElementById('reset-btn');
    const increaseButton = document.getElementById('increase-btn');
    const decreaseButton = document.getElementById('decrease-btn');
    const soundToggle = document.getElementById('sound-toggle');
    const soundStatusElement = document.getElementById('sound-status');
    const operatorsContainer = document.getElementById('operators-container');
    const historyBody = document.getElementById('history-body');
    const emptyHistoryElement = document.getElementById('empty-history');
    const announcementSound = document.getElementById('announcement-sound');
    const currentDateElement = document.getElementById('current-date');
    
    // Set tanggal saat ini
    const now = new Date();
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    currentDateElement.textContent = now.toLocaleDateString('id-ID', options);
    
    // Inisialisasi operator cards
    function initOperators() {
        operatorsContainer.innerHTML = '';
        operators.forEach(operator => {
            const operatorCard = document.createElement('div');
            operatorCard.className = `operator-card ${operator.status === 'sibuk' ? 'active' : ''}`;
            operatorCard.innerHTML = `
                <div class="operator-number">${operator.id}</div>
                <div class="operator-name">${operator.name.split(' - ')[1]}</div>
                <div class="operator-status">${operator.status.toUpperCase()}</div>
            `;
            operatorCard.style.borderLeftColor = operator.color;
            operatorsContainer.appendChild(operatorCard);
        });
    }
    
    // Update operator color indicator
    function updateOperatorColor() {
        const selectedOperatorId = parseInt(operatorSelect.value);
        const selectedOperator = operators.find(op => op.id === selectedOperatorId);
        if (selectedOperator) {
            operatorColorElement.style.backgroundColor = selectedOperator.color;
        }
    }
    
    // Format nomor antrian dengan leading zeros
    function formatQueueNumber(num) {
        return num.toString().padStart(3, '0');
    }
    
    // Validasi input nomor antrian
    function validateQueueNumber(input) {
        let value = parseInt(input);
        if (isNaN(value) || value < 1) value = 1;
        if (value > 999) value = 999;
        return value;
    }
    
    // Update tampilan antrian
    function updateQueueDisplay() {
        if (currentQueue) {
            currentQueueElement.textContent = formatQueueNumber(currentQueue.number);
            currentOperatorElement.textContent = `Menuju ${currentQueue.operator}`;
            
            // Tampilkan antrian berikutnya jika ada
            if (queueHistory.length > 1) {
                const nextQueue = queueHistory[queueHistory.length - 2];
                nextQueueElement.textContent = formatQueueNumber(nextQueue.number);
                nextOperatorElement.textContent = `Menuju ${nextQueue.operator}`;
            } else {
                nextQueueElement.textContent = '-';
                nextOperatorElement.textContent = '-';
            }
        } else {
            currentQueueElement.textContent = '-';
            currentOperatorElement.textContent = 'Silahkan tekan tombol panggil';
            nextQueueElement.textContent = '-';
            nextOperatorElement.textContent = '-';
        }
    }
    
    // Update riwayat antrian
    function updateHistory() {
        if (queueHistory.length === 0) {
            emptyHistoryElement.style.display = 'block';
            historyBody.innerHTML = '';
            return;
        }
        
        emptyHistoryElement.style.display = 'none';
        historyBody.innerHTML = '';
        
        // Tampilkan 10 riwayat terbaru
        const recentHistory = queueHistory.slice(-10).reverse();
        
        recentHistory.forEach(item => {
            const row = document.createElement('tr');
            
            const timeCell = document.createElement('td');
            timeCell.textContent = item.time;
            
            const numberCell = document.createElement('td');
            numberCell.textContent = formatQueueNumber(item.number);
            numberCell.style.fontWeight = 'bold';
            numberCell.style.fontSize = '1.2rem';
            
            const operatorCell = document.createElement('td');
            operatorCell.textContent = item.operator;
            
            const statusCell = document.createElement('td');
            const statusBadge = document.createElement('span');
            statusBadge.className = 'status-badge status-called';
            statusBadge.textContent = 'DIPANGGIL';
            statusCell.appendChild(statusBadge);
            
            row.appendChild(timeCell);
            row.appendChild(numberCell);
            row.appendChild(operatorCell);
            row.appendChild(statusCell);
            
            historyBody.appendChild(row);
        });
    }
    
    // Fungsi untuk membacakan pengumuman
    function announceQueue(number, operator) {
        if (!isSoundEnabled) return;
        
        // Putar suara notifikasi
        announcementSound.currentTime = 0;
        announcementSound.play().catch(e => console.log("Autoplay prevented:", e));
        
        // Tunggu sebentar sebelum membaca pengumuman
        setTimeout(() => {
            const operatorName = operator.split(' - ')[1];
            const announcementText = `Nomor antrian ${number.split('').join(' ')}. Silahkan menuju ${operatorName}.`;
            
            speech.text = announcementText;
            window.speechSynthesis.speak(speech);
        }, 500);
    }
    
    // Event Listeners
    queueNumberInput.addEventListener('input', function() {
        let value = validateQueueNumber(this.value);
        this.value = formatQueueNumber(value);
    });
    
    queueNumberInput.addEventListener('blur', function() {
        if (this.value === '') {
            this.value = '001';
        }
    });
    
    increaseButton.addEventListener('click', function() {
        let currentValue = parseInt(queueNumberInput.value) || 1;
        currentValue = currentValue >= 999 ? 1 : currentValue + 1;
        queueNumberInput.value = formatQueueNumber(currentValue);
    });
    
    decreaseButton.addEventListener('click', function() {
        let currentValue = parseInt(queueNumberInput.value) || 1;
        currentValue = currentValue <= 1 ? 999 : currentValue - 1;
        queueNumberInput.value = formatQueueNumber(currentValue);
    });
    
    operatorSelect.addEventListener('change', updateOperatorColor);
    
    soundToggle.addEventListener('change', function() {
        isSoundEnabled = this.checked;
        soundStatusElement.textContent = isSoundEnabled ? 'AKTIF' : 'NONAKTIF';
    });
    
    callButton.addEventListener('click', function() {
        const queueNumber = validateQueueNumber(queueNumberInput.value);
        const operatorId = parseInt(operatorSelect.value);
        const selectedOperator = operators.find(op => op.id === operatorId);
        
        if (!selectedOperator) return;
        
        // Update status operator menjadi sibuk
        operators.forEach(op => {
            if (op.id === operatorId) {
                op.status = 'sibuk';
            }
        });
        
        // Simpan antrian saat ini ke riwayat
        const now = new Date();
        const timeString = now.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
        
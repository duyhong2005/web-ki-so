const socket = io('http://localhost:5000', {
    reconnection: true,
    reconnectionAttempts: 5,
    transports: ['websocket']
});

// Debug Socket.IO connection
socket.on('connect', () => console.log('✅ Connected to Socket.IO server'));
socket.on('disconnect', () => console.log('❌ Disconnected from Socket.IO server'));
socket.on('connect_error', (err) => console.error('Socket.IO connection error:', err));

// Global variables
let publicKeyBase64 = '';
let privateKeyBase64 = '';
let receivedData = null;

// ================= SENDER FUNCTIONS =================
async function generateKey() {
    try {
        const keyPair = await window.crypto.subtle.generateKey(
            {
                name: 'RSASSA-PKCS1-v1_5',
                modulusLength: 2048,
                publicExponent: new Uint8Array([1, 0, 1]),
                hash: 'SHA-256'
            },
            true,
            ['sign', 'verify']
        );

        const [publicKey, privateKey] = await Promise.all([
            window.crypto.subtle.exportKey('spki', keyPair.publicKey),
            window.crypto.subtle.exportKey('pkcs8', keyPair.privateKey)
        ]);

        publicKeyBase64 = arrayBufferToBase64(publicKey);
        privateKeyBase64 = arrayBufferToBase64(privateKey);

        document.getElementById('pubKey').value = publicKeyBase64;
        document.getElementById('priKey').value = privateKeyBase64;
        document.getElementById('inputPriKey').value = privateKeyBase64;
        
        showStatus('Keys generated successfully!', 'success');
    } catch (error) {
        showStatus('Error generating keys: ' + error.message, 'error');
    }
}

async function signAndSend() {
    const fileInput = document.getElementById('fileInput');
    if (!fileInput.files || fileInput.files.length === 0) {
        showStatus('Please select a file first', 'error');
        return;
    }

    const privateKey = document.getElementById('inputPriKey').value.trim();
    if (!privateKey) {
        showStatus('Please enter your private key', 'error');
        return;
    }

    try {
        const file = fileInput.files[0];
        const fileData = await readFileAsArrayBuffer(file);
        const signature = await signData(privateKey, fileData);

        socket.emit('send_file', {
            fileName: file.name,
            fileData: arrayBufferToBase64(fileData),
            signature: signature,
            publicKey: publicKeyBase64,
            fileType: file.type
        });

        showStatus(`File "${file.name}" sent successfully!`, 'success');
    } catch (error) {
        showStatus('Error signing/sending file: ' + error.message, 'error');
    }
}

// ================= RECEIVER FUNCTIONS =================
socket.on('receive_file', (data) => {
    console.log('📥 Received file data:', data);
    receivedData = data;

    // Update UI
    document.getElementById('fileInfo').innerHTML = `
        <strong>File Name:</strong> ${data.fileName}<br>
        <strong>File Type:</strong> ${data.fileType || 'unknown'}<br>
        <strong>Received at:</strong> ${new Date().toLocaleString()}
    `;

    // Display file preview or download link
    const byteString = atob(data.fileData);
    const buffer = new Uint8Array(byteString.length);
    for (let i = 0; i < byteString.length; i++) {
        buffer[i] = byteString.charCodeAt(i);
    }
    const blob = new Blob([buffer], { type: data.fileType });
    const url = URL.createObjectURL(blob);

    let preview = '';
    if (data.fileType.startsWith('image/')) {
        preview = `<img id="filePreview" src="${url}" alt="Preview" style="max-width: 100%; max-height: 300px;">`;
    }

    document.getElementById('filePreview').innerHTML = preview;
    document.getElementById('fileDownload').innerHTML = `
        <a href="${url}" download="${data.fileName}" class="download-btn">Download File</a>
    `;

    // Fill public key
    document.getElementById('pubKeyReceiver').value = data.publicKey;
    document.getElementById('verifyResult').innerHTML = '';
});

async function verifySignature() {
    if (!receivedData) {
        document.getElementById('verifyResult').innerHTML = 
            '<div class="error">No data received to verify!</div>';
        return;
    }

    try {
        const publicKey = await window.crypto.subtle.importKey(
            'spki',
            base64ToArrayBuffer(receivedData.publicKey),
            { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' },
            false,
            ['verify']
        );

        const isValid = await window.crypto.subtle.verify(
            { name: 'RSASSA-PKCS1-v1_5' },
            publicKey,
            base64ToArrayBuffer(receivedData.signature),
            base64ToArrayBuffer(receivedData.fileData)
        );

        const resultDiv = document.getElementById('verifyResult');
        if (isValid) {
            resultDiv.innerHTML = '<div class="valid">✅ Signature is VALID</div>';
        } else {
            resultDiv.innerHTML = '<div class="invalid">❌ Signature is INVALID</div>';
        }
    } catch (error) {
        document.getElementById('verifyResult').innerHTML = 
            `<div class="error">Verification error: ${error.message}</div>`;
    }
}

// ================= UTILITY FUNCTIONS =================
async function signData(privateKeyBase64, data) {
    const privateKey = await window.crypto.subtle.importKey(
        'pkcs8',
        base64ToArrayBuffer(privateKeyBase64),
        { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' },
        false,
        ['sign']
    );

    const signature = await window.crypto.subtle.sign(
        { name: 'RSASSA-PKCS1-v1_5' },
        privateKey,
        data
    );

    return arrayBufferToBase64(signature);
}

function readFileAsArrayBuffer(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = () => reject(new Error('Failed to read file'));
        reader.readAsArrayBuffer(file);
    });
}

function arrayBufferToBase64(buffer) {
    return btoa(String.fromCharCode(...new Uint8Array(buffer)));
}

function base64ToArrayBuffer(base64) {
    const binaryString = atob(base64);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
    }
    return bytes.buffer;
}

function showStatus(message, type) {
    const statusDiv = document.getElementById('status');
    statusDiv.textContent = message;
    statusDiv.className = type;
}
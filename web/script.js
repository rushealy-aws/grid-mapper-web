// Grid Mapper Web Application JavaScript

class GridMapperApp {
    constructor() {
        this.apiUrl = '/api/generate-map';
        this.initializeEventListeners();
    }

    initializeEventListeners() {
        const form = document.getElementById('mapGeneratorForm');
        const fileInput = document.getElementById('logFile');
        const resetBtn = form.querySelector('button[type="reset"]');

        form.addEventListener('submit', (e) => this.handleFormSubmit(e));
        fileInput.addEventListener('change', (e) => this.handleFileSelect(e));
        resetBtn.addEventListener('click', () => this.resetForm());
    }

    async handleFormSubmit(event) {
        event.preventDefault();
        
        const formData = new FormData(event.target);
        const callsign = formData.get('callsign');
        const continents = formData.getAll('continents');
        
        // Get file content
        const fileInput = document.getElementById('logFile');
        const textContent = document.getElementById('logContent').value;
        
        let fileContent = '';
        let fileName = 'contest_log.txt';
        
        if (fileInput.files.length > 0) {
            const file = fileInput.files[0];
            fileName = file.name;
            try {
                fileContent = await this.readFileAsBase64(file);
            } catch (error) {
                this.showError('Error reading file: ' + error.message);
                return;
            }
        } else if (textContent.trim()) {
            fileContent = btoa(textContent); // Base64 encode text content
            fileName = 'pasted_log.txt';
        } else {
            this.showError('Please select a file or paste log content.');
            return;
        }

        if (!callsign.trim()) {
            this.showError('Please enter your station callsign.');
            return;
        }

        await this.generateMaps({
            callsign: callsign.toUpperCase(),
            continents: continents,
            fileContent: fileContent,
            fileName: fileName
        });
    }

    async readFileAsBase64(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result);
            reader.onerror = reject;
            reader.readAsDataURL(file);
        });
    }

    async generateMaps(data) {
        this.showLoading(true);
        this.hideError();
        this.hideResults();

        try {
            const response = await fetch(this.apiUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(data)
            });

            const result = await response.json();

            if (!response.ok) {
                throw new Error(result.error || 'Failed to generate maps');
            }

            if (result.success) {
                this.showResults(result);
            } else {
                throw new Error(result.error || 'Map generation failed');
            }

        } catch (error) {
            console.error('Error generating maps:', error);
            this.showError('Error generating maps: ' + error.message);
        } finally {
            this.showLoading(false);
        }
    }

    showLoading(show) {
        const loadingIndicator = document.getElementById('loadingIndicator');
        const generateBtn = document.getElementById('generateBtn');
        
        if (show) {
            loadingIndicator.classList.remove('hidden');
            generateBtn.disabled = true;
            generateBtn.textContent = 'Generating...';
        } else {
            loadingIndicator.classList.add('hidden');
            generateBtn.disabled = false;
            generateBtn.textContent = 'Generate Maps';
        }
    }

    showResults(result) {
        const resultsDiv = document.getElementById('results');
        const mapsListDiv = document.getElementById('mapsList');
        
        resultsDiv.classList.remove('hidden');
        
        let html = `
            <div class="result-summary">
                <h3>Success! Generated ${result.mapsGenerated} map(s) for ${result.callsign}</h3>
                <p>Your maps are ready for download. Links will expire in 1 hour.</p>
            </div>
        `;

        if (result.maps && result.maps.length > 0) {
            result.maps.forEach(map => {
                const bandInfo = this.extractBandInfo(map.filename);
                html += `
                    <div class="map-item">
                        <div class="map-info">
                            <h4>${map.filename}</h4>
                            <small>${bandInfo}</small>
                        </div>
                        <a href="${map.downloadUrl}" class="download-btn" download="${map.filename}">
                            Download Map
                        </a>
                    </div>
                `;
            });
        }

        if (result.logOutput) {
            html += `
                <details style="margin-top: 20px;">
                    <summary>Processing Log</summary>
                    <pre style="background: #f5f5f5; padding: 10px; border-radius: 4px; font-size: 12px; overflow-x: auto;">${result.logOutput}</pre>
                </details>
            `;
        }

        mapsListDiv.innerHTML = html;
    }

    extractBandInfo(filename) {
        // Extract band and region information from filename
        const parts = filename.replace('.png', '').split('_');
        if (parts.length >= 3) {
            const band = parts[1];
            const region = parts.slice(2).join(' ').replace(/_/g, ' ');
            return `${band} band - ${region}`;
        }
        return 'Contest map';
    }

    showError(message) {
        const errorDiv = document.getElementById('errorMessage');
        errorDiv.textContent = message;
        errorDiv.classList.remove('hidden');
    }

    hideError() {
        const errorDiv = document.getElementById('errorMessage');
        errorDiv.classList.add('hidden');
    }

    hideResults() {
        const resultsDiv = document.getElementById('results');
        resultsDiv.classList.add('hidden');
    }

    handleFileSelect(event) {
        const file = event.target.files[0];
        if (file) {
            // Clear text area when file is selected
            document.getElementById('logContent').value = '';
            
            // Show file info
            const fileInfo = document.querySelector('.file-info');
            fileInfo.innerHTML = `
                <small>Selected: ${file.name} (${this.formatFileSize(file.size)})</small>
            `;
        }
    }

    formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    resetForm() {
        this.hideError();
        this.hideResults();
        this.showLoading(false);
        
        // Reset file info
        const fileInfo = document.querySelector('.file-info');
        fileInfo.innerHTML = '<small>Supported formats: Cabrillo (.cbr, .log) and CSV (.csv) files</small>';
    }
}

// Initialize the application when the DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new GridMapperApp();
});

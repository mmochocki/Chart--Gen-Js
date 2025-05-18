/**
 * Parses CSV file content
 * @param {string} text - CSV file content
 * @returns {Object} Object containing headers and data
 */
function parseCSV(text) {
    const lines = text.trim().split('\n');
    const headers = lines[0].split(',').map(header => header.trim());
    const data = lines.slice(1).map(line => 
        line.split(',').map(cell => cell.trim())
    );
    return { headers, data };
}

/**
 * Parses XLSX file content
 * @param {ArrayBuffer} arrayBuffer - XLSX file content
 * @returns {Object} Object containing headers and data
 */
function parseXLSX(arrayBuffer) {
    const workbook = XLSX.read(arrayBuffer);
    const firstSheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[firstSheetName];
    const data = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
    const headers = data[0].map(header => header.trim());
    const rows = data.slice(1).map(row => 
        row.map(cell => cell ? cell.toString().trim() : '')
    );
    return { headers, data: rows };
}

// File upload handling
document.getElementById('fileInput').addEventListener('change', function(e) {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    
    reader.onerror = function() {
        console.error('Error loading file');
        alert('An error occurred while loading the file. Please try again.');
    };

    if (file.name.toLowerCase().endsWith('.csv')) {
        reader.onload = function(event) {
            try {
                const text = event.target.result;
                const { headers, data } = parseCSV(text);
                console.log('CSV data loaded:', { headers, rowCount: data.length });
                // Chart rendering function will be called here
            } catch (error) {
                console.error('CSV parsing error:', error);
                alert('Error parsing CSV file. Please check the file format.');
            }
        };
        reader.readAsText(file);
    } else if (file.name.toLowerCase().match(/\.xlsx?$/)) {
        reader.onload = function(event) {
            try {
                const arrayBuffer = event.target.result;
                const { headers, data } = parseXLSX(arrayBuffer);
                console.log('XLSX data loaded:', { headers, rowCount: data.length });
                // Chart rendering function will be called here
            } catch (error) {
                console.error('XLSX parsing error:', error);
                alert('Error parsing XLSX file. Please check the file format.');
            }
        };
        reader.readAsArrayBuffer(file);
    } else {
        alert('Unsupported file format. Please select a CSV or XLSX file.');
    }
}); 